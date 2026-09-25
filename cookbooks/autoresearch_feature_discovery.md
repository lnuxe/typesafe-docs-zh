# Autoresearch 特征发现

> 跑一个 autoresearch 循环：提出 TypeSafe 问题、把自由文本转成数值特征，再用模型的误差改进一个有监督的 CatBoost 回归器。

*TypeSafe 问题把自由文本变成有监督 CatBoost 模型能用的数值特征；
再用一个 autoresearch 循环把它们找出来。*

CatBoost 需要一张数字表，而一条品鉴笔记不是数字表。这个 cookbook 用关于这条笔记的问题
把表搭出来，而且没有一个问题是手写的。LLM 提出这些问题，TypeSafe 为每一行回答它们，
CatBoost 在答案上训练。接下来才是 autoresearch 的部分：CatBoost 报告它用了哪些问题、
还有哪些行仍然预测错，下一轮的提议调用读取这份报告，循环再跑一遍。

最后你会得到一个可以指向你自己带标签文本的循环、一条逐轮的留出误差曲线，
以及一张说明最终模型最常用哪些问题的表。

```
tasting note
    |
    v
38 TypeSafe answers
    |-- 29 score questions x 2 columns = 58
    |     expected rubric level + answer uncertainty
    `--  9 noul questions  x 1 column  =  9
          probability true
    |
    v
67 numeric columns --> CatBoost --> predicted critic score
                                     held-out RMSE: 1.77 points
```

一个 Score 答案会变成两列：答案指向的平均档位，以及它在平均值周围的分散程度。
一个 Noul 答案是一个概率，所以只有一列。

数据是 2,000 条葡萄酒评论：输入一条品鉴笔记，输出评论家给出的 80-100 分。RMSE 用分数
衡量预测误差，错得越多罚得越重，越低越好。下面表格里的每个数字都来自模型和循环都没见过
的那 800 条评论。

| 笔记如何变成一个分数                                    | RMSE     |
| ------------------------------------------------------- | -------- |
| 预测训练行的平均分                                      | 3.09     |
| 同一个 CatBoost，把笔记当作词频读入                     | 2.47     |
| 直接问 TypeSafe 要分数，再做缩放和平移                  | 2.15     |
| 一次提议调用得到的 18 个问题，不跑循环                  | 1.87     |
| **跑五轮循环之后的 38 个问题**                          | **1.77** |

最后两行是循环带来的。第一次提议调用没有任何依据，就能到 1.87。之后又跑四轮，让模型
读自己错得最狠的预测，才到 1.77。收益的大头在第一次调用，后面四轮究竟加了多少，
在下面会测出来。

<Tip>
  想把这个 notebook 继续做深，或者用到别的问题上？见
  [下一步](#next-steps)。
</Tip>

```python expandable theme={null}
from __future__ import annotations

import json
import os
import random
import textwrap
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from time import perf_counter
from typing import NamedTuple

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
from catboost import CatBoostRegressor
from cooksafe import JsonCache, make_playground_link
from IPython.display import Markdown, display
from typesafe_sdk import Noul, NoulCriteria, Score, TypeSafeClient

matplotlib.use("Agg")  # headless render

TYPESAFE_MODEL = "jev-1.12"
FOLDS, REPEATS = 5, 3  # repeats steady the error at this sample size
CATBOOST = dict(
    iterations=400,
    depth=4,
    learning_rate=0.05,
    loss_function="RMSE",
    verbose=0,
    random_seed=0,
    thread_count=1,
    allow_writing_files=False,
)

client = TypeSafeClient(
    # keyless kernels replay the cache
    api_key=os.environ.get("TYPESAFE_API_KEY", "cache-only"),
    base_url=os.environ.get("TYPESAFE_ENDPOINT"),
    timeout=120.0,
)
json_cache = JsonCache(Path("json_cache.json"))

# ----------------------------------------------------------------- the specification

INTENSITY_LEVELS = [
    "Not present in this note at all",
    "Barely present - mentioned once, in passing",
    "Present at a moderate level",
    "Present strongly - the note dwells on it",
    "Dominant - the note is largely about this",
]
PRESENCE_CRITERIA = NoulCriteria(
    true="The note states this or clearly implies it",
    false="The note gives no indication of this",
)

# Asking for the score outright: ten quality bands, rescaled onto the 80-100 critic scale.
SCORE_LEVELS = [
    "Faulty or unpleasant - the note is mostly criticism",
    "Barely acceptable - drinkable, with nothing to recommend it",
    "Simple and sound - correct, plain, forgettable",
    "Pleasant everyday wine - some appeal, little depth",
    "Good - clear varietal character, well made",
    "Very good - balanced, with something to say",
    "Excellent - complex and structured",
    "Outstanding - depth and length, built to age",
    "Superb - among the best of its type",
    "Profound - the note treats it as exceptional",
]

