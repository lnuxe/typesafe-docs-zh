# 日期抽取

> 通过向 TypeSafe 询问文档中点名的各个部分来抽取绝对日期与相对日期，再在代码里解析与校验，并依据置信度决定是否人工复核。

*用 TypeSafe 从文本里读出日期的各个组成部分，再在代码里把它们解析成一个 `date`。*

这里要构建的函数 `extract_date(document, role)` 接收一份文档和一个指代所需日期的短语，
比如 "the deadline to return the form"，返回一个 `date` 及其置信度。它会标出置信度偏低的结果，
以及各部分根本凑不出一个日期的结果，包括文档从未提到的日期。日期可以写全
（"August 14, 2027"），也可以相对今天来写（"tomorrow"、"next Thursday"）。

TypeSafe 在一次调用中回答关于这个日期的若干 `Choice` 问题：它是哪一类日期，
以及文本点名了哪个年、月、日或星期。代码把这些答案变成一个 `date`。
模型只读文本说了什么，日历运算一概不做。

下面的代码单元把这个函数跑在四份短文档上，打印每个日期及其置信度，并把结果分成
代码直接接受的和需要人工过目的两类。

<img src="https://mintcdn.com/ts-docs/2NirYCl-v96cw05F/cookbooks/date_extraction_cookbook/overview.png?fit=max&auto=format&n=2NirYCl-v96cw05F&q=85&s=4d1d1d4d446eefafb556505d9834e7a0" alt="Overview diagram" width="1351" height="348" data-path="cookbooks/date_extraction_cookbook/overview.png" />

*TypeSafe 读出日期是怎么写的、文本点名了哪些部分。代码把这些答案变成一个 `date`，
日期是相对的就从今天算起，然后要么接受它，要么送去复核。*

## 环境准备

```bash theme={null}
pip install ipython 'cooksafe>=0.2.0,<0.3.0'
```

然后设置 `TYPESAFE_API_KEY`。

```python expandable theme={null}
import os
from datetime import date, timedelta
from pathlib import Path

from cooksafe import JsonCache, make_playground_link
from IPython.display import Markdown, display
from typesafe_sdk import Choice, TypeSafeClient

TYPESAFE_MODEL = "jev-1.12"
TODAY = date(
    2026, 7, 30
)  # fixed reference "today" so relative dates resolve reproducibly
REVIEW_BELOW = 0.60  # gate: a date below this confidence is flagged for a human

MONTHS = {
    "January": 1,
    "February": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12,
}
WEEKDAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]
YEAR_WINDOW = list(range(1900, 2051))  # 1900..2050

# Cached to json_cache.json (shipped with the cookbook, so re-rendering replays the published
# results with no API spend); delete it to re-run live.
json_cache = JsonCache(Path("json_cache.json"))
```

```python theme={null}
# The demo cells below run when this file is executed as the cookbook; the constants and the pure
# resolve/assemble code stay importable, so the calendar math can be unit-tested on its own.
if __name__ == "__cookbook__":
    client = TypeSafeClient(
        api_key=os.environ.get(
            "TYPESAFE_API_KEY", "cache-only"
        ),  # cached re-renders need no key
        base_url=os.environ.get("TYPESAFE_BASE_URL"),
        timeout=30.0,
    )
```

## 问题

一次调用发出七个 `Choice` 问题。`mode` 说明日期是怎么写的：`absolute` 表示点名了月份的日期，
`relative` 表示相对今天写的日期，`none` 表示文档根本没有提到这个日期。

另外六个读各个组成部分。绝对日期需要 `month`、`day` 和 `year`。相对日期需要
`day_anchor`：今天、明天、后天，或点名的星期几。点名了星期几时，`weekday` 和 `week_offset`
说明是哪一个、哪一周。代码只读 `mode` 点名要的那几个部分。

`year` 从 1900 到 2050 每年列一个选项，外加两个出口。`none` 表示文本没给年份、由代码补一个。
`out_of_range` 表示文本给出的年份不在列表里，代码据此标记而不是去猜。如果嫌列表太长，
可以先把文本里像年份的数字挑出来，只把它们给模型。

