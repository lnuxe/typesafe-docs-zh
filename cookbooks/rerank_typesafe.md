# 重排

> 对 40 条 CLERC 法律查询各构建一份含 30 个段落（passage）的 BM25 候选列表，再用一个 TypeSafe 问题评估每个「查询—候选」对，把 top-1 准确率从 5% 提到 18%，top-10 准确率从 38% 提到 62%。

你手上有几千份文档，需要找出能回答某个具体问题的那一份。该怎么找？

先用关键词匹配这类快速方法，把这上千个候选缩减成一份看起来靠谱的候选列表。这一步叫做快速检索（fast search）。

快速检索擅长这件事，但它说不出候选列表上哪个候选才是对的。重排（re-ranking）就是为此而生：它把候选列表上的每个候选直接与查询比对打分，把最好的那个排到最前。

下面两步都在 CLERC 数据集的 3,565 条法院判决段落上运行：BM25 为 40 条查询各构建一份含 30 个候选的快速检索候选列表，TypeSafe 再对每份候选列表重排。加上重排之后，18% 的查询能把正确段落排到第一位，而只用快速检索时只有 5%。

**你会顺带学到：**

* 快速检索做了什么，以及为什么它给不出完整答案
* 重排是什么，以及它如何接在快速检索之后
* TypeSafe 如何给单个候选与查询打分，以及这能把结果改善多少

## 自己动手试试