# Structured output requires every property in `required`, so unused fields come back empty.
PROPOSAL_SCHEMA = {
    "type": "object",
    "properties": {
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "op": {"type": "string", "enum": ["add", "revise", "drop"]},
                    "target": {"type": "string"},
                    "name": {"type": "string"},
                    "kind": {"type": "string", "enum": ["intensity", "presence"]},
                    "question": {"type": "string"},
                },
                "required": ["op", "target", "name", "kind", "question"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["actions"],
    "additionalProperties": False,
}

PROPOSALS = 18  # actions the proposer may return per round

# The one string that knows this is about wine. Point it at your own label and text.
PROPOSER_TASK = f"""You are designing numeric features for a gradient-boosting model that
predicts the score a wine critic gave (an integer from 80 to 100) from the tasting note alone.
The model sees nothing but the features you design.

Return up to {PROPOSALS} actions. Each action is one of:

- {{"op": "add", "target": "", "name": ..., "kind": ..., "question": ...}}
  A new feature.
- {{"op": "revise", "target": <name of an existing feature>, "name": ..., "kind": ...,
  "question": ...}}
  Replace that feature's question with better wording. Use this when a feature measures the
  right thing badly: too narrow, too vague, or worded so nearly every note answers the same.
- {{"op": "drop", "target": <name of an existing feature>, "name": "", "kind": "intensity",
  "question": ""}}
  Remove a feature that is not earning its place.

`kind` is "intensity" for something with a degree, or "presence" for a yes/no fact.
`question` is what gets asked about one tasting note.

An "intensity" question is graded against this fixed five-level rubric, so word it so that the
levels make sense:
{chr(10).join(f"  {i}. {level}" for i, level in enumerate(INTENSITY_LEVELS))}

A "presence" question is answered as the probability that it is true of the note.

Good features can be judged from the note's own words, vary from note to note, and carry
information about quality that the other features do not. Reviewers describe structure, fruit,
oak, length, complexity, and drinkability, and they also signal quality through word choice."""


class Split(NamedTuple):
    """The rows, their labels, and which half the loop is allowed to read."""

    notes: list[str]
    scores: np.ndarray
    dev: np.ndarray
    test: np.ndarray


# ----------------------------------------------------------------- the data

WINEMAG_CSV = (
    "https://huggingface.co/datasets/GroNLP/ik-nlp-22_winemag/resolve/"
    "90eb39f35fc64e556fc17f06d4137a4a69ec3297/train.csv"
)


@json_cache
def load_slice(n_dev: int, n_test: int, seed: int) -> dict:
    """Fetch the pinned CSV and take a seeded sample of note + score, one row per note."""
    import csv
    import io

    request = urllib.request.Request(
        WINEMAG_CSV, headers={"User-Agent": "typesafe-cookbook/1.0"}
    )
    with urllib.request.urlopen(request, timeout=300) as response:
        text = response.read().decode()
    rows, seen = [], set()
    for row in csv.DictReader(io.StringIO(text)):  # a few notes repeat verbatim
        if not row["description"] or not row["points"] or row["description"] in seen:
            continue
        seen.add(row["description"])
        rows.append((row["description"], float(row["points"])))
    random.Random(seed).shuffle(rows)
    picked = rows[: n_dev + n_test]
    return {"notes": [r[0] for r in picked], "points": [r[1] for r in picked]}


def example_rows(split: Split, out_of_fold: np.ndarray | None, n: int) -> list[int]:
    """Select representative dev rows for a proposer round."""
    dev = split.dev
    if out_of_fold is None:
        ranked = dev[np.argsort(split.scores[dev], kind="stable")]
        return [int(ranked[round(q * (len(ranked) - 1))]) for q in np.linspace(0, 1, n)]
    error = np.abs(split.scores[dev] - out_of_fold)
    order = np.argsort(-error, kind="stable")
    worst = [int(dev[i]) for i in order[: n // 2]]
    best = [int(dev[i]) for i in order[len(order) - (n - n // 2) :]]
    return worst + best


def example_block(
    rows: list[int],
    split: Split,
    out_of_fold: np.ndarray | None,
    previous: np.ndarray | None = None,
) -> str:
    """Format selected rows for the proposer."""
    if out_of_fold is None:
        head = "Example notes, with the score each one was given:"
        body = [f"- scored {split.scores[r]:.0f}: {split.notes[r]}" for r in rows]
        return head + "\n" + "\n".join(body)

    head = (
        "Dev notes, worst-predicted first. The first half is where your current questions "
        "miss by the most and the second half is where they are already right, so what "
        "separates the halves is what the questions have not captured."
    )
    if previous is not None:
        head += (
            " Each line also carries what the previous round predicted, so you can see which "
            "notes your last batch of questions moved."
        )
    body = []
    for r in rows:
        line = f"- scored {split.scores[r]:.0f}, predicted {out_of_fold[r]:.1f}"
        if previous is not None:
            line += f" (last round {previous[r]:.1f})"
        body.append(f"{line}: {split.notes[r]}")
    return head + "\n" + "\n".join(body)


def load_split(n_dev: int, n_test: int, seed: int = 0) -> Split:
    # keyword, because the cache key is the function name plus how each argument was spelled
    data = load_slice(n_dev, n_test, seed=seed)
    return Split(
        notes=data["notes"],
        scores=np.array(data["points"]),
        dev=np.arange(n_dev),
        test=np.arange(n_dev, n_dev + n_test),
    )


# ----------------------------------------------------------------- step 1: propose


def proposal_prompt(examples: str, feedback: str, accepted: list[dict]) -> str:
    parts = [PROPOSER_TASK, "\n" + examples]
    if accepted:
        parts.append(
            "\nThe features you have now. `add` must not duplicate one of these; `revise` and "
            "`drop` refer to one by name:\n"
            + "\n".join(
                f"- {f['name']} ({f['kind']}): {f['question']}" for f in accepted
            )
        )
    if feedback:
        parts.append("\nHow the model did with those features:\n" + feedback)
    return "\n".join(parts)


@json_cache
def propose(model: str, round_index: int, prompt: str) -> dict:
    """One proposal call. Every number in `prompt` is rounded so a replay hits the cache."""
    if model.startswith("claude"):
        import anthropic

        response = anthropic.Anthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY", "cache-only")
        ).messages.create(
            model=model,
            max_tokens=16000,
            output_config={
                "effort": "medium",
                "format": {"type": "json_schema", "schema": PROPOSAL_SCHEMA},
            },
            messages=[{"role": "user", "content": prompt}],
        )
        body = next(block.text for block in response.content if block.type == "text")
        usage = [response.usage.input_tokens or 0, response.usage.output_tokens or 0]
    else:
        from openai import OpenAI

        response = OpenAI(
            api_key=os.environ.get("OPENAI_API_KEY", "cache-only")
        ).chat.completions.create(
            model=model,
            reasoning_effort="high",
            max_completion_tokens=16000,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "user",
                    "content": prompt
                    + "\n\nReply with JSON matching this schema:\n"
                    + json.dumps(PROPOSAL_SCHEMA),
                }
            ],
        )
        body = response.choices[0].message.content
        usage = [response.usage.prompt_tokens, response.usage.completion_tokens]
    return {"actions": json.loads(body)["actions"][:PROPOSALS], "usage": usage}


def slug(name: str, taken: set[str]) -> str:
    """Names become question ids and column labels, so keep them plain and unique."""
    base = (
        "".join(c if c.isalnum() else "_" for c in name.lower()).strip("_") or "feature"
    )
    candidate, n = base, 2
    while candidate in taken:
        candidate, n = f"{base}_{n}", n + 1
    return candidate


def to_candidates(actions: list[dict], accepted: list[dict], round_index: int) -> tuple:
    """Split a round's actions into screenable candidates and a list of names to drop."""
    live = {f["name"] for f in accepted}
    drops = [a["target"] for a in actions if a["op"] == "drop" and a["target"] in live]
    replacing = {
        a["target"] for a in actions if a["op"] == "revise" and a["target"] in live
    }
    # a revision may keep the name it replaces, since that feature is on its way out
    taken, candidates = live - replacing, []
    for action in actions:
        if action["op"] == "drop":
            continue
        if action["op"] == "revise" and action["target"] not in live:
            continue  # a revision of something that is not there
        name = slug(action["name"], taken)
        taken.add(name)
        candidates.append(
            {
                "id": f"{name}@{round_index}",  # unique, so earlier rounds keep their columns
                "name": name,
                "kind": action["kind"],
                "question": action["question"],
                "replaces": action["target"] if action["op"] == "revise" else "",
            }
        )
    return candidates, drops


# ----------------------------------------------------------------- step 2: answer


def feature_questions(features: list[dict]) -> dict:
    questions = {}
    for feature in features:
        if feature["kind"] == "intensity":
            questions[feature["name"]] = Score(
                instructions=feature["question"], criteria=INTENSITY_LEVELS
            )
        else:
            questions[feature["name"]] = Noul(
                instructions=feature["question"], criteria=PRESENCE_CRITERIA
            )
    return questions


@json_cache
def answer(model: str, note: str, features_json: str) -> dict:
    """One request per note; every question of the round rides it. Keeps every probability."""
    features = json.loads(features_json)
    started = perf_counter()
    response = client.system_one(
        state=note, questions=feature_questions(features), model=model
    )
    raw = {}
    for feature in features:
        got = response.answers[feature["name"]]
        if feature["kind"] == "intensity":
            raw[feature["name"]] = [
                got.probabilities.get(i, 0.0) for i in range(len(INTENSITY_LEVELS))
            ]
        else:
            raw[feature["name"]] = [got.noul]
    return {
        "raw": raw,
        "seconds": round(perf_counter() - started, 2),
        "input_tokens": response.usage.input_tokens or 0,
        "output_tokens": response.usage.output_tokens or 0,
    }


def featurize(notes: list[str], features: list[dict]) -> dict:
    """Answer one question set for many notes: one request each, eight in flight."""
    payload = json.dumps(features, sort_keys=True)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(
            pool.map(lambda note: answer(TYPESAFE_MODEL, note, payload), notes)
        )
    return {
        f["name"]: np.array([r["raw"][f["name"]] for r in results], dtype=float)
        for f in features
    }


def encode(feature: dict, probabilities: np.ndarray, mode: str) -> list[tuple]:
    """Turn one question's probabilities into named columns."""
    name = feature["name"]
    if feature["kind"] == "presence":
        return [(name, probabilities[:, 0])]  # one number is all there is
    levels = np.arange(probabilities.shape[1])
    mean = probabilities @ levels
    if mode == "mean":
        return [(name, mean)]
    if mode == "mean_spread":
        variance = probabilities @ (levels**2) - mean**2
        return [(name, mean), (f"{name}_sd", np.sqrt(np.clip(variance, 0, None)))]
    return [(f"{name}_p{i}", probabilities[:, i]) for i in levels]


def design(features: list[dict], answers_for: dict, mode: str) -> tuple:
    """Stack every feature's columns into one matrix, plus a label per column."""
    columns, labels = [], []
    for feature in features:
        for label, column in encode(feature, answers_for[feature["id"]], mode):
            columns.append(column)
            labels.append(label)
    return np.column_stack(columns), labels


def plain(features: list[dict]) -> list[dict]:
    """What goes on the wire and into the cache key: no id, no bookkeeping."""
    return [
        {"name": f["name"], "kind": f["kind"], "question": f["question"]}
        for f in features
    ]


# ----------------------------------------------------------------- step 3: fit


def rmse(y: np.ndarray, p: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y - p) ** 2)))


def spearman(a: np.ndarray, b: np.ndarray) -> float:
    """Rank correlation: does the model order the wines the way the critic did?"""
    ranks = (
        np.argsort(np.argsort(a)).astype(float),
        np.argsort(np.argsort(b)).astype(float),
    )
    return float(np.corrcoef(*ranks)[0, 1])


def folds(y: np.ndarray, k: int, seed: int) -> list[np.ndarray]:
    """Label-stratified k-fold: sort by the label with a seeded tiebreak, then deal off the top."""
    rng = np.random.default_rng(seed)
    order = np.lexsort((rng.random(len(y)), y))
    return [np.sort(order[i::k]) for i in range(k)]


def cross_validate(X: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, float]:
    out_of_fold = np.zeros((REPEATS, len(y)))
    for repeat in range(REPEATS):
        for fold in folds(y, FOLDS, seed=repeat):
            train = np.setdiff1d(np.arange(len(y)), fold)
            model = CatBoostRegressor(**CATBOOST).fit(X[train], y[train])
            out_of_fold[repeat, fold] = model.predict(X[fold])
    scores = [rmse(y, out_of_fold[repeat]) for repeat in range(REPEATS)]
    return out_of_fold.mean(axis=0), float(np.mean(scores))


def importances(X: np.ndarray, y: np.ndarray) -> np.ndarray:
    return CatBoostRegressor(**CATBOOST).fit(X, y).get_feature_importance()


def paired_gain(y: np.ndarray, before: np.ndarray, after: np.ndarray) -> tuple:
    """Bootstrap the paired held-out RMSE change."""
    squared = ((y - before) ** 2, (y - after) ** 2)
    rng = np.random.default_rng(0)
    drawn = []
    for _ in range(2000):
        rows = rng.integers(0, len(y), len(y))
        drawn.append(
            np.sqrt(squared[1][rows].mean()) - np.sqrt(squared[0][rows].mean())
        )
    drawn = np.array(drawn)
    return (
        rmse(y, after) - rmse(y, before),
        float(np.percentile(drawn, 2.5)),
        float(np.percentile(drawn, 97.5)),
    )


def fit_predict(X: np.ndarray, split: Split) -> np.ndarray:
    model = CatBoostRegressor(**CATBOOST).fit(X[split.dev], split.scores[split.dev])
    return model.predict(X[split.test])


def fit_predict_text(split: Split) -> np.ndarray:
    """The reference arm: the same model, handed the note instead of the columns."""
    from catboost import Pool

    raw = np.array([[note] for note in split.notes], dtype=object)
    model = CatBoostRegressor(**CATBOOST).fit(
        Pool(raw[split.dev], split.scores[split.dev], text_features=[0])
    )
    return model.predict(Pool(raw[split.test], text_features=[0]))


def evaluate(
    features: list[dict], answers_for: dict, split: Split, mode: str
) -> tuple[np.ndarray, float]:
    """Cross-validated error on the dev rows for one candidate question set."""
    X, _ = design(features, answers_for, mode)
    return cross_validate(X[split.dev], split.scores[split.dev])


def swap_in(accepted: list[dict], feature: dict) -> list[dict] | None:
    """The accepted set with `feature` in place of the one it revises, or None if it is gone."""
    at = next(
        (i for i, f in enumerate(accepted) if f["name"] == feature["replaces"]), None
    )
    if at is None:
        return None
    trial = list(accepted)
    trial[at] = {k: feature[k] for k in ("id", "name", "kind", "question")}
    return trial


def try_change(
    trial: list[dict],
    accepted: list[dict],
    cv: float,
    answers_for: dict,
    split: Split,
    mode: str,
    tolerance: float,
) -> tuple[list[dict], float, str, bool]:
    """Refit with the change and keep it only if the dev error improves. No API calls."""
    _, cv_trial = evaluate(trial, answers_for, split, mode)
    if cv_trial <= cv + tolerance:
        return trial, cv_trial, f"CV {cv:.3f} -> {cv_trial:.3f}", True
    return accepted, cv, f"would cost {cv_trial - cv:+.3f}", False