```python expandable theme={null}
def date_questions(role: str) -> dict[str, Choice]:
    """Seven typed choices that read a date's shape and parts off the text -- no math."""
    absent = "The document does not state this, or it is not this kind of date."
    return {
        "mode": Choice(
            instructions=(
                f"How is {role} written? 'absolute' = a calendar date naming a month (e.g. "
                "'August 14', 'the 3rd of March'); 'relative' = given relative to today (today, "
                "tomorrow, the day after tomorrow, or a named weekday such as 'next Thursday'); "
                "'none' = the document does not state this date."
            ),
            criteria={"absolute": None, "relative": None, "none": None},
        ),
        "month": Choice(
            instructions=f"If {role} is an absolute calendar date, which month is it in?",
            criteria={m: None for m in MONTHS} | {"none": absent},
        ),
        "day": Choice(
            instructions=f"If {role} is an absolute calendar date, which day of the month (1-31)?",
            criteria={str(d): None for d in range(1, 32)} | {"none": absent},
        ),
        "year": Choice(
            instructions=(
                f"If {role} is an absolute calendar date, which year? Pick 'none' if the document "
                "states no year (code infers it), or 'out_of_range' if a year is stated but not "
                "in the list."
            ),
            criteria={str(y): None for y in YEAR_WINDOW}
            | {
                "out_of_range": "A year is stated for this date but is outside the listed range.",
                "none": "No year is stated for this date.",
            },
        ),
        "day_anchor": Choice(
            instructions=(
                f"If {role} is relative to today, which day is it? 'today', 'tomorrow', "
                "'day_after' (the day after tomorrow), or 'weekday' (a named day of the week)."
            ),
            criteria={
                "today": None,
                "tomorrow": None,
                "day_after": None,
                "weekday": None,
                "none": absent,
            },
        ),
        "weekday": Choice(
            instructions=f"If {role} names a day of the week, which one?",
            criteria={w: None for w in WEEKDAYS} | {"none": absent},
        ),
        "week_offset": Choice(
            instructions=(
                f"If {role} names a weekday, which week is it in? 'next' for 'next Thursday' or "
                "'Thursday next week'; 'current' for 'this Thursday'; 'none' for a bare weekday "
                "with no qualifier (just 'Thursday' / 'on Thursday')."
            ),
            criteria={"current": None, "next": None, "none": absent},
        ),
    }
```

## 在代码里解析

`read_parts` 负责发起调用。`assemble` 把答案变成一个 `date`：文本没给年份时它补上年份，
并算出点名的星期几指向哪一天。这两件事都从 `TODAY` 算起，而它是钉住的，
好让相对日期每次运行都得到同样的结果。`assemble` 还会报告它用到的各部分中最低的置信度，
所以任何一个部分答得勉强，整个日期就会被送去复核。

"next Thursday" 可能指两个不同的日子，所以由代码来定。不带限定的星期几指今天或之后
最近的那一个。`next` 指下一个自然周，`current` 指本周。