[在 TypeSafe Playground 中打开一条查询、一个候选和一个重排问题](https://console.typesafe.ai/playground#share/N4IgJg9gxgrgtgUwHYBcAqCAeKQC4AEIwAOiAI4wIBOAngPpZTUAOKpBpUANgIYCWcfADMIVfADc+EXiilIAzvghD8AaWQoYUANY18UPpK75mVaAjAwqCADT4UACwR6h-Yygj55KHigT4efV4BfBhmCCR8AHcHPigHfGsuPgQVKB5IgCN-AHMqDL8wADp8NCd8AFk+bUVIfCQIFHw+MA0+IRpAFAIMsCUrRIR5BB4qePxIQfrGgfFhrm79HhghpRUeKFkI4VEJKRk5RWU1DS1dfUM+YwByEzMmS2sSitEECFmqOwAxazAwFMr1tEeIoGk1AswRig9B57OURNZuBB5FZ-OtNpEeoskKD8Nl8E4uL1rPJwgo+JkuP54QEkHpTOYHjxjK0hAgNoo+JFHP56UwLJycvISmhPNz8Fg-KhYb5Yf4qjUvAgENp7J5MlQBQEgvxBNTJNJfAdVrK+GJLDy7oNFBqcg4UIoYEhWmIxZ92o58ABBRBOn1NGFigCqSD4hXwAGUfH5FABhCLeUMwdF2bkuNyqrxR1HakJhLYxOIJJIpNIZXG5fKoCzl9LLfzfCx-OWAvgg6aBHJvahIP0BDY7GKedJZfwE3rJHgUqk7KDx2SadFM3YG9FC-AASUi+AASgBRAAinpjaAP+FlEbC1kQ+DjViagx8FNbTl6gSE+UQUVEKuprT8VDgTlNRiZAtU7d4ew0ABaEl4xeXpZyocJ8nRZpFA7LsqEgqU0R2alZwUeckzkJdmCscIhjXdcmjHaUmkAHAIQOsfAilY88AHFMOwpooGsXxJkCRDkMNLZMj0Ek2T4JdeCiOxqTFIQ7ycSsmGNcDuz9JcIEyAArNlZFmeQ7ExawfE5RRqVDIYuBUZhqDgDINACJMHFEUNoU8HhmHCTkwXwBydLcqFjTFP4EQ8KhDhURwZSE0QRKQFNyjilC5DQkxISgkLyk4iDe2pMikKRSYjldU1vC9H0wD9IpAFwCDdigCJoAGYAE5WrsABGTqAFYIyKGMUBKVqADZOqKOxg2dc8ABkEHVABnyJ3x4T9vy+H4mwBKB0pxDC8qc3CxEHLFy3xBBCXwCcp22MR9X2eNsvrd0Em9ZBqo0QBMAkUfdKHwAAFS15FjXg6xKcMlTsBAihyCbKpKAAhDJtGoRRnioFBYZvURmBKcQSk+CwSgACQga8ZogMt0cxko4yQuGAHY+s+Ipmt6TqABYAAZOq67mRqgrnWvwAAKVqPRjU0ik69qRoASlIOxOB6Fp+LoCFgZ4HIEHYfBSB8bRNWUFQtjjUR5E+gIwHeWR5GA2IxjrRQxXkLgIByMsjkADAJw0ud58ARmAuEpFBLcs+1y2oLEjPPPxsFuaBgjgZ2HBlM3IvSr2yn8X2uH9wPg4Qf1U7BARFGz-BPhGHc+FtUPFHCZJZHSYwtfewIZTFJxIWNN6NXSIpLfqgAObrK-BsJcfwdrmrsdq+pF8N9wAOQATXwGXWuauWSm9FB8m0b7dlU0xBhaJy-nkLz6VmXoxR4a3qFthA-TsTlxAgQ2kBySr954Q+G7SDiDQN+SBlKhmrO+MmzQI6n1aEwYGOxgRXR6G7KgvQjj-WQJESMCUkr+CwdieQNA84ZCkjuNwZgH7YzgBCWkdh6IxSaKGaIlxjB7WDhAKIJggHNyXA-G2rYjZcnKAAbXDDpOyGx1hB2rgIp+Qjv5eFrkgOqXpvIlAAEzDx6iUOai0RGgSEJcasyIWFa34IRX+B8aS9DQPudcdhuA6gFKA-8AQJxJU7uUawikr7uE8MwXgqlYjoUfhjVsL8nJbDFOGKRPhYC8DEKnXo91+K9FCZXcqYInRZKEB6N6vonI2jtGuT0+So5YDsn8MMl9ZzvBAeefcrZ95xCaLeDGiQg7ViYdY-+dhsi1hWEcKyQRir2BSM7UU5RCbOiXLlDSGg7BRGQYEBZWFexHWMk0SkwImjUjdJFJohSPpSkKhRQYxlcm9NGdYPSGw0pHH0WYJAR96QXNfOE5+myHQKBgKGSclJbrjFbEEngehOQA2wRGKMaUUnLhkD0mZ2TKrvRqqUZKEA7z4DyAUaszylo0maEgHSjoHlbExKIZ01Y942MxPY9cGZL5gr0M8iIR95ERKGL2GJ5Q4n6RkUk4U5RgwQN6Lg6M2NsVHE9N5OYFkdixLZBEXoktRj-KaNYd4QxGqdU0ePfAbNDXD2HqLTe29hU8kclwI+EBmBAS2MYo5Uwwy9Npf-IEMcxKx3slFc8lIcitgeiI2KfEwyhjsHtfA6zuLilQO5N+xRtmGtalzAA3LY2UkQCLcBgK0O+JdzyzOoPMrivYVltiaPITw79pC31YQUuAf8VS9LFDIf8R94FCMerOIOvQ8QETttS3orI5mt3JYlZoSamops6lBNqmjaaxFSPgAAUnm7W+Bl4ICiA5SIl8hhVkagAdQrHihCCj4oahKD1MegZwYlG6lzBem8OY7w3Iy09+IeCzHOpdCITA7CBwxlsfG+Bj2XEAt-DwkR-ojC-j-T0LkgqNOaiNPq97+r4AZr1M1o1Opyyub0K+LR-IZGhAIS5dE+yrmNKYQw-E43zkmadatiBZCIEUHiawHt0HVmQepDZGh+ETuBYOoii5jDnOKmuCGthxQlFhnYcMZZvgZAMPIWcXoMaKAAGRekcCHOIMdNxQDxiUUVYYJWTAAPJcBoLQuINC4Bww5sPZq+BMPhhvZozRdgeocxGnh4eDM5YZoRlweAEgSirxGEXeQug7Acx6gzTzD7p6tV5hvLmXMObBc0WFyoEBxkUzAJu5eEBH1c1S2B9cVBJAx25qlrzj6Rqzw3gzfVIsZadffdRdKrhTQZivtCQt9EsViHSJRcYkk-hKJApEej4hGNojSoBOuZ1WhRILTKUq5RvCMdTr+nE2RkCkAAL4gDsCAektD7QYGwHgQgJAQCtjoAYQodBq1WCYLrF7UI7K61IA0IOis9avcIlQLQq4gcgArhQagehGAsB4mTSYUDBCBEDOGYQFgS3GF7Z0u1DqMS5IrdEDUKBJTNDgIgP4-F7MBDMI6V85xYUxM8rcNkePUAZrFB9hKMDrIqFTlxpUkQrxdkareS6-OVZgEYxrK+m68QY+ox96sp97hOU6OMCAkwWEPkBc+c8EkDDGJ2gG0iZgKKhjSmKBHtBxSYCYEhZhSAP4o3QswiOAvUI+VQAAfjB5wSn1ApJ-f1lDnWT3SAV2HH8BXfgMqa03QdyVOwjdPnkE4FO-gzftCc1DykdgDtOhGGAOwrlCSuKUGIVwGwMpU+7NRh3lAnfI7d01VpmQkyTBhLcl+Uu2cJSKCHkArguBDFh-H+XivgTK-8K2fy1ALp6ApcowCSTVT2p2jsSAGwNRIAQBmlhExK1eEnozl2UjC87XeUiO3vL-CO6Ry7lHAxkglVURd87l3rteR8AABqqMcgT2IA4gnUV2hA1k+kFgzwrQU+T2oiIAEkFgdAiK3gIAAAuudkAA)

## 如何在上千份文档里找到那一份？

你有一堆文档，还有一条查询——一段描述你想找什么的文本。这堆文档里，有一份能回答它。

把每份文档逐一与查询比对是可行的，每份文档一次比对：几百万份文档就意味着每条查询几百万次比对。可以用两步走的办法提升性能：

1. 用一种快到能在整堆文档上跑的方法，把它缩减成一份可能的候选列表。
2. 对这份候选列表再做一步更精确的处理，找出确切的那一个答案。

<img
  src="https://mintcdn.com/ts-docs/2NirYCl-v96cw05F/cookbooks/rerank_typesafe/two-step-search-intro-diagram.svg?fit=max&auto=format&n=2NirYCl-v96cw05F&q=85&s=796d5d4efd82f8396f380f2e1e14a9de"
  alt="Animated diagram: a pile of documents narrows to a fast search shortlist, then re-ranking
reorders that shortlist so the correct answer rises to the
top"
  width="1560"
  height="560"
  data-path="cookbooks/rerank_typesafe/two-step-search-intro-diagram.svg"
/>

本 cookbook 在法院判决数据集上测试这套做法，见下文[一个重排示例](#a-re-ranking-example)。

## 什么是快速检索？

快速检索泛指一切能把查询与大型语料库中的每份文档比对、并快速返回一份排好序的候选列表的方法。常见做法有关键词搜索（例如 BM25）和按语义比较段落的稠密向量（dense embeddings）。系统常常把两种方法结合使用。

这里的第一步只用 BM25。BM25 按共现的词给段落排序。把这一步保持简单，注意力才能留在重排上，而重排才是本 cookbook 的重点。选哪种快速检索方法是次要问题：重排永远只能看到进了候选列表的那些段落。

## 什么是重排？

重排拿快速检索已经产出的候选列表，把它排成更好的顺序。它不再把查询与整个语料库一次性比对，而是把查询与候选列表上的每个候选单独比对，再按得分给候选列表排序。

<img
  src="https://mintcdn.com/ts-docs/2NirYCl-v96cw05F/cookbooks/rerank_typesafe/rerank-diagram.png?fit=max&auto=format&n=2NirYCl-v96cw05F&q=85&s=f302253df43240e6ad7ea788cf3ba02e"
  alt="Diagram: a ranked shortlist on the left, an arrow labeled &#x22;re-rank,&#x22; and the re-ordered
version on the right with the true answer moving from the middle to the
top"
  width="2400"
  height="1186"
  data-path="cookbooks/rerank_typesafe/rerank-diagram.png"
/>

得分可以来自语言模型。把查询和一个候选一起交给它，问这个候选有多好地回答了查询。这样即使候选的措辞与查询不同，重排也能在候选列表上找到最佳匹配。

## 用 TypeSafe 做重排

重排器需要为每个「查询—候选」对给出可比的分数。通用语言模型可以产出这些分数，也可以直接给整份候选列表排序。但要做独立的逐对打分，你得自己定义一套评分尺度，并提示模型对每个候选都用同一把尺子。重复调用仍可能给同一个对给出不同的分数，而通用式生成会给一个只需要一个数字的任务额外增加时间和成本。

### TypeSafe 返回什么

用 TypeSafe，打分请求可以就是一个是/否问题：

```text theme={null}
Could this candidate passage be from the cited precedent?
```

光是一个「是」或「否」不足以给 30 个候选排序。`Noul` 转而返回一个 0 到 1 之间的数，称为 [noul](/primitives/noul)。noul 是 TypeSafe 对「答案为是」的可能性的估计。

问题的判据（criteria）定义了什么算真、什么算假。TypeSafe 把它们应用到每个「查询—候选」对，直接返回 noul。这个 noul 就是应用用来排序的分数。不必为通用模型自造一套评分尺度，而 TypeSafe 天生就擅长把这种重复打分做得更快、更便宜、更一致。

用简化的伪代码表示，一次 TypeSafe 打分调用是这样的：

```python theme={null}
question = Noul(
    instructions="Is this candidate the cited case?",
    criteria=NoulCriteria(
        true="The candidate states the specific rule the query cites.",
        false="The candidate is only on a similar topic.",
    ),
)
response = client.system_one(state={...}, questions={"is_cited_source": question})
response.answers["is_cited_source"].noul  # -> 0.87
```

TypeSafe 把查询和一个候选放在一起，针对这个问题评估，返回一个 noul。

用它做重排的方式是：对候选列表上的每个候选都问同一个问题，再按每次调用返回的 noul 从高到低给候选列表排序。

```python theme={null}
nouls = {candidate: ask_typesafe(query, candidate) for candidate in shortlist}
reranked = sorted(shortlist, key=lambda c: nouls[c], reverse=True)  # highest noul first
```

下图展示每个候选一次请求如何产出用于重排候选列表的分数。

```mermaid actions={true} theme={null}
flowchart LR
    q["query excerpt<br/><i>one opinion passage,<br/>citation removed</i>"]
    sl["shortlist from fast search<br/><i>30 candidate passages</i>"]
    quest["<b>one Noul</b><br/>could this candidate be<br/>from the cited precedent?<br/><i>criteria fix true and false</i>"]

    %% direction LR inside an LR chart keeps each state beside its noul, two columns,
    %% so the fan-out is four rows tall instead of eight
    subgraph fan["one request per candidate · no request sees another"]
        direction LR
        d1["state<br/>{query, candidate 1}"] --> n1["noul<br/>0.87"]
        d2["state<br/>{query, candidate 2}"] --> n2["noul<br/>0.41"]
        dx["⋮"] --> nx["⋮"]
        d30["state<br/>{query, candidate 30}"] --> n30["noul<br/>0.12"]
    end

    sort["sort by noul,<br/>highest first"]
    out["re-ranked shortlist<br/><i>same 30, better order</i>"]

    q --> fan
    sl --> fan
    quest --> fan
    fan --> sort --> out

    %% the elision is not a node - drop its box so it reads as "and so on"
    classDef elide fill:none,stroke:none
    class dx,nx elide
    linkStyle 2 stroke:none
```

## 一个重排示例 {#a-re-ranking-example}
下面把快速检索和重排跑在 [CLERC](https://aclanthology.org/2025.findings-naacl.441/) 上，这是一个法律检索数据集。本示例使用 3,565 条法院判决段落和 40 条查询。

### 环境准备

第一步安装本演练依赖的包。

* `bm25s` 和 `datasets` 负责构建快速检索的候选列表。
* `typesafe-sdk` 和 `cooksafe` 负责重排和 API 缓存。
* `matplotlib` 负责绘制结果图表。

```bash theme={null}
pip install bm25s datasets matplotlib 'cooksafe>=0.2.0,<0.3.0'
```

下一个代码块创建 TypeSafe 客户端，并定义演练其余部分用到的常量，比如调用哪个 TypeSafe 模型、快速检索交给重排器的候选列表有多大。调用 TypeSafe 需要一个 `TYPESAFE_API_KEY`。

```python theme={null}
import hashlib
import json
import os
import random
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from cooksafe import JsonCache
from IPython.display import display
from typesafe_sdk import Noul, NoulCriteria, TypeSafeClient

TYPESAFE_MODEL = "jev-1.12"
PRICE = (
    0.042,
    0.00,
)  # $ per 1M tokens (input, output); TypeSafe jev-1.12 as of 2026-08
N_ROWS = 170  # CLERC rows pooled into the shared corpus
N_QUERIES = 40  # rows we evaluate
TOP_K = 30  # candidates the shortlist hands to the re-ranker, per query

client = TypeSafeClient(
    api_key=os.environ.get(
        "TYPESAFE_API_KEY", "cache-only"
    ),  # keyless kernels replay the cache
    base_url=os.environ.get("TYPESAFE_ENDPOINT"),
    timeout=120.0,
)
json_cache = JsonCache(Path("json_cache.json"))
```

### 用快速检索给段落排序

这里用的数据集是美国法院判决语料库，170 行汇在一起。每一行的结构如下：

* **Query（查询）**：删去引注的判决书摘录。
* **Gold（正确答案）**：被删掉的那条引注所指向的段落，也就是这条查询唯一正确的答案。
* **Candidates（候选）**：语料库中其余每个段落，每一个都可能被查询错误地匹配上。

170 行中有 40 行被挑出来作为查询进行评估，其余 130 行只会作为候选出现。

下一个单元格用上面讲的方法构建候选列表：

1. 加载语料库。
2. 用 BM25 把语料库对每条查询排序。

这里还没有 TypeSafe，只是快速检索这一步。

```python expandable theme={null}
CLERC_FILE = (
    "https://huggingface.co/datasets/jhu-clsp/CLERC/resolve/main/"
    "teva_train_dir/train_data.jsonl.gz"
)


def cid(text: str) -> str:
    """Corpus id: a content hash, so passages shared across queries dedupe."""
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]


@json_cache
def build_slice(n_rows: int, n_queries: int, seed: int) -> dict:
    """Stream CLERC rows, pool ``n_rows`` of them into a corpus, pick ``n_queries`` to evaluate."""
    from datasets import load_dataset  # heavy import, keep local

    stream = load_dataset("json", data_files=CLERC_FILE, streaming=True, split="train")
    rows = []
    for row in stream:
        if (
            row.get("positive_passages")
            and len(row.get("negative_passages") or []) == 20
        ):
            rows.append(row)
        if len(rows) >= 1000:
            break

    rng = random.Random(seed)
    picked = rng.sample(rows, n_rows)
    corpus, pool = {}, []
    for row in picked:
        gold = row["positive_passages"][0]["text"]
        corpus[cid(gold)] = gold
        for neg in row["negative_passages"]:
            corpus[cid(neg["text"])] = neg["text"]
        pool.append(
            {"qid": str(row["query_id"]), "query": row["query"], "gold": cid(gold)}
        )
    # hold out the first 20 pooled rows; evaluate on the rest
    queries = rng.sample(pool[20:], n_queries)
    # sort the corpus by id so every run — live or cache replay — iterates it identically
    return {"queries": queries, "corpus": dict(sorted(corpus.items()))}


def bm25_rankings(corpus: dict[str, str], queries: dict[str, str], k: int = 100):
    """Rank every passage in the corpus by word overlap with each query."""
    import bm25s

    cids = list(corpus)
    retriever = bm25s.BM25()
    retriever.index(bm25s.tokenize([corpus[c] for c in cids], stopwords="en"))
    qids = list(queries)
    idxs, _ = retriever.retrieve(
        bm25s.tokenize([queries[q] for q in qids], stopwords="en"), k=min(k, len(cids))
    )
    return {q: [cids[i] for i in idxs[row]] for row, q in enumerate(qids)}


def gold_rank(ranked: list[str], gold: str) -> int | None:
    """1-based rank of the gold id, or None if it isn't in the list."""
    return ranked.index(gold) + 1 if gold in ranked else None


SURFACE, INK, INK2, MUTED = "#f8f8f2", "#34342f", "#34342f", "#7c7c77"
GRID, AXIS, BLUE, GREEN = "#d8d8cf", "#d8d8cf", "#5d76a2", "#6f9b52"


def bar_chart(labels: list[str], shares: list[float], title: str) -> None:
    """A small single-series bar chart of shares (0-1, shown as percentages)."""
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(5, 3.2), facecolor=SURFACE)
    ax.set_facecolor(SURFACE)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(AXIS)
    ax.tick_params(colors=MUTED, labelcolor=INK2, labelsize=9)
    ax.set_axisbelow(True)
    ax.grid(axis="y", color=GRID, linewidth=0.8)

    bars = ax.bar(labels, shares, width=0.55, color=[BLUE, GREEN][: len(labels)])
    ax.bar_label(
        bars,
        labels=[f"{s * 100:.0f}%" for s in shares],
        padding=4,
        color=INK,
        fontsize=11,
    )
    ax.set_ylim(0, 1.1)
    ax.set_yticks([0, 0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["0%", "25%", "50%", "75%", "100%"])
    ax.set_ylabel(f"share of {len(queries)} queries", color=INK2, fontsize=9)
    ax.set_title(title, loc="left", color=INK, fontsize=11)
    plt.tight_layout()
    display(fig)
    plt.close(fig)


ds = build_slice(N_ROWS, N_QUERIES, seed=0)
corpus: dict[str, str] = ds["corpus"]
queries = {q["qid"]: q["query"] for q in ds["queries"]}
golds = {q["qid"]: q["gold"] for q in ds["queries"]}

candidates = {q: ranked[:TOP_K] for q, ranked in bm25_rankings(corpus, queries).items()}

in_top_k = sum(golds[q] in candidates[q] for q in queries)
at_rank_1 = sum(candidates[q][0] == golds[q] for q in queries)

bar_chart(
    [f"In top {TOP_K}", "At rank 1"],
    [in_top_k / len(queries), at_rank_1 / len(queries)],
    f"Where the correct passage lands, {len(queries)} queries against {len(corpus):,} candidates",
)
```

<img src="https://mintcdn.com/ts-docs/2NirYCl-v96cw05F/cookbooks/rerank_typesafe/rerank_typesafe.executed.1.png?fit=max&auto=format&n=2NirYCl-v96cw05F&q=85&s=db0d74ddf1659968b52bfda0cdf8b030" alt="output" width="940" height="462" data-path="cookbooks/rerank_typesafe/rerank_typesafe.executed.1.png" />

### 快速检索很少能把正确段落排到第一

这张图展示了在 3,565 个候选中，快速检索把正确段落排到了哪里。

快速检索能稳定地把语料库收窄成一份包含正确答案的候选列表。40 条查询的正确答案 100% 都在列表里。但那个段落很少排在候选列表的第一位，只有 5% 的情况如此。

下面对候选列表上已有的前 30 个候选做重排。快速检索没选中的段落，重排也加不进来。在这里，候选列表对全部 40 条查询都包含了正确段落，所以重排可以专注于把它们挪到更好的位置。

### 用 TypeSafe 重排

重排给候选列表上的每个候选与它对应的查询打分，再按分数排序。TypeSafe 对每个对问的问题是：这个候选会不会就是查询中被删掉的那条引注所指的段落？

下一个单元格做三件事：

1. 定义这个问题。
2. 对每份候选列表上的每个候选都问一次，40 条查询乘以 30 个候选，共 1,200 次调用，并发发出而不是依次排队。
3. 按 TypeSafe 返回的分数给每份候选列表排序，得到重排后的结果。

```python expandable theme={null}
is_cited_source = Noul(
    instructions=(
        "The query excerpt comes from a US federal court opinion and was written "
        "immediately around a citation to a precedent; the citation itself has been "
        "removed. Could the candidate passage be from that cited precedent — does it "
        "establish the specific legal proposition the query excerpt invokes at its "
        "citation point?"
    ),
    criteria=NoulCriteria(
        true=(
            "The candidate passage states or establishes the specific rule, standard, "
            "holding, or fact pattern that the query excerpt attributes to its removed "
            "citation."
        ),
        false=(
            "The candidate passage is merely on a similar topic or doctrine; it does not "
            "supply the specific proposition the query excerpt relies on."
        ),
    ),
)


@json_cache
def score_candidate(model: str, query: str, candidate: str, question_json: str) -> dict:
    """One TypeSafe call about one (query, candidate) pair: a noul, plus token usage."""
    # the SDK takes a question as its JSON dict, so the cached string decodes straight in
    question = json.loads(question_json)
    response = client.system_one(
        state={"query_excerpt": query, "candidate_passage": candidate},
        questions={"is_cited_source": question},
        model=model,
    )
    return {
        "noul": response.answers["is_cited_source"].noul,
        "input_tokens": response.usage.input_tokens or 0,
        "output_tokens": response.usage.output_tokens or 0,
    }


# Each of the 40 queries has 30 candidates, so re-ranking every shortlist means 1,200 independent
# calls — cheap enough to fire all at once with a thread pool instead of one after another.
pair_list = [(q, c) for q in queries for c in candidates[q]]
question_json = is_cited_source.model_dump_json(exclude_none=True)
with ThreadPoolExecutor(max_workers=12) as pool:
    results = pool.map(
        lambda p: score_candidate(
            TYPESAFE_MODEL, queries[p[0]], corpus[p[1]], question_json
        ),
        pair_list,
    )
pair_scores = {q: {} for q in queries}
for (q, c), result in zip(pair_list, results):
    pair_scores[q][c] = result

reranked = {
    q: sorted(candidates[q], key=lambda c: -pair_scores[q][c]["noul"]) for q in queries
}


def chart_before_after(
    runs: dict[str, dict[str, list[str]]], thresholds: list[int]
) -> None:
    """Grouped bar chart: how often the correct passage lands in the top N, for each run."""
    import numpy as np
    import matplotlib.pyplot as plt

    labels = list(runs)
    colors = [BLUE, GREEN]

    def share_in_top(rankings, k):
        return sum(
            gold_rank(rankings[q], golds[q]) in range(1, k + 1) for q in queries
        ) / len(queries)

    fig, ax = plt.subplots(figsize=(6.5, 3.6), facecolor=SURFACE)
    ax.set_facecolor(SURFACE)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(AXIS)
    ax.tick_params(colors=MUTED, labelcolor=INK2, labelsize=9)
    ax.set_axisbelow(True)
    ax.grid(axis="y", color=GRID, linewidth=0.8)

    x = np.arange(len(thresholds))
    width = 0.35
    for i, (label, rankings) in enumerate(runs.items()):
        shares = [share_in_top(rankings, k) for k in thresholds]
        offset = (i - (len(labels) - 1) / 2) * width
        bars = ax.bar(x + offset, shares, width * 0.92, color=colors[i], label=label)
        ax.bar_label(
            bars,
            labels=[f"{s * 100:.0f}%" for s in shares],
            padding=3,
            color=INK2,
            fontsize=8.5,
        )

    ax.set_xticks(x, [f"top {k}" for k in thresholds])
    ax.set_ylim(0, 1)
    ax.set_yticks([0, 0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["0%", "25%", "50%", "75%", "100%"])
    ax.set_ylabel(f"share of {len(queries)} queries", color=INK2, fontsize=9)
    ax.set_title(
        "How often the correct passage lands near the top",
        loc="left",
        color=INK,
        fontsize=11,
    )
    ax.legend(frameon=False, labelcolor=INK2, fontsize=9, loc="upper left")
    plt.tight_layout()
    display(fig)
    plt.close(fig)


chart_before_after(
    {"Fast search": candidates, "+ TypeSafe re-rank": reranked}, [1, 5, 10]
)

calls = [pair_scores[q][c] for q in queries for c in pair_scores[q]]
input_tokens = sum(call["input_tokens"] for call in calls)
output_tokens = sum(call["output_tokens"] for call in calls)
cost = input_tokens / 1_000_000 * PRICE[0] + output_tokens / 1_000_000 * PRICE[1]
print(
    f"{len(calls)} TypeSafe calls used {input_tokens:,} input and "
    f"{output_tokens:,} output tokens, costing ${cost:.4f}."
)
```

```
1200 TypeSafe calls used 1,536,002 input and 25,200 output tokens, costing $0.0645.
```

<img src="https://mintcdn.com/ts-docs/2NirYCl-v96cw05F/cookbooks/rerank_typesafe/rerank_typesafe.executed.2.png?fit=max&auto=format&n=2NirYCl-v96cw05F&q=85&s=46bea6ecf0dbb89f8df634eb6cda16b7" alt="output" width="957" height="524" data-path="cookbooks/rerank_typesafe/rerank_typesafe.executed.2.png" />

### 重排把正确答案推向前面

这张图在三个阈值上比较了快速检索与快速检索加重排。每一个阈值上，重排都把正确段落推得更靠前：

* **Top 1** — 5% → 18%
* **Top 5** — 15% → 35%
* **Top 10** — 38% → 62%

报告的 token 数和成本覆盖了用于重排这 40 份候选列表的全部 1,200 次 TypeSafe 调用。

CLERC 的每一行包含一个正确段落和 20 个负例段落。本演练把 170 行的段落汇成一个共享语料库。对 40 条评估查询中的每一条，BM25 都是从整个语料库里选出 30 个候选，而不只是那一行自带的 20 个负例。TypeSafe 再拿查询与每个选中的候选比对，给这 30 个段落重排。

为了清晰，本演练对每个对只问了一个问题。真实应用会在一次调用中针对同一个对问好几个问题。具体做法见[并行问题 cookbook](/cookbooks/parallel_questions)和[推测性扇出模式](/patterns/fan-out)。

***

## 下一步

同样的积木块在 TypeSafe 文档的其他地方也会出现：

* [Noul](/primitives/noul)：TypeSafe 如何把一个是/否问题变成一个分数。
* [推测性扇出](/patterns/fan-out)：在一次调用中针对同一份文档问好几个问题。
* [逐行检索](/cookbooks/semantic_find)：另一种按语义而非关键词检索语料库的方式。