def owner_of(label: str, features: list[dict]) -> dict:
    """Which feature a column label belongs to - encodings suffix the name."""
    exact = next((f for f in features if f["name"] == label), None)
    if exact:
        return exact
    return next(f for f in features if label.startswith(f["name"] + "_"))


def importance_per_feature(
    features: list[dict], labels: list[str], column_importances: np.ndarray
) -> dict:
    """Sum each question's CatBoost column importances.

    Intensity questions can produce multiple model columns. Combining their normalized
    importances gives one percentage share per question.
    """
    total = {f["name"]: 0.0 for f in features}
    for label, column_importance in zip(labels, column_importances):
        total[owner_of(label, features)["name"]] += float(column_importance)
    return total


def feedback_for(
    history: list[float],
    accepted: list[dict],
    answers_for: dict,
    split: Split,
    mode: str,
    out_of_fold: np.ndarray,
    previous: np.ndarray | None,
) -> str:
    """The scoreboard the next proposal call reads. The notes themselves arrive separately,
    through `example_block`. Numbers are rounded before they enter the prompt."""
    X, labels = design(accepted, answers_for, mode)
    dev, scores = split.dev, split.scores
    by_name = importance_per_feature(accepted, labels, importances(X[dev], scores[dev]))

    lines = ["Cross-validated RMSE in points so far, lower is better:"]
    lines += [f"  round {i + 1}: {v:.2f}" for i, v in enumerate(history)]
    if previous is not None:
        now, before = np.abs(scores[dev] - out_of_fold), np.abs(scores[dev] - previous)
        better, worse = int((now < before - 0.1).sum()), int((now > before + 0.1).sum())
        lines.append(
            f"\nAgainst the previous round, {better} of the {len(dev)} dev notes are now "
            f"predicted better by more than 0.1 points and {worse} are predicted worse."
        )
    lines.append(
        "\nYour features, with importance as a percentage of the total and the spread of the "
        "column across the dev rows. Low importance or low spread means the question is not "
        "doing much; revise or drop it."
    )
    for feature in sorted(accepted, key=lambda f: -by_name.get(f["name"], 0.0)):
        column = encode(feature, answers_for[feature["id"]], mode)[0][1]
        lines.append(
            f"  {feature['name']} ({feature['kind']}): "
            f"{by_name.get(feature['name'], 0.0):.1f}% importance, "
            f"spread {column[dev].std():.2f}"
        )
    return "\n".join(lines)


# ----------------------------------------------------------------- the loop itself


class Discovery(NamedTuple):
    """Artifacts returned by the discovery loop."""

    accepted: list[dict]  # the question set it ended with
    answers_for: dict  # feature id -> (rows x levels) probabilities
    snapshots: list[list[dict]]  # the set as it stood at the end of each round
    history: list[float]  # dev CV error after each round
    batches: list[tuple]  # what each round sent, for the request table
    journal: list[tuple]  # every action and what became of it


def run_loop(
    split: Split,
    proposer: str,
    rounds: int,
    examples: int,
    mode: str,
    min_spread: float,
    tolerance: float,
) -> Discovery:
    """Run the propose, answer, fit, and feedback loop."""
    shown = example_rows(split, None, examples)  # round 1 has nothing predicted yet
    out_of_fold = previous = None
    got_from = Discovery([], {}, [], [], [], [])
    accepted, answers_for = got_from.accepted, got_from.answers_for
    snapshots, history = got_from.snapshots, got_from.history
    batches, journal = got_from.batches, got_from.journal
    feedback = ""

    for round_index in range(1, rounds + 1):
        block = example_block(shown, split, out_of_fold, previous)
        actions = propose(
            proposer, round_index, proposal_prompt(block, feedback, accepted)
        )["actions"]
        keep, drops = to_candidates(actions, accepted, round_index)

        if keep:  # one request per row, carrying every question this round proposed
            batches.append((round_index, plain(keep)))
            answers = featurize(split.notes, plain(keep))
            for feature in keep:
                answers_for[feature["id"]] = answers[feature["name"]]

        for (
            feature
        ) in keep:  # an add goes in; importance says later whether it earned it
            if feature["replaces"]:
                continue
            column = encode(feature, answers_for[feature["id"]], mode)[0][1]
            flat = float(column[split.dev].std()) < min_spread
            journal.append(
                (round_index, "flat" if flat else "add", feature["name"], "")
            )
            if not flat:
                accepted.append(
                    {k: feature[k] for k in ("id", "name", "kind", "question")}
                )

        _, cv = evaluate(accepted, answers_for, split, mode)
        trial_args = (answers_for, split, mode, tolerance)

        for feature in [f for f in keep if f["replaces"]]:  # every revision is tried
            trial = swap_in(accepted, feature)
            if trial is None:  # it revises something an earlier round already dropped
                journal.append(
                    (round_index, "stale", feature["name"], "target is gone")
                )
                continue
            accepted[:], cv, note, took = try_change(trial, accepted, cv, *trial_args)
            what = "revise" if took else "reject"
            journal.append(
                (
                    round_index,
                    what,
                    feature["name"],
                    f"was {feature['replaces']}, {note}",
                )
            )

        for name in drops:  # and so is every drop
            trial = [f for f in accepted if f["name"] != name]
            if not trial:
                continue
            accepted[:], cv, note, took = try_change(trial, accepted, cv, *trial_args)
            journal.append((round_index, "drop" if took else "keep", name, note))

        previous, (out_of_fold, cv) = (
            out_of_fold,
            evaluate(accepted, answers_for, split, mode),
        )
        history.append(cv)
        snapshots.append(list(accepted))
        feedback = feedback_for(
            history, accepted, answers_for, split, mode, out_of_fold, previous
        )
        # next round reads the rows these questions get most wrong, and as many they get right
        shown = example_rows(split, out_of_fold, examples)
        report(round_index, keep, drops, journal, accepted, cv)

    return got_from


def report(
    round_index: int,
    keep: list[dict],
    drops: list[str],
    journal: list[tuple],
    accepted: list[dict],
    cv: float,
) -> None:
    """One block per round: the counts, the names it added, then everything with a number."""
    revised = sum(1 for f in keep if f["replaces"])
    print(
        f"round {round_index}: {len(keep) - revised} add, {revised} revise, "
        f"{len(drops)} drop"
    )
    this_round = [j for j in journal if j[0] == round_index]
    added = [name for _, what, name, _ in this_round if what == "add"]
    if added:
        print(
            textwrap.fill(
                ", ".join(added),
                88,
                initial_indent="  added  ",
                subsequent_indent=" " * 10,
            )
        )
    for _, what, name, note in this_round:  # everything carrying a number of its own
        if what != "add":
            print(f"  {what:<7}{name:<34}{note}")
    print(f"  -> {len(accepted)} features, dev CV RMSE {cv:.3f}\n")


# ----------------------------------------------------------------- asking for the score


@json_cache
def ask_score(model: str, note: str) -> dict:
    """One `Score` over ten quality bands, read as a level and rescaled to 80-100."""
    response = client.system_one(
        state=note,
        questions={
            "quality": Score(
                instructions=(
                    "Judging only by what this tasting note says, how good is the wine?"
                ),
                criteria=SCORE_LEVELS,
            )
        },
        model=model,
    )
    got = response.answers["quality"]
    top = len(SCORE_LEVELS) - 1
    expected = sum(k * v for k, v in got.probabilities.items())
    return {
        # level 0 is the bottom of the critic's scale, level 9 the top
        "expected": 80.0 + 20.0 * expected / top,
        "picked": 80.0 + 20.0 * got.score / top,
        "input_tokens": response.usage.input_tokens or 0,
        "output_tokens": response.usage.output_tokens or 0,
    }


# ----------------------------------------------------------------- charts

SURFACE, INK, INK2, MUTED = "#fcfcfb", "#0b0b0b", "#52514e", "#898781"
GRID, AXIS, BLUE, ORANGE = "#e1e0d9", "#c3c2b7", "#2a78d6", "#eb6834"


def style(ax) -> None:
    ax.set_facecolor(SURFACE)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(AXIS)
    ax.tick_params(colors=MUTED, labelcolor=INK2, labelsize=9)
    ax.set_axisbelow(True)


def polarity(feature: dict, answers_for: dict, split: Split) -> float:
    """Rank correlation between a question's answer and the critic score, on the dev rows.

    Positive means a higher answer goes with a better review, negative the opposite. It is
    what orders the rows of the feature map, so the map reads as a gradient that flips.
    """
    column = encode(feature, answers_for[feature["id"]], "mean")[0][1]
    return spearman(column[split.dev], split.scores[split.dev])