```python expandable theme={null}
@json_cache
def read_parts(document: str, role: str) -> dict:
    """One TypeSafe call -> {part: {choice, confidence}} for the seven questions."""
    answers = client.system_one(
        state=document, questions=date_questions(role), model=TYPESAFE_MODEL
    ).answers
    return {
        part: {"choice": ans.choice, "confidence": ans.confidence}
        for part, ans in answers.items()
    }


def resolve_weekday(today: date, weekday: str, week_offset: str) -> date:
    """Which date a named weekday points to, by our stated convention: a bare weekday is the next
    occurrence on or after today; 'next' is the following calendar week; 'current' is this week."""
    w = WEEKDAYS.index(weekday)
    this_monday = today - timedelta(days=today.weekday())
    if week_offset == "next":
        return this_monday + timedelta(days=7 + w)
    if week_offset == "current":
        return this_monday + timedelta(days=w)
    return today + timedelta(days=(w - today.weekday()) % 7)


def assemble(parts: dict, today: date = TODAY) -> dict:
    """Resolve the parts TypeSafe read into a concrete date, in code. Confidence is the weakest of
    the parts the shape actually used."""
    mode = parts["mode"]["choice"]
    confs = [parts["mode"]["confidence"]]

    def result(resolved: date | None, note: str) -> dict:
        usable = [c for c in confs if c is not None]
        confidence = min(usable) if usable else None
        needs_review = (
            resolved is None or confidence is None or confidence < REVIEW_BELOW
        )
        return {
            "date": resolved,
            "confidence": confidence,
            "needs_review": needs_review,
            "note": note,
        }

    if mode == "none":
        return result(None, "no such date stated")

    if mode == "absolute":
        month, day, year = (
            parts["month"]["choice"],
            parts["day"]["choice"],
            parts["year"]["choice"],
        )
        confs += [
            parts["month"]["confidence"],
            parts["day"]["confidence"],
            parts["year"]["confidence"],
        ]
        if "none" in (month, day) or not day.isdigit() or month not in MONTHS:
            return result(None, "absolute date incomplete")
        if (
            year == "out_of_range"
        ):  # a year is stated but off the list -> flag, don't guess
            return result(None, f"year outside {YEAR_WINDOW[0]}-{YEAR_WINDOW[-1]}")
        if (
            year == "none"
        ):  # no year stated -> infer this year, bumped to next if well past
            try:
                resolved = date(today.year, MONTHS[month], int(day))
            except (
                ValueError
            ):  # e.g. February 30 -- an inconsistent read, not a real date
                return result(None, f"impossible date: {month} {day}")
            if resolved < today - timedelta(days=31):
                resolved = date(today.year + 1, MONTHS[month], int(day))
            return result(resolved, "")
        try:  # a stated, in-range year
            return result(date(int(year), MONTHS[month], int(day)), "")
        except ValueError:
            return result(None, f"impossible date: {year}-{month}-{day}")

    if mode == "relative":
        anchor = parts["day_anchor"]["choice"]
        confs.append(parts["day_anchor"]["confidence"])
        if anchor == "today":
            return result(today, "")
        if anchor == "tomorrow":
            return result(today + timedelta(days=1), "")
        if anchor == "day_after":
            return result(today + timedelta(days=2), "")
        if anchor == "weekday":
            weekday, offset = parts["weekday"]["choice"], parts["week_offset"]["choice"]
            confs += [
                parts["weekday"]["confidence"],
                parts["week_offset"]["confidence"],
            ]
            if weekday not in WEEKDAYS:
                return result(None, "relative weekday not read")
            return result(resolve_weekday(today, weekday, offset), "")
        return result(None, "relative day not read")

    return result(None, f"unrecognized mode: {mode}")


def extract_date(document: str, role: str) -> dict:
    return assemble(read_parts(document, role))
```

## 跑一遍

六条查询分布在四份短文档上：合同里两个写明年份的日期、一个没写年份的表单截止日期、
一个 "today" 截止的问卷、一个定在 "next Thursday" 的设计评审会，以及一个表单从未提到的日期。
它们都相对 `TODAY` = 2026-07-30（星期四）解析。

```python theme={null}
CONTRACT = "This agreement is effective January 1, 2025 and expires December 31, 2027."
FORM = "Please return the signed form by August 14."
SURVEY = "Heads up - the customer survey closes today at 5pm."
REVIEW = "Let's schedule the design review for next Thursday."

# (document, question phrase, expected date) -- the expected value is only for the scorecard.
EXAMPLES = [
    (CONTRACT, "the date the agreement takes effect", date(2025, 1, 1)),
    (CONTRACT, "the date the agreement expires", date(2027, 12, 31)),
    (FORM, "the deadline to return the form", date(2026, 8, 14)),
    (FORM, "the date of the kickoff call", None),
    (SURVEY, "the date the survey closes", date(2026, 7, 30)),
    (REVIEW, "the date of the design review", date(2026, 8, 6)),
]

if __name__ == "__cookbook__":
    print(f"{'':3}{'question':<38}{'expected':<12}{'got':<12}{'conf':>6}  flags")
    print("-" * 84)
    for document, role, expected in EXAMPLES:
        r = extract_date(document, role)
        got = r["date"].isoformat() if r["date"] else "none"
        exp = expected.isoformat() if expected else "none"
        mark = "OK" if r["date"] == expected else "XX"
        conf = f"{r['confidence']:.2f}" if r["confidence"] is not None else " n/a"
        flags = "  <== review" if r["needs_review"] else ""
        if r["note"]:
            flags += f"  ({r['note']})"
        print(f"{mark:<3}{role:<38}{exp:<12}{got:<12}{conf:>6}{flags}")
```

```
   question                              expected    got           conf  flags
------------------------------------------------------------------------------------
OK the date the agreement takes effect   2025-01-01  2025-01-01    0.97
OK the date the agreement expires        2027-12-31  2027-12-31    0.91
OK the deadline to return the form       2026-08-14  2026-08-14    0.95
OK the date of the kickoff call          none        none          0.46  <== review  (absolute date incomplete)
OK the date the survey closes            2026-07-30  2026-07-30    0.94
OK the date of the design review         2026-08-06  2026-08-06    0.92
```