def reviews_heatmap(
    plt,
    questions: list[dict],
    answers_for: dict,
    split: Split,
    rows: tuple,
):
    """Compare held-out reviews across the discovered questions, best-signal first.

    Rows arrive sorted from the questions that rise with the score to the ones that fall with
    it, so a row above the divider shades left to right and a row below it shades right to
    left.
    """

    def value_of(feature: dict, row: int) -> float:
        return float(encode(feature, answers_for[feature["id"]], "mean")[0][1][row])

    signs = [polarity(question, answers_for, split) for question in questions]
    flip = next((i for i, s in enumerate(signs) if s < 0), len(questions))

    raw = np.array(
        [[value_of(question, row) for row in rows] for question in questions]
    )
    normalized = np.array(
        [
            values / (4 if question["kind"] == "intensity" else 1)
            for question, values in zip(questions, raw)
        ]
    )
    cmap = matplotlib.colors.LinearSegmentedColormap.from_list(
        "typesafe_heat", [SURFACE, "#f7c7ad", ORANGE]
    )
    fig, ax = plt.subplots(
        figsize=(9.5, 1.8 + 0.58 * len(questions)), facecolor=SURFACE
    )
    image = ax.imshow(normalized, aspect="auto", cmap=cmap, vmin=0, vmax=1)
    row_labels = []
    for question, sign in zip(questions, signs):
        kind = "score" if question["kind"] == "intensity" else "noul"
        prefix = f"{sign:+.2f} ({kind}) "
        lines = textwrap.wrap(
            " ".join(question["question"].split()),
            width=52,
            max_lines=2,
            placeholder="...",
            break_long_words=False,
            break_on_hyphens=False,
        )
        row_labels.append(prefix + (f"\n{' ' * len(prefix)}").join(lines))
    column_labels = [
        f"#{i}\n{split.scores[row]:.0f} points\n{' '.join(split.notes[row].split())[:15]}..."
        for i, row in enumerate(rows, 1)
    ]
    ax.set_yticks(np.arange(len(questions)), row_labels)
    ax.set_xticks(np.arange(len(rows)), column_labels)
    ax.tick_params(
        axis="x", top=True, labeltop=True, bottom=False, labelbottom=False, pad=8
    )
    ax.tick_params(axis="y", labelsize=8.5)
    for side in ax.spines.values():
        side.set_visible(False)
    ax.set_xticks(np.arange(-0.5, len(rows), 1), minor=True)
    ax.set_yticks(np.arange(-0.5, len(questions), 1), minor=True)
    ax.grid(which="minor", color=SURFACE, linewidth=2)
    ax.tick_params(which="minor", bottom=False, left=False)
    for i, question in enumerate(questions):
        for j, value in enumerate(raw[i]):
            label = (
                f"{value:.1f}" if question["kind"] == "intensity" else f"{value:.2f}"
            )
            color = SURFACE if normalized[i, j] > 0.58 else INK2
            ax.text(j, i, label, ha="center", va="center", color=color, fontsize=8)
    # the line where the questions stop rising with the score and start falling with it
    if 0 < flip < len(questions):
        ax.axhline(flip - 0.5, color=INK, linewidth=1.2)
        ax.annotate(
            "a higher answer means a worse review, below this line",
            (len(rows) - 0.5, flip - 0.5),
            xytext=(-4, 5),
            textcoords="offset points",
            va="bottom",
            ha="right",
            color=INK2,
            fontsize=8.5,
        )
    colorbar = fig.colorbar(image, ax=ax, fraction=0.025, pad=0.025)
    colorbar.set_ticks([0, 0.5, 1])
    colorbar.set_label("normalized answer", color=INK2, fontsize=8.5)
    colorbar.ax.tick_params(labelsize=8, colors=INK2)
    fig.suptitle(
        "Every question, on five held-out reviews from worst to best",
        x=0.01,
        y=0.995,
        ha="left",
        color=INK,
        fontsize=11,
    )
    fig.text(
        0.01,
        0.972,
        "sorted by how the answer moves with the score, so each row above the line shades "
        "left to right and each row below it shades the other way",
        color=MUTED,
        fontsize=9,
    )
    fig.text(
        0.01,
        0.005,
        "Row labels lead with the rank correlation between that question's answer and the "
        "critic score. Cell text is each question's native scale: score 0-4, noul 0-1.",
        color=MUTED,
        fontsize=8.5,
    )
    return fig


def rounds_chart(
    plt, curve: list[tuple], history: list[float], n_test: int, gain: tuple
):
    """Dev error and held-out error per round. The trend is the point, not the gap."""
    rounds = list(range(1, len(curve) + 1))
    values = [v for _, v in curve]

    fig, ax = plt.subplots(figsize=(7, 3.9), facecolor=SURFACE)
    style(ax)
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    # each dev fold trains on four fifths of the rows, so the dev line sits the higher of the two
    ax.fill_between(rounds, history, values, color=GRID, alpha=0.75, linewidth=0)
    ax.plot(
        rounds,
        history,
        marker="o",
        color=BLUE,
        linewidth=2,
        linestyle="--",
        label="dev, cross-validated - what the loop optimises",
    )
    ax.plot(
        rounds,
        values,
        marker="o",
        color=ORANGE,
        linewidth=2,
        label="held out - what that actually buys",
    )
    # label each point on the outside of the pair, so neither line crowds its own numbers
    for x, dev_value, test_value in zip(rounds, history, values):
        for value, other in ((dev_value, test_value), (test_value, dev_value)):
            ax.annotate(
                f"{value:.2f}",
                (x, value),
                textcoords="offset points",
                xytext=(0, 8 if value >= other else -16),
                ha="center",
                color=INK2,
                fontsize=8.5,
            )
    ax.set_xticks(
        rounds, [f"round {x}\n{n} features" for x, (n, _) in zip(rounds, curve)]
    )
    ax.set_ylabel("RMSE in points (lower is better)", color=INK2, fontsize=9)
    # tight around the two lines: the whole finding lives inside 0.15 of a point
    low, high = min(values + history), max(values + history)
    ax.set_ylim(low - 0.10, high + 0.05)
    difference, low_ci, high_ci = gain
    ax.set_title(
        f"{len(rounds)} rounds of the loop, scored on {n_test} held-out reviews",
        loc="left",
        color=INK,
        fontsize=11,
        pad=20,
    )
    # the number the chart is really about: is the held-out move bigger than the noise?
    ax.text(
        0,
        1.015,
        f"round 1 to round {len(rounds)}, held out: {difference:+.3f} points, "
        f"95% CI [{low_ci:+.3f}, {high_ci:+.3f}]",
        transform=ax.transAxes,
        color=MUTED,
        fontsize=9,
    )
    ax.legend(frameon=False, labelcolor=INK2, fontsize=9, loc="lower left")
    return fig
```

## 环境准备

```bash theme={null}
pip install anthropic openai catboost numpy matplotlib ipython 'cooksafe>=0.2.0,<0.3.0'
```

然后设置 `TYPESAFE_API_KEY` 和 `ANTHROPIC_API_KEY`。每次 API 调用都会缓存到
`json_cache.json`，这个文件随 cookbook 一起提供，所以重新渲染时直接回放这些数字，
不调用任何接口。删掉它就能真跑一遍。这些数字来自 2026-08-03 的 TypeSafe
`jev-1.12` 和 `claude-sonnet-5`。`propose()` 里还有一条给 `gpt-5.6-luna` 的分支，
没有跑过。

第一个代码单元就是全部实现：API 调用、编码、指标、图表样式。把它放在这里是为了让这个
文件能独立运行，文档站点会把它折叠起来。第一遍读可以直接跳过，做法从它下面开始。

```python theme={null}
N_DEV, N_TEST = 1200, 800  # the loop reads dev labels only; test is scored once
ROUNDS = 5  # a round answers questions for all 2,000 rows: 2,000 requests
PROPOSER = "claude-sonnet-5"  # or "gpt-5.6-luna"; the cache holds the Anthropic run
EXAMPLES = 60  # dev notes the proposer reads per round, half of them its worst misses
MIN_SPREAD = 0.05  # a column this flat cannot separate anything, so it is not kept
CHANGE_TOLERANCE = 0.0  # a revision or drop has to improve dev error, not just not hurt
ENCODING = "mean_spread"  # a score answer becomes two columns: its mean and spread

split = load_split(N_DEV, N_TEST, seed=0)
NOTES, SCORES, DEV, TEST = split.notes, split.scores, split.dev, split.test

print(
    f"{len(DEV)} dev rows, {len(TEST)} held out; scores run "
    f"{SCORES.min():.0f}-{SCORES.max():.0f}, mean {SCORES.mean():.2f}, sd {SCORES.std():.2f}"
)
print(f"\none of the notes:\n{NOTES[0]}")
```

```
1200 dev rows, 800 held out; scores run 80-98, mean 88.73, sd 3.17

one of the notes:
A Champagne that is very much wine. The structure and the richness are just right for a food wine, showing ripe acidity, flavors of plums and apricots, and balancing these primary fruits with a dense, complex structure that takes in yeast, maturity and a tight apple skin finish.
```

循环反复读取这 2,000 行里的同 1,200 行（dev 行），只要某个问题有助于预测这 1,200 个分数
就保留它。在同一批行上评分，多半只是在衡量循环把自己拟合得有多好，所以另外 800 行被留
出来，直到最后才评一次。

## 两类问题

提议出来的问题只有两种，是哪一种决定了返回什么数字。

* **`intensity`** 会变成一个 `Score`，用于有程度之分的东西。它的五个档位打印在
  下面，这一列取的是平均档位，所以落在 "moderate" 和 "strongly" 之间的笔记，
  结果就在两者之间。
* **`presence`** 会变成一个 `Noul`，用于是/否的事实，比如是否点出了某个缺陷。
  这一列就是那一个概率。

## 方法

```
questions <- {}
repeat for each round:
    notes  <- round 1 ? 60 dev notes across the score range
                      : the 30 worst-predicted dev notes + the 30 best,
                        each with its score, this prediction and the last
    actions <- LLM(brief, questions, notes, importance and error so far)
    answers[q] <- TypeSafe(note, all new questions of this round) for every row
    for each added q:      keep it unless its column is flat
    for each revised q:    refit; keep the change only if dev error drops
    for each dropped q:    refit; drop it only if dev error drops
    out_of_fold <- k-fold CatBoost on the columns   # judges, and picks next round's notes
```

没有任何问题会在被回答之前就被筛掉。一轮里的所有问题都在同一次请求里发出，所以多问一个
问题不需要多一次请求。只适用于十分之一行的问题，在提议者读到的那 60 条笔记里看着没用，
却仍可能是整套问题里最有用的那一列。

k 折（k-fold）指把 dev 行切成 k 份，每一份都用其余几份训练出来的模型来预测。这些预测
有三项用途：评判每一次修改和删除、挑出下一轮要读的笔记，以及告诉提议者它哪些问题起了
作用——依据是这些问题相比上一轮移动了多少。

```python theme={null}
print("every intensity question is graded on these five levels:\n")
for i, level in enumerate(INTENSITY_LEVELS):
    print(f"  {i}. {level}")