合同的两个年份都写明了，所以直接用文本里的。表单没写年份，于是代码补上 2026：
它取当前年份，只有当那个日期已经过去一个多月时，才挪到下一年。"today" 和 "next Thursday"
走的是和写明的日期同一个函数。

启动会是表单从未提到的那一个。表单里确实有日期，只是不是这一个，而备注
`absolute date incomplete` 说明 `mode` 返回了 `absolute`，却没有与之配套的月份。
日期返回为空，置信度是 0.46，这一行被标出来交给人工。

## 用于路由的置信度

每个答案都带着校准过的置信度返回，而一个日期的置信度是组成它的各部分中最低的那个。
低于 `REVIEW_BELOW` = 0.60 的日期会交给人工，代码根本拼不出来的日期也一样。
其余的照常通过。

```python theme={null}
if __name__ == "__cookbook__":
    confident = [
        (doc, role)
        for doc, role, _ in EXAMPLES
        if not extract_date(doc, role)["needs_review"]
    ]
    review = [
        (doc, role)
        for doc, role, _ in EXAMPLES
        if extract_date(doc, role)["needs_review"]
    ]
    print(f"auto-accept ({len(confident)}):")
    for _doc, role in confident:
        print(f"  - {role}")
    print(f"\nsend to review ({len(review)}):")
    for _doc, role in review:
        r = extract_date(_doc, role)
        print(
            f"  - {role}  (conf {r['confidence']:.2f} / {r['note'] or 'low confidence'})"
        )
```

```
auto-accept (5):
  - the date the agreement takes effect
  - the date the agreement expires
  - the deadline to return the form
  - the date the survey closes
  - the date of the design review

send to review (1):
  - the date of the kickoff call  (conf 0.46 / absolute date incomplete)
```

## 在 TypeSafe playground 中打开

下面的链接带着 "next Thursday" 那条消息和代码发出的同一组问题。打开它就能看到答案和它们的
置信度，还能在不写任何代码的情况下改措辞。

```python theme={null}
if __name__ == "__cookbook__":
    playground_link = make_playground_link(
        REVIEW, date_questions("the date of the design review"), models=[TYPESAFE_MODEL]
    )
    display(
        Markdown(
            f"🔗 [Open this document + questions in the TypeSafe playground]({playground_link})"
        )
    )
```