print("\nevery presence question is judged true or false against these:\n")
print(f"  true:  {PRESENCE_CRITERIA['true']}")
print(f"  false: {PRESENCE_CRITERIA['false']}")
print("\nthe brief the proposer works from:\n")
print("\n".join(PROPOSER_TASK.splitlines()[:6]) + "\n  ...")
```

```
every intensity question is graded on these five levels:

  0. Not present in this note at all
  1. Barely present - mentioned once, in passing
  2. Present at a moderate level
  3. Present strongly - the note dwells on it
  4. Dominant - the note is largely about this

every presence question is judged true or false against these:

  true:  The note states this or clearly implies it
  false: The note gives no indication of this

the brief the proposer works from:

You are designing numeric features for a gradient-boosting model that
predicts the score a wine critic gave (an integer from 80 to 100) from the tasting note alone.
The model sees nothing but the features you design.

Return up to 18 actions. Each action is one of:

  ...
```

## autoresearch 循环

`run_loop` 跑完五轮，每轮打印一个区块。新增的问题直接进：它的答案已经取回来了，之后
它的重要度会说明它值不值得问。修改或删除会拿掉模型正在用的一列，所以每一个都先试一次：
带着改动重新拟合，只有 dev 误差下降才保留。重新拟合不花 API 调用，所以试一个改动再否掉
它是免费的。

```python theme={null}
run = run_loop(
    split, PROPOSER, ROUNDS, EXAMPLES, ENCODING, MIN_SPREAD, CHANGE_TOLERANCE
)
accepted, answers_for = run.accepted, run.answers_for
snapshots, history = run.snapshots, run.history
```

```text expandable theme={null}
round 1: 18 add, 0 revise, 0 drop
  added  complexity, fruit_intensity, tannin_structure, acidity_intensity,
          oak_intensity, finish_length, balance_harmony, aging_potential,
          positive_superlative_language, negative_critical_language,
          drinkability_easiness, body_richness, sweetness_level, texture_descriptors,
          earthy_savory_notes, flaw_or_defect_mentioned,
          single_vineyard_or_prestige_signal, varietal_blend_detail
  -> 18 features, dev CV RMSE 1.903

round 2: 5 add, 3 revise, 3 drop
  added  power_concentration_language, flavor_distinctiveness, generic_fruit_language,
          candied_artificial_flavor, rustic_authentic_character
  reject oak_dominance                     was oak_intensity, would cost +0.005
  revise negative_critical_language        was negative_critical_language, CV 1.897 -> 1.894
  revise single_vineyard_or_prestige_signalwas single_vineyard_or_prestige_signal, CV 1.894 -> 1.881
  keep   finish_length                     would cost +0.009
  keep   texture_descriptors               would cost +0.001
  keep   varietal_blend_detail             would cost +0.023
  -> 23 features, dev CV RMSE 1.881

round 3: 7 add, 2 revise, 1 drop
  added  elegance_finesse_language, minerality_precision_language,
          hedged_qualified_praise, underripe_green_character,
          reviewer_overall_verdict_strength, unusual_or_funky_descriptor_valence,
          botrytis_or_special_winemaking_signal
  revise negative_critical_language        was negative_critical_language, CV 1.868 -> 1.864
  revise finish_quality                    was finish_length, CV 1.864 -> 1.861
  keep   candied_artificial_flavor         would cost +0.014
  -> 30 features, dev CV RMSE 1.861

round 4: 5 add, 2 revise, 3 drop
  added  excess_or_imbalance_signal, descriptive_detail_density,
          critic_enthusiasm_confidence, savory_food_wine_seriousness,
          note_overall_tone_positivity
  revise rustic_authentic_character        was rustic_authentic_character, CV 1.843 -> 1.838
  reject hedged_qualified_praise           was hedged_qualified_praise, would cost +0.014
  keep   botrytis_or_special_winemaking_signalwould cost +0.011
  keep   candied_artificial_flavor         would cost +0.009
  keep   unusual_or_funky_descriptor_valencewould cost +0.010
  -> 35 features, dev CV RMSE 1.838

round 5: 4 add, 2 revise, 8 drop
  added  structural_seriousness, youthful_tension_signal, surface_prettiness_vs_depth,
          price_value_signal
  reject unconventional_character_as_virtuewas rustic_authentic_character, would cost +0.010
  revise flavor_distinctiveness            was flavor_distinctiveness, CV 1.849 -> 1.843
  keep   candied_artificial_flavor         would cost +0.002
  keep   botrytis_or_special_winemaking_signalwould cost +0.003
  keep   hedged_qualified_praise           would cost +0.006
  keep   excess_or_imbalance_signal        would cost +0.005
  drop   underripe_green_character         CV 1.843 -> 1.840
  keep   unusual_or_funky_descriptor_valencewould cost +0.002
  keep   texture_descriptors               would cost +0.001
  keep   generic_fruit_language            would cost +0.000
  -> 38 features, dev CV RMSE 1.840
```

## 换成你自己的数据

`PROPOSER_TASK` 是唯一提到葡萄酒的字符串，而 `featurize()` 接受任何字符串列表。改动这段
任务说明就会改变提议用的提示词，而提示词是缓存键的一部分，所以下次运行每一轮都会重新
调用 API。

请求数随行数增长，而不是随问题数增长：每一轮里每行一次请求，所以 100,000 行就是每轮
100,000 次请求。一次修改算一个新问题，因此要再扫一遍所有行。worker 池要慢慢往大调，
在共享的 key 上，八个线程已经足以撞上速率限制。

## 这些问题看到了什么

五条留出的评论，分别落在分数范围的四个等分点上，对上 38 个问题里的 15 个：按重要度排的
前八个 Score 问题，加上前七个 Noul。

这十五行随后按答案随评论家分数变化的方向排序。答案随分数上升的问题排在前面，答案随分数
下降的问题排在分隔线之后。所以从左到右、从最差的评论到最好的评论，分隔线以上的答案应当
逐渐升高，分隔线以下的答案应当逐渐降低。

```python theme={null}
X, labels = design(accepted, answers_for, ENCODING)
column_importances = importances(X[DEV], SCORES[DEV])
# an encoding gives a feature more than one column, so add a feature's columns back up
feature_importances = importance_per_feature(accepted, labels, column_importances)
ranked = sorted(accepted, key=lambda f: -feature_importances[f["name"]])
score_questions = [f for f in ranked if f["kind"] == "intensity"][:8]
noul_questions = [f for f in ranked if f["kind"] == "presence"][:7]
# ordered by which way the answer moves with the score, so the map flips halfway down
heatmap_questions = sorted(
    score_questions + noul_questions,
    key=lambda f: -polarity(f, answers_for, split),
)
ordered_test = TEST[np.argsort(SCORES[TEST], kind="stable")]
positions = np.linspace(0, len(ordered_test) - 1, 5).round().astype(int)
review_rows = tuple(ordered_test[positions])

print("the five held-out heatmap columns:\n")
for i, row in enumerate(review_rows, 1):
    excerpt = " ".join(NOTES[row].split())
    print(f"  {i}. {SCORES[row]:.0f} points: {excerpt[:100]}...")

fig = reviews_heatmap(plt, heatmap_questions, answers_for, split, review_rows)
display(fig)
plt.close(fig)
```

```
the five held-out heatmap columns:

  1. 80 points: Raw cherry and plum aromas are resiny and suggest wet cement. This is shearing and so jacked up with...
  2. 86 points: A slight spritz brightens the mouthfeel of this lemony wine. Aromas are a bit musky, but flavors of ...
  3. 89 points: This is a European-style Syrah, cofermented with 2% Viognier. It's soft and round, medium in body, a...
  4. 91 points: From the producer's dry-farmed estate vineyard, and supported by small amounts of Merlot and Caberne...
  5. 97 points: A thoroughly elegant, serious and yet immensely enjoyable wine that stays lively many days after ope...
```

<img src="https://mintcdn.com/ts-docs/2NirYCl-v96cw05F/cookbooks/autoresearch_feature_discovery/autoresearch_feature_discovery.executed.1.png?fit=max&auto=format&n=2NirYCl-v96cw05F&q=85&s=9a9c9e88ad39b5cc6ae00db22d38b9d5" alt="output" width="1882" height="1593" data-path="cookbooks/autoresearch_feature_discovery/autoresearch_feature_discovery.executed.1.png" />

页面顶部那张表，现在算出来。五个对照组都在同一批 800 条留出行上评一次，前三个不做特征
发现。一个预测 dev 分数的平均值，完全不读笔记。一个把笔记交给同一个 CatBoost，走它的
`text_features` 处理，也就是把笔记变成词频。一个直接问 TypeSafe 要分数。

第三个是每行一个 `Score`，覆盖十个质量档位，从 "faulty or unpleasant" 到 "profound"。
之所以是十个，是因为一个 `Score` 问题最多只能有十档——十一档会返回服务器错误。档位 0
对应 80 分，档位 9 对应 100 分。光把档位摊在这个范围上还不够，因为问题里没有任何东西说明
这家媒体的分数实际落在哪里。所以每个答案随后再按一个偏移量平移，这个偏移量是在 dev 分数
上测出来的。它打印在行标签里，也是这个捷径唯一从分数里学到的东西。

Spearman 是秩相关，取 1.0 意味着留出的这些酒排序与评论家完全一致。词频那一行是 CatBoost
自带的文本处理，不是调过的文本回归流水线。所有这些都只来自一个数据集和循环的一次运行。

```python theme={null}
predicted = fit_predict(X, split)
text_predicted = fit_predict_text(split)

# ask TypeSafe for the score itself, one request per row
with ThreadPoolExecutor(max_workers=8) as pool:
    direct = list(pool.map(lambda note: ask_score(TYPESAFE_MODEL, note), NOTES))
asked = np.array([d["expected"] for d in direct])
shift = float(SCORES[DEV].mean() - asked[DEV].mean())  # one number, from the dev labels

# what one proposal call gets you, before any feedback: the set round 1 ended with
first_round, _ = design(snapshots[0], answers_for, ENCODING)

print(f"{'arm':<46}{'RMSE':>7}{'spearman':>10}")
for label, p in (
    ("predict the mean of the dev rows", np.full(len(TEST), SCORES[DEV].mean())),
    ("the note as word counts, same CatBoost", text_predicted),
    (f"ask for the score itself, shifted {shift:+.2f}", asked[TEST] + shift),
    (
        f"{len(snapshots[0])} questions from round 1, no loop",
        fit_predict(first_round, split),
    ),
    (f"{len(accepted)} questions after all {ROUNDS} rounds", predicted),
):
    print(f"{label:<46}{rmse(SCORES[TEST], p):>7.3f}{spearman(SCORES[TEST], p):>10.3f}")
```

```
arm                                              RMSE  spearman
predict the mean of the dev rows                3.088    -0.014
the note as word counts, same CatBoost          2.466     0.605
ask for the score itself, shifted -1.71         2.145     0.761
18 questions from round 1, no loop              1.869     0.778
38 questions after all 5 rounds                 1.772     0.799
```

## autoresearch 的几轮搜索有用吗？

两条线画的都是每一轮结束时问题集的误差，起点是第一次提议。虚线是交叉验证的 dev 误差，
也就是所有接受和拒绝决策依据的那个数字。实线用同一套问题集在留出行上评分，而循环从不读
这些行。每个点都是该轮结束时的问题集，所以一轮即使只修改或删除了一个问题，两条线也都会
移动。特征图说明这些问题在量什么；误差才告诉你第一次提议之后的几轮有没有让预测变得更好。

纵轴范围很窄：线上发生的一切都在五分之一点之内，而上面表格里的每个捷径都远在它上方。
dev 线全程都在留出线之上，这是训练集大小的效应。每个 dev 折只用 dev 行的五分之四来训练，
而留出那个数字来自见过全部 1,200 行的模型。两条线一起移动，所以循环用来掌舵的 dev 数字能
跟上它从未见过的留出数字。标题下面的区间来自对留出行的重采样，说明从第 1 轮到第 5 轮的
移动是否大于 800 行里的噪声。

```python theme={null}
curve, per_round = [], []
for features in snapshots:
    X_round, _ = design(features, answers_for, ENCODING)
    per_round.append(fit_predict(X_round, split))
    curve.append((len(features), rmse(SCORES[TEST], per_round[-1])))

# the same held-out rows resampled 2,000 times, both arms scored on each resample
gain = paired_gain(SCORES[TEST], per_round[0], per_round[-1])
print(
    f"round 1 -> round {ROUNDS} on the held-out rows: {gain[0]:+.3f} points, "
    f"95% CI [{gain[1]:+.3f}, {gain[2]:+.3f}]"
)

fig = rounds_chart(plt, curve, history, len(TEST), gain)
display(fig)
plt.close(fig)
```

```
round 1 -> round 5 on the held-out rows: -0.097 points, 95% CI [-0.147, -0.050]
```

<img src="https://mintcdn.com/ts-docs/2NirYCl-v96cw05F/cookbooks/autoresearch_feature_discovery/autoresearch_feature_discovery.executed.2.png?fit=max&auto=format&n=2NirYCl-v96cw05F&q=85&s=8e122e0435a22f9f18f4a3d780f06e69" alt="output" width="945" height="599" data-path="cookbooks/autoresearch_feature_discovery/autoresearch_feature_discovery.executed.2.png" />

留出线比 dev 线降得更多。第 1 轮是在没有任何反馈可依据的情况下写出它的问题的，之后四轮
在留出行上值 0.10 分，95% CI \[-0.147, -0.050]。

第 5 轮提议了四个新增、两处改写和八个删除，给出了第一个没有改善的 dev 数字。一条 245
字符的笔记能问的东西就那么多，到第 5 轮时，提议已经从加问题倒向了删问题。

```python theme={null}
kinds = {f["name"]: f["kind"] for f in accepted}
print("feature importance share: % of total CatBoost importance across all questions")
print(f"{'feature':<38}{'asked as':<10}{'importance share':>16}")
for name, importance_share in sorted(feature_importances.items(), key=lambda p: -p[1])[
    :12
]:
    kind = "score" if kinds[name] == "intensity" else "noul"
    print(
        f"{name[:36]:<38}{kind:<10}{importance_share:>8.1f}%  "
        f"{'#' * round(importance_share)}"
    )
counts = f"{sum(1 for k in kinds.values() if k == 'intensity')} score"
counts += f", {sum(1 for k in kinds.values() if k == 'presence')} noul"
print(f"\nthe {len(accepted)} questions the loop kept: {counts}")
top = max(feature_importances, key=feature_importances.get)
print(
    f'the question behind the top row:\n  {top}: "{owner_of(top, accepted)["question"]}"'
)
```

```
feature importance share: % of total CatBoost importance across all questions
feature                               asked as  importance share
note_overall_tone_positivity          score         17.4%  #################
savory_food_wine_seriousness          score          8.7%  #########
positive_superlative_language         score          8.4%  ########
single_vineyard_or_prestige_signal    noul           7.2%  #######
descriptive_detail_density            score          5.7%  ######
elegance_finesse_language             score          5.0%  #####
complexity                            score          5.0%  #####
aging_potential                       score          5.0%  #####
balance_harmony                       score          2.9%  ###
drinkability_easiness                 score          2.9%  ###
critic_enthusiasm_confidence          score          2.7%  ###
flavor_distinctiveness                score          2.6%  ###

the 38 questions the loop kept: 29 score, 9 noul
the question behind the top row:
  note_overall_tone_positivity: "Setting aside specific descriptors, how positive is the overall emotional tone and word choice of the note taken as a whole (warm, admiring language throughout vs. flat, neutral, or lukewarm phrasing)?"