<a href="https://console.typesafe.ai/playground#share/N4IgJg9gxgrgtgUwHYBcAqCAeKQC4AEIAMgigOQDO+FUAFgmDADYL4r35gIUCWA5knwAnBADceCAO74AZhCH4kWFPjS0YQimACGATwB0IADSEADkIhxTKChmx5CwADog4ELi4LOQKXaYSe+C50EDxQAcZBIDxIFChCMFAoPBCxgS4AEhDSPFTsrDoorBAybBxcvALCYhLSkkI8KEVIAPz4ZNoARhQQTDBFZPgAvPja+FDaLEg6CoWsSNpwMXyj+G6otPgAFAj6fPrtAIIwfDBx+ACMACxkJmT5+ADMQmD4JfgAstpCdGQAlABudoiJjaZKiBCDEZ8HgQwQgsGw1goCBsdx6bYonS6EwotxCCySXHlDHaGRFBR4+SEkzyVYLRCvSQIBAAa2x1ESm20VDISmwqnUmmx-yBfNSkOGZQK0HgyBUkG4iggKjiYORtFynHV+hcJmCDQpPG0gW8XR6fSKgSQzCY+pACPBEQINqYdqiSAl1ttAF8ffb1uxTS5fP50iAQmEIvaYnEEkkUmkHC4AJKlB5zN7p8rcfjwmpSfBa7SCc29fqsCZTGbaoomSSauhrVLsItURpF1p6qJQQ0IBomhzeABSJZg3103rd9oAYghOgkJ1P3S4vj9aMv7YdzDwmJuol9Jw5XSuQMOYEp9y5z0wjy7bVuTmcUFeQABlBDWBBwTr918AeSSCBfyEV8ADkIAhH8-2PB8ogAEQQcJoNA2Dpw9L1kxANQZVgRBUE4CAlU9VUUHVMpclpBQOy1EiKKoVkYled45l1EA-XtbFgx8PxnR7WhQnCbsXFjeJEmSVIKHDNNpVrYpswKXMqhEcRC2LUtunLIpxkmZAazmetG02Dl3geQNNi2C4AFpHguP4WmEiM+wHbiLlfAAmV9HlfK5XwAVlfAA2V8AHZXwADlfABOV8LgABlity0NPC5POS+0Lm89KomuWKAuylwLmCgqQAuMKSouSKKpikr3IS2qkvvdCXHctKmtPdysva+13N82r8u6qJ3OKwaWvK0aQHcqqJvcmqJseer5saxQ4JcT1LywnDCLw+VCOIlVqDI7T2Eot5qJUWiDpOhimKzOS2I4qJdAQb5uNDPjggEqNHNE+MJKTAhUwUuS7ozJT81UnIqBLUZNMtStdOmb45MMsJNme742gABTCVl2nWyUeGByAdoItUiioT18AxhQtigdxWBiGR+3bFA-io9oIH6AB9EpuaEEs+EJ0oxhpttDvVV5On6ZULsEB4mFyFA2PtXtGn7Y1XKiuLFpW5rSu15aTwy7W2r1lLta682TbivqJoubWButnLtZG53Cu18b3YNuLpu9h24rm-2ovi2KQ6N1aDdSsPMpju3g4uJ3jZdoqY695OPcqmOg4zg26rD9yI-1h3WoLq3c5L+OK6i9yk8jku3er9z0-rmu-abnPW4WsPbJ7s3q8ecuu6rru6+LqLHkbruW-Hx5267zvx6uXXq6uIuLaufvW6uIel5Hpex43qel5njf56XxeLb8lfW789eTb8rfx783er-3q-D4f4+r9Ph-z6vy+JtAo33HoFe+LtApPwtoFV+QD35AM-hA7+QDf4QP-kAwBLsQogItiFcBHsQpQJNiFWBWD4FYMQQQ5BWDUEEPQVgzBHtwo4JNuFfBBtwpEJduFUhTDyFMMoRw6hTDaEcPoUwxhBttZhxDjIrhHsJ4yP4VIwRDsorCKkaItR4ipGSLqjrDyOt2H6PkZNHWvCzG20MXFQR+iNH6NEfonR+i9FxVDrVNxxi3GmLqrHDxuV-G2LcfYtxji3HOLca4-OHjC6GNLjEixdVepxKCcNOJYSppxNcd3Dxvdck+LioPQxjxlF1UeEEyexSwlz2Ka45ehi14NIKTvBppTbZBKuCEq4YSrgRKuK46+r4uYoF5jIfmgsPogEONTF61EqDkwYLIOk10QbSwulQYZvAuCyUVnERZAskBCxVhhDagMQAQRmcjLUCzXhyEpJqKgrEXCPRcNibmJYQioS8CGXi4ZIxCUiCJWIYkEySWksTcipkcyVAhrUcWjokRojRNiVGTYORakaG0e46JdC3HaFSAk2Q8VkDeWSCkgwtgZlJOSfsaJ8SEnZmddozI2Qim2GMBkiyTLAxZayP4xyDTqxckOEMOLXwEsJK+UlNKvne15VxEqBNwxbRJnKAiipKYHQWfRDmNFNUqBWYxaYd0nnsX9FEeVeg3q-Kwv86MURfriUTFJLCMkqXaShYpGF1RIaKEWEqMY3LZK8tRZsCUDlAVOSFZrEVIAPipAVRNNAMBuCJu9gAdQYEoLQVqSpqA0Dmu83sZwNDTbnN8YINBlsjm+C81b9ZKs2uUWU+EFREX1RLY6DzdXrNlvRfARrmKlFNS8kAvLRkyAoKQa1YZbVfQBTGYFf1nXgtkpmT1nBwY+rhZy6G+BLU4n3UZfdLI8YYrlli-k5AlkKD5MoQUBa2V0jIPm4UGIr0nrZGQMUsACTykGHc-FDyH1vtxWKAmAG6RjE6N8VgB792NE2FTAAjuORWMgJC0wAFbPnaK+wtgwAD0nNBD4ZFPyxyasjSDm+RGDQIhUCvivUxzCZyVUtt2hqvt2rro9vFnRQ1t0WI6meX6SIIBtCmB4AANRZomBwIBRAXHE1OlgSQGDxq4EwCgDgADaIAsNiCshcfQqUQAAF0fRAA" target="_blank" rel="noreferrer" className="text-primary">在 TypeSafe playground 中打开这份文档和这些问题 →</a>