```

`importance share` 是 CatBoost 的特征重要度，做了归一化，让 38 个问题加起来是 100%。它
不是行数占比、问题数占比，也不是预测准确率的占比。一个 Score 问题占两列，一列均值一列
分散度，所以打印百分比之前会把它两列的重要度加回去。`note_overall_tone_positivity` 占
全部的 17.4%。第四行是一个 Noul：笔记是否点出单一葡萄园或其他某种声望信号，这是一个是/否
事实，所以就按是/否来问。

## 下一步 {#next-steps}
这次运行把循环控制在很小的规模。可以直接往下扩展的方向：

* 在花钱回答之前先筛一遍候选。把提议出来的问题本身当作状态，对它问 Noul：它能否从源
  文本回答、在它的判据下含义是否唯一、是否适用于大多数行、是否会在不同行之间有变化。
  只把四个条件都以足够置信度通过的问题发出去。
* 剪掉相关的特征。在 dev 行上测量编码后各列之间的相关性，把近似重复的聚成一簇，每个簇
  里只保留最清晰或最重要的那个问题。
* 加上简单的基线。先单独比较 TF-IDF、字符数和其他结构特征，再把它们接到发现出来的列后面，
  看看各自贡献了什么。
* 混用不同家族的提议者。用 Anthropic、OpenAI、Google Gemini 和开源模型分别生成候选批次，
  在它们送进 TypeSafe 之前先合并去重。不同家族对搜索的拓宽，应当超过反复调用同一个提议者。
* 比较不同的预测模型和方法。可以试线性回归或弹性网络回归、支持向量回归、随机森林，以及
  在下游输出是概率时的重新校准。看看发现出来的特征在 CatBoost 之外是否也有用。
* 加上一个 embedding 基线。embedding 把一条笔记变成几百个数字，不带任何问题：
  `sentence-transformers/all-MiniLM-L6-v2` 可以本地运行，OpenAI 的
  `text-embedding-3-small` 是托管调用。把一个 embedding 接到发现出来的列后面，测量它
  是否携带了这些列没有的信息。
* 让验证方式匹配上线场景。预测未来时用按时间切分，相关的行必须待在一起时用分组切分，
  并且留一个最终测试集，特征发现和模型选择都不许碰它。
* 在平台期停下来。当交叉验证 RMSE 连续固定轮数没有改善，或者到达问题数、请求数预算时，
  结束循环。
* 在智能体的 Goal mode 下跑更长的搜索。给它明确的指标、预算和停止规则，然后让它多提议、
  多评估、多打磨几轮。
* 检查稳定性。换几个随机种子或数据切片重复做特征发现，保留那些始终有用的问题，而不是
  重要度只挂在某一次切分上的问题。

## 在 Playground 中打开

这个分享链接里有一条品鉴笔记，加上循环最终留下的每一个问题。

```python theme={null}
playground_link = make_playground_link(
    NOTES[0], feature_questions(accepted), models=[TYPESAFE_MODEL]
)
display(
    Markdown(
        f"🔗 [Open the note + questions in the TypeSafe playground]({playground_link})"
    )
)
```

<a href="https://console.typesafe.ai/playground#share/N4IgJg9gxgrgtgUwHYBcAqCAeKQC4AEIAgvgMIAWAhnAA6UDmSC+KVK+AlgM74BuCAJwCe+ODCjl8Adw5MAdPjTlmXFAPEoYA5pSRgWy-AI4SmXHpW34AVjFVGO9cuwBmEAfkr43EfTKYANPhc5BD+9A40OlAcYBwoQkEuADaUvO48EC74NMnwFnqeNMZQEChcQbr6AEaUqUgxSBGsCFzMxRxwliIu6vE8Mqye+GDIbUGltMlYwWoaWsyslOwolADWrZxI+EIIlKpBXZrGCZ6FXiiOzkW5Kmuy3rLc5HIgQSDFELTlGNh4hMAADogSa3TDxITAghAkAJKJQ-DArilbTAoLAqAnQQcSgIgDawIAcmUcto2qgtgZuPgkGUdOw6sk0YiQAAhSwIZIiYqtZDsAC0oj5HAgTH0oqgCCCDzo5lk9GZwIACmS+Z4GaJfIJlsxpvwmW8WSreRTVAJRfQufhBS0aXSRlJOclMtt4oqQAARL6yXQCgzMWkoZjU1ICeickSUaoQGArcjcYEAXXRIFkZo0IqQXARwIAEmFZuamlbIJtbYHmAhaFQuBwAF6LQz+BAAch4oOm4ISQVSu20+hSaQyQXcohgyUutxG3EuDQZ5q6XAA9IP0gIBu57k0WBBwy0BAB+YEAXxTvRg8QA+rIg1mIQiYXCEDmQMj3M-DRiscZcf8CSBiXYHlyXYB5WGpCt1U8ZIDRTdltCtYC1UFRBUEzBBxQaKVKVlWsmndY0QKgrw4C1AQdXwPVOQI1VTTUC0rRtQxILAR0YJdTgUHdL04B9CkmIDe0Q0scMrSjGM4wTEBkxZNM5igS5RWzf48wLM0GMjQpeA4bSwBLCAy2Y+1RmRYxqmYc94nwCRLEoBTBHwAAKBA5HoOQgmMKIzAqYIohiFwTG8Pp2BMzEOBoFBhwcUxWkybJLNcVI1wASiPEBTxZVYkCQWRL3TBSFgfYEnxfN9UU-EFvxxfEiRJJCKTA+MeEg5ZoNgll4IjUkTT9VDFLFfAJWwmV9jwhUKsItVWpIsiKKo9rlVo9h1OLEQBLtIMHSdDi3Qqni+L9cshJ4UNRMjaNYypZSZOBOT1AUzNlIIVSpELDSRgMngjs2uJkTsL7dBy7Z8uOZhRwgfhyJgwt5ihx4BDgbyl1qKA1mjJg0oy4E7NiCFr1QMZ73+R8hHhFTXxRD8UzCoMfxqgC6qWylwOa+1ppg91OsQpmUOFUUMMGrDpW2XD5RonriM1UZyM2+bxaIlbLTW-0NuYVjtsFzjuO9JBfWtFXIOEsMuvEy6WaTFM7ozJSX3zV7Ff0wzBJ+7hYHMTwYjibtrOMLgaG8kcPFWAQUG8zGUwgdZ8dvWsEiK2FSY-Z6Kffd0aexX8CH-QDuqIxqILZhkOYqrnuR5oU0P5zDJWFnJRrFiamemqXtVlhB9XltUHeV761bY51Nd2lN9t1-iDeOyiRJNi7JOuy2s3k-qnpZO23tWj6ndViv+sG9YgikCBfE8eh5SCWoBAQoJIv2FBA74XQOBgyglz9kxnbLUmTEZHoF13tZw5ZAFHKIRLwAEcYB1CJtCYqidSqUzTlVTO+Bs6MwlvnVmm12YLTZBybmEteaVwGkNWuot8KNwls3Ui0s5rt2ouQhW9F17rRYv3HaXE9o6z1swiep1p4SSuhbWSC97pL1tmpRhSsN5fSMptYolBuCNmYOAyBpwsgqyAc8TibRkguCCIGGwdhQLlEosgegQxnKuXcvgFsyR5SCB4OZSgsYOAuHHFyFsQQWyWliK0Dx1jShYVQDLAWGiQh+JsRaDyCAgEhKeGE5KfB7F2HwCfbS25bShMkLSDaUZpg5AgLHHSixtDLD6gA4EtR6iSkvFQBGopITExgWTZOZUqYsnTnTP8tUgJM3QVvLBnNcFl3wdvdC1dhoi3rmQlMk0KSUNmm3Du9Cu4SMYuPH6rDB7sOHpwsevdOAnSnmJGeAjpLzxBo9MR9tVkiFLNI9+pJ5FtBVs2Ns+BKm6BrvgWppEkCJEGh4G8CB6Ay0zINbI-RrJfBoPzVAXBykgAYPKS8MLbyXDqPHEq5NWkIPiBnemOd6qgW2CzfpRdsGl1zshUZVdBZfJGnKaZRom4aioa3XUtDsGzOWjc-W+z1bsS2drXio9DoyODIc42xz+HmzOUIi5Ntyar27lI9ZKgYD0HDPYUlzZvn7GPvKfJaKcTJABdIR+prOifH4EuUY+oIA0G8Fofc5qhiXEQMzQwkon6HhPCmGFhT+B5RgFEAQqRLhBvqPQCB4ZMWwOxfAiqHTqpdIZj0tBJKmpkraoMhCwyiIEP6gLYhOEpnjRmSy4YbLgkmKWRWiWKruEbI1qKLWHCRVcLVQcyeUrzoyqaoI26wjrZZiuWvSRdyu12HVaG8NRSzXxicIhAp8R53tzqBAiNupdDRoYMwCxblPH0HcOGGMXBwnUEoHWeU4SQV7GWuISU5hwltGoNMZ9njHHONcckFsCTIqPIUS82QYNIaMgRUwegywimXhpl-ZIl4o0xqTvgEmzSWQ4qTYgglqC86ZoLpg8luaupEv1n1MZdKJl10ZeW5lFDWULI5XWujDCiySKbX3FtrptkshHp2-ZRszqeBObKm6qZh0PUVcnZVvLJ29zeRDbU0NIpMGCBqrV7BwxIAvKp36lAaAwpvH1M1XhIZxAUgYVqtpdUuEZDwEI7h2AHqsS2R06xWgoHCXp1Qghwn6J-VaAJaTGj0D-ZUTIBmCkCwA14MaeTeLJH0FANI96aUDQZWNV18Zti6EGvuGQzyA2rv4EYduHAEBSARWAYwSA1hRkfnjPYeFYpxvQ0iRN1NsOpsJb0-DGD6Q5pLkMqlY9yO0pLRlhu9aiLzOoYsuh02VlsbWfyzZrah68d2WKh5gm+FmwHXKodCrR1KvEct25n0u29GoIo81qn9VNaEPyarsgtz0CCLWKY2EYANGhbY5LQYwB3xKWAEQAGXu1btK9QYoRLquJDsoDwdrOQOrKX6lk0ZQeXhKOQbyrWUPtdTlhvFnSs7dJG8Sq62bGTEbwQWtLxahalpo53OZDG5tMYWyxpb70ONbUFetnjwI+N7PFd23h0r9tSTE1bSTJ3pNnfenJsXoUzK3deQ43w-zHRXFvtFXHsU74BMlEE6DrbnOeIC-yTH5WwDhJx15sYrZPHG75MEu3qV0dIkdAgUOsVEOcvx3AonnWScprJ2minnqCMDZp0NvNUfC0UYm5Mlnyy2dVsY7Wrni0G28r5wKgegvhUHT5WL3bkvZ6DvE8d5eL1x2O3uVvVXHBzLBB93792o4uAau6NZWpdlaaeuYM2BFQZsALEvC3iKGQg8JpD+0rrEeesZqpy1Ij8eSPlzG0Qpnk2mW55m+z9l2euVM0bV2wvbCS+irLztyVQnTZV8OzXxelzTvXPO6q-lrQwpt9WA9HkuPqDGaqRLGOQC4AgJyE5C5IetYlwKRGUOQOEvqPwAkC+o-GsEIOEpiHsHANgZ4jClINLNgZ7ulCmHsAjkIHlEOMIJeBWMvGhgTinOVKHrTOHsguTqRn0uvoNnBMNqRknuNnvqnmNKzgyMfjWnLOnjyl-gXmttxjfvxuXg-nts-jLhJqIh-g3hdpvCxL-mrvgJQawP8lwLQf8qOLSEgPyAlP3rZPZB4D3hIJ4CdPeojlfBACjKUEED9tLNUOoCEIcCBlDHfIjtUKrPCl7iAIOFIJeO4FPtEggApJeDvhhHPsnLSOOO6LLlocnF6HofaDvsMDEWaqMJARZo1CPiBh9uIJIPquZIav2OIBhEkD9lgYcLGC0XquuOQB9jGAIHfEgYIAVmDC4C4PyDQLGLOPQGlGwfio0rCOoMwUoA8qoDqNItSKOFANMJYFaFarYpsBtsCLZs6MsWLqkpsNkrIOZmbtsGorKseFjK+PKNMJeGkggEIJYGAHEQICimSJcOGHlI4LrAaNAgnG1iAJkdgjke-nkZdvsrWIwHUL5EkSarnACWDB4FEHEHeo2OaBqpIEUWorFn5C4oFO8Z8QIEDkYWsZtNoJMasP1D2J0HivoJ8GACOiOIlnwCBj5LZmAQMCBl0BsAMWaoGLkswORCcEIEuHZNsfInALMYvmHkgo+EsS+CsVvLSYZJsR4NsZQXsVMOVjwEcdEXUG0BqecUUqzFsDcTvPcQdo8SmLwJYOVqsAhtUNMHoAkasI-OkSyFCdkZobCZtgUZtH7KiS4GDoYCCvpswC6cYL7iIKOJ6cgGyYICbqsFqpSKML6ckEqV+CqZiuqeTJqZBNqRsZkHqTsWGiIPscaW2meOaWcQ8hcTadcV-PadkA8U8UQYILBkNKbv1Ihjushv6YTqwcqewUgigumnhmvoXHwR1AIdvnzLvvSqIVNtzhnjNBzqfuIToXfs3goY2Zth2qLvfj2o-iJgdhobXmOiqsrg8tOpPE0MhuCiMITN7H2aKa7kOZmHfECneKcBbtYqMFmM7tYuQBqpBS2H+WoDqHbp4mme+uep4m0FWC8SIChbFOEtUI4H+juJ+aZK3uriBgpmBtDFaoPgiquPEb9LOA9PwHjgsVii0h1lOfMcvrhmqDwYuXHvwQnoIQzuMiQmWgebNiftIYtnRHIZfieaaSLttlvBXn2lLnPPKm-lJivAWD9nYBAskEEFgGUCYHfBGf5IFNSLaIplDKanRQILKQuKZtAFGOOH3tOvoHxZtKBUQF0OaGfGUMIJcD5LGTQPGEGB9pQGMUWEEKijCloMYAkqCByPoDFlvHmoaq2pML8kZZDEIGAJQD-BeCgEuJHGsMRWFDPuuPrDWgAAycDZDCgJ5abYhQBBAAAsDVKs6QyW1QblwgWinIEK9magHAb2Zw+gelPeyJrA+JTgEkCKLVJQl4CUI5b5e645kJMY0JwZ2lwu8JYuCeXQsgVoraS1plUKcAvyuQdkFkwUFVnkkU1VjktiGw-eggwgZ8H1-yuQ8AlQBm0wCSMO-CugtyM4sgTFmJ+AU1Bldh5EDhERBZlURZrFJZycZZ9oFZVOWxNZhpuQDZppJxFppZVp-A7ZegnZYKDpUkTp7SVQtul4lglwAUMQdQK1SU7gm1gZFUMJe1noB1DyLebeyWFNXRTNZJrNhlwQQgqAyglwbVZqXAvglA-Ir1FkHNz1sBViAAyh0BFdZLoOqlBqKbZjAJgEFMVRMFUEIAkj3pqh5oal4KkKjB+brMcMiaOE4i0GhFAHDYPoIEjcmqqcVGjSyBjeGYyTqVWdZLjXWUaYcULmaacZaa2daXaLaZTa2tTcpLTcCAEfLYzeAcKFALBgPg4ZtZhnMaTpwZHtwX1tTsXIJVviMqkaJczmITIZLNWjQsxofjzkwvJVxqefteecpYbKoZXqcneVpfLjpZ-krgLVvNdh6vnRda4rVv8ufH8l8YMYlvyAfL4EuK5o-Hbn7Qjfql4AxRDVupUEXT7TySHDAKMcBqpo5DLIjpZjlhYN4KkK9EsMSnMCZKUb7vDeUMlFEsbXpLFB+VIHLR-f-WfUPtSOaRAD7KujEA2PoJyG0LA4IMGJmu-AipyMCp8ggCtbyW0GtburGqxfGuxQvoWdOThnObxfXbwQJcuUJauYQozhudRh3TJRIZnnudJdubIbzoPQLooe2qXnzqpcJv2tLucjPXXiADJl-k+VvC+Uhnuh+cQ1BkzjEuYNhNoDEn1FEmaPIqgLFRALYoEWajyDELWOblrchdMAY55p4qYyBkhdYjCnY8oL4y2P8eRDeBgckFgd1E45mIRQBjZKA9iA2C-QgAiiKkpnjI49wJmFQ2ObQxCZXZxdXbOVHl5bHo3Zw83fTq3ZRmJWnoI13VnqI33bJRI6tkPYpVtkeePVeWoVPcoyIiGfXo+YvZBFWGFfsPWMwGk1DBCB9iphQ3fE7SBpYCuNAB5bFdoE4yoE7h+SDAsDAZYp4tM3UM9sYMxS+ghbrpRORZ4rYkwJYOEgCc4FaG4G7BhGFtOKoNfUFF8EYUzeQMmR4FvZSUlmXbTAioE+GN8corYgFBhH8U8ihkwS+Nzf0yOqo-kU3pBHQBwFiaE88g6VUapjDmcEYZgPjTEOwDCy4kIIaslvwK1KBS2H1Z41BWELQgII87Dk4OErsJ5v+mwCwGM-YmarYrxMYrlkMQICMfkoGjoMY+YGjsTkw6jU-SnVqZHZWWavqbsXHfjQne6ETS2VvG2enR2QDlTd2Y6U8doNpBVv2TZYyG8YIOZigHlGoKYqwBXRxYw1xTXSvvOaSuw+U8CJSsJdUynvw1uc00I7uVJYHp3Rfm01I8PfzaPV0zwkcmpeoWi3Lqo+owvWGZWOS2SAUGSxS-EBMKKAFOBewI69DGZiYAyDeUS62DwNSyBa49YlgJKBFJmHUBeqSJ0MW9QFOFkBc-zPyKUNybuuRATLBfzB+baOZKoIRe-Q5EsMDPsbcgYa3oauSErQNcsKNSy5sMDZdLFvAH5SILYGAPQEq08TDWzfEevVgQkSRVVW8XUMgJKN6ww8jSq9xSww1Gw-xSGzglwy3Wubw1RqQrRjGw0yIwm-U0myrgpYnUpRm5tPI0-n05pQM3zQAOrKAENaNtA8BPtS2vsWFAuWDb1Un8hPgPXhRPU8CgXAs73fIZAID8hrGpmtG1ZBCsjaAoAoDgNcfz3ryTpWTL2NjUjxP+0eAX2yvFbYRX1vnPCGqXN1tWuttGDLDwNUBf3FG-2K1fC+7ZbNCCuQAdpBgFD6C5mgORHkEY6BVCDBU-F5Skls3NjCnIqIkglc3bVBn3nkyYtdpFEkmonIm+frBadJG44cDgJQ0BJexgqjTQA4iA5ZbfJXD4AdumG1EuHvJufBU9gUS1Jk167nwITeCCB9S3FGXYBpkCzTCbBIpNB3yUeJLGOmodcRCgWTENDKCihVsNAicIBkFV0cFqlqsk2rGavY3VkGl6sHEmmJ1GvquQSmtXEU0WtZ1Ws01PE9v+7xGdAfJYRAlImgmoZNLMGov4fosvjhcInqYebJPdo2WQCBDfJ7C8BPZGejDUmjg-YXeSieXAzmdGHTDGagUndyglZlVLjXwHDQSlChCmrKDLBXyAwPA2XJCRzUnbEQC0vbhcAd4BxQVWRCAxjD7eC3XhI3jqAmSPNQG0wcTE+k+ha21FcINeCgiwp1uQy4PJBwA8DrtBxGdbBBixl2c5fWYgaB1L63eLFzfo1i5Y2ko40recDx3reGvNlbf2g7eoPmu3FLvWspjT5bo+nyIIbgWxwNJglsUYY+sAd+vFN10LmEZLmhsrlQc8Nt377wcgDcqIfxu92h-n756SNF7SM7LptyMT3Zt4dHYqNjpdB-KfOMV67mUS2eBOUrga0vyLxaDInW8ZDf5i50Au0PCORO2RKTx9gCwA51C7i7Okks1cAJL6oOoBrRaoO2D2CLujgoAHwpLICtXMdVU+TaCQOoUwNwMbuGC0xi8F-tArpbpikkNboIpwYl18jQW1j7BwADlIA1s-tIt3fB6Tm+tFNcG9be9lMUr+9VPQdB+bkH5R-0bCMR857f+sZWmaHdphh06ZJ8emk9UTLm1yJz0xwzhTRpBBBzFdcsYzNgBdQCQX8KQWAUNOwDTLcdjMhLO7G20GiUVTUBXJyIrE-LylQUJWORAoiCCjBomJWRtgpB74RZ++qVVBl4EHB65JiCea3vOlHCQtHaUAUoD9hQAIozCa4agj4G+LNg8o2IM9CxWd50NXe-7IOswxKagcfeHDP3pBzf6B8am7daNgAKmiSEe6--MPqh0FroclCF5FSsnwUbqVq8vNWekM1kwjN7QsnD7vqjaDGAz0SQQ+GAH3qOYAWZlUvrZREAtgrUjmX0C2AOZwFqsphCIV0T6qPxXAo-FfhKTPgXgJwRFXRiS1jLaRVg3ffTi6k3bIDgg+xbCMlmmqmpawBmAOlEQrBxFSBl4FTGQyKwRooEKvF3hOTaR38OCnvR-kGzA4v99B1KCNiISjZf8w+klKQshzEaHl5CIAuwWPUza9onBObR7nmxfDa1fc0xFwj4hRIWVfaFfdcEEFCCvQuh86KyoYHramoqwJlUUDNUXZVBpA7gUFhADfgW8HkqwDYMZy8CwNbG+6KQJYDgCVAwAvEGrBEB0bhgDAc1WHOwF4BcAFAPAvRAgFjAhFRWMADYGCIRg5ByA5EMaGQSeJ7MoYCg-wXYGUG9DVB-Q3FIB39Y8UQOT-YiOBzDbcMi0H-GYSHzmHmD5sZ+PPHJWTZx9U2mHcARLhT5QCdhMA9wRo08GbQ3Ac-fEoUHJHIliGfUNjllCBiVBPYszUQMERUQ21iutoMok8E64fR02CnBGoQObAeQDOy-XLB62gzbhbCo4ToIgDiAURbg+wfZvqltDHURY3w1AAihp7gEf07QwmKKCu6Bc8mzBApoMJnIP9V8ownQeyNf6TD3+Rg4PhJX5Gc5BRgAgeiKOvwyNb8EorNlsNT6v4CObgtRorik4Ki1Yu7f-E2BAzFcwxFop5igCtAHxfCOPEOHfG1GWUcs0gQqpZlcDkREAWrGOOl2-oBddmig5JKimFDIkJen9KoVME0jQ0kAIOHoL-UkFaBbM1SHkKJwoZvEuACRCKOQD-a393e9-WuiMKzTBtxhlTTMYYMjZwdcxv-BYZHysEx9ixQqUscoUvKSjKx0otPjWPzb1iJ0jY0rKdUh4uBeBInb2KMH+w6gkgBPbEaOEeynNXshqOEVUVYAg1nQqDALpAm3CjArxczERAsDMqLiuA3kGqhRE6ouIu01IGzj6Gy7VARAn2KcCeNnDQMSWtiUTnkmwbYR6qrEhElcPbA1lPyV4kvjRKsBt8mgtYUYGajkh7BxQ2QfiRQwRQdBqkLpPIGQzIk3dkW5MB7hBKe5hdYJ2A-7PECtCmM8GWEIdl8kMlP0q2qPFMggEdopIghyMSgA5z2B2VMhUzfmEICV4o1neodYEOHRUCLctey3XVrr31b68Kom3ebiazTq7c7SlrU5I8WPCGhEUNADgAADV7EmYf4CAF4AABGQqdoiSKA4AAslqGdB-gQA1gduPyGqlyBqpAAJmkjHggAA" target="_blank" rel="noreferrer" className="text-primary">在 TypeSafe playground 中打开这条笔记和全部问题 →</a>
