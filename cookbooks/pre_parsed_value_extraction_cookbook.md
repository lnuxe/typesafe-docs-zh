# 预解析值抽取

> 用正则找出候选的邮箱、电话号码和金额，再让 TypeSafe 选出所要的那一段，使代码能对原文值做规范化。

*正则找出候选值，TypeSafe 挑出问题所问的那一个，代码原样复制。*

这里的 `find` 和 `pick` 这一对可以直接用到你自己的文档上，三个完整案例展示了它的用法：
发件人希望把收据寄到的地址、规范成 `+14155550177` 的电话号码，以及被标成扣款的发票总额
`1315.50 USD`。

TypeSafe 只能从你交给它的选项里挑一个，所以得先把候选找出来。分三步：正则找出候选，
TypeSafe 挑一个，代码复制挑中的那个：

1. 正则找出文本里的候选值。把它调得宁可多找一些。
2. TypeSafe 挑出问题所问的那个候选，并读出代码下游需要的属性
   （币种、国家、一笔金额是入账还是扣款）。
3. 代码复制挑中的值并做规范化。

因为 TypeSafe 只在正则找到的那些片段里挑，返回的值就是其中一段，原样复制。它无法编造
一个值，也不会把数字写错位。

<img src="https://mintcdn.com/ts-docs/2NirYCl-v96cw05F/cookbooks/pre_parsed_value_extraction_cookbook/overview.png?fit=max&auto=format&n=2NirYCl-v96cw05F&q=85&s=4df592e42d251f25fe30c2269f2d182a" alt="Overview diagram" width="1351" height="348" data-path="cookbooks/pre_parsed_value_extraction_cookbook/overview.png" />

*正则从文档里找出候选值，TypeSafe 挑一个，下游代码对它做规范化并据此行动。*

## 环境准备

```bash theme={null}
pip install ipython phonenumbers 'cooksafe>=0.2.0,<0.3.0'
```

然后设置 `TYPESAFE_API_KEY`。

```python theme={null}
import os
import re
from decimal import Decimal
from pathlib import Path

import phonenumbers
from cooksafe import JsonCache, make_playground_link
from IPython.display import Markdown, display
from typesafe_sdk import Choice, Noul, TypeSafeClient

TYPESAFE_MODEL = "jev-1.12"
NONE = "none"  # the escape hatch on every selection: "none of the candidates fits"

# base_url defaults to https://api.typesafe.ai/ ; the env override points at another deployment.
ts = TypeSafeClient(
    api_key=os.environ.get(
        "TYPESAFE_API_KEY", "cache-only"
    ),  # cached re-renders need no key
    base_url=os.environ.get("TYPESAFE_BASE_URL"),
    timeout=30.0,
)
json_cache = JsonCache(Path("json_cache.json"))
```

## 辅助函数

`find` 跑一个宁可多找的正则并给匹配结果去重。`pick` 是一个 `Choice` 问题，它的选项就是
`find` 返回的那些片段，所以它的答案是其中一段的精确复制；没有合适的候选时则是 `none`。
`classify` 是在固定标签集合上的 `Choice` 问题，这里用来读币种和国家。
`is_true` 是一个 `Noul`，这里用来问一笔金额是不是入账。

每次调用都缓存到 `json_cache.json`，所以重新渲染不会发起任何 API 调用。

```python expandable theme={null}
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"\(?\+?\d[\d\s()\-.]{6,}\d")
MONEY_RE = re.compile(r"[$€£¥]\s?\d[\d,]*(?:\.\d{2})?")


def find(pattern: re.Pattern, text: str) -> list[str]:
    """Code-side candidate finder: recall-tuned regex, deduped, in document order."""
    seen: set[str] = set()
    out: list[str] = []
    for match in pattern.findall(text):
        span = match.strip()
        if span and span not in seen:
            seen.add(span)
            out.append(span)
    return out


@json_cache
def pick(document: str, candidates: list[str], question: str) -> dict:
    """TypeSafe selects which found span plays the role. Returns {choice, confidence}.

    The options ARE the candidate spans, so ``choice`` is a verbatim copy of one of them (or the
    ``none`` hatch) - the model chooses, code owns the string."""
    criteria = {c: None for c in candidates} | {
        NONE: "None of these is the requested value."
    }
    answer = ts.system_one(
        state=document,
        questions={"pick": Choice(instructions=question, criteria=criteria)},
        model=TYPESAFE_MODEL,
    ).answers["pick"]
    return {"choice": answer.choice, "confidence": answer.confidence}


@json_cache
def classify(document: str, question: str, options: list[str]) -> dict:
    """A small Choice over a fixed label set (currency, country, ...). Returns {choice, confidence}."""
    answer = ts.system_one(
        state=document,
        questions={
            "q": Choice(instructions=question, criteria={o: None for o in options})
        },
        model=TYPESAFE_MODEL,
    ).answers["q"]
    return {"choice": answer.choice, "confidence": answer.confidence}


@json_cache
def is_true(document: str, question: str) -> float:
    """A yes/no Noul. Returns P(yes)."""
    return (
        ts.system_one(
            state=document,
            questions={"q": Noul(instructions=question)},
            model=TYPESAFE_MODEL,
        )
        .answers["q"]
        .noul
    )
```

## 邮箱：按角色挑出正确的地址

头部里有四个地址。正文要求把收据寄到个人地址，而不是 `To:` 上的账单别名，
所以答案取决于有没有读正文。这里问两个问题：收据该寄给哪个地址，以及这封邮件是哪个地址发的。

```python theme={null}
EMAIL_DOC = """From: Dana Whit <dana.whit@acme-corp.com>
To: billing@acme-corp.com
Cc: orders@acme-corp.com
Reply-To: dana.personal@gmail.com

Hi team - please don't use the billing alias for this one. Send my receipt to my
personal address instead. Thanks, Dana."""

emails = find(EMAIL_RE, EMAIL_DOC)
receipt = pick(
    EMAIL_DOC, emails, "Which email address does the sender want their receipt sent to?"
)
sender = pick(
    EMAIL_DOC, emails, "Which email address did this message come from (the From line)?"
)

print("candidates :", emails)
# code copies the picked value verbatim and normalizes (lowercase); it never re-types it
print(
    f"receipt -> : {receipt['choice'].lower():<28} (conf {receipt['confidence']:.2f})"
)
print(f"sender  -> : {sender['choice'].lower():<28} (conf {sender['confidence']:.2f})")
```

```
candidates : ['dana.whit@acme-corp.com', 'billing@acme-corp.com', 'orders@acme-corp.com', 'dana.personal@gmail.com']
receipt -> : dana.personal@gmail.com      (conf 0.98)
sender  -> : dana.whit@acme-corp.com      (conf 1.00)
```

`receipt` 是 `Reply-To:` 那一行的个人 Gmail 地址，也就是正文要求的那一个；`sender` 是
`From` 那一行的地址。两者都是正则匹配结果的复制，在代码里转成了小写。

## 电话：挑出手机号，规范成 E.164

三个号码，都没有带国家代码。TypeSafe 挑出手机号，并从文本里读出国家；`phonenumbers` 把这两个
答案合成 E.164，即以 `+` 和国家代码开头的国际格式。

```python theme={null}
PHONE_DOC = """Reach our San Francisco office at these numbers: main desk (415) 555-0199,
billing fax (415) 555-0142, and my direct cell (415) 555-0177. Call the cell if it's urgent."""

phones = find(PHONE_RE, PHONE_DOC)
mobile = pick(PHONE_DOC, phones, "Which of these is the direct mobile / cell number?")
region = classify(
    PHONE_DOC,
    "In what country is this office located?",
    ["US", "GB", "DE", "FR", "CA", "AU"],
)

# code copies the picked value and normalizes it with the model-supplied country
parsed = phonenumbers.parse(mobile["choice"], region["choice"])
e164 = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)

print("candidates :", phones)
print(f"mobile  -> : {mobile['choice']}  (conf {mobile['confidence']:.2f})")
print(f"country -> : {region['choice']}  (conf {region['confidence']:.2f})")
print(f"E.164   -> : {e164}")
```

```
candidates : ['(415) 555-0199', '(415) 555-0142', '(415) 555-0177']
mobile  -> : (415) 555-0177  (conf 1.00)
country -> : US  (conf 0.90)
E.164   -> : +14155550177
```

数字本身说明不了哪个是手机号、号码在哪个国家，周围的文字才行。TypeSafe 读这些文字，
`phonenumbers` 把挑中的号码格式化成 `+14155550177`。

## 金额：挑出数额、判断币种、区分入账与扣款

一张发票上有四笔金额。TypeSafe 挑出应付总额和那笔入账，读出币种，并把挑中的每笔金额标成
扣款还是入账。代码复制挑中的字符串并把它解析成一个 `Decimal`。

```python expandable theme={null}
MONEY_DOC = """Invoice INV-2087.
Subtotal: $1,200.00
Sales tax: $115.50
Total due: $1,315.50
A $50.00 courtesy credit from last month has already been applied."""

amounts = find(MONEY_RE, MONEY_DOC)
currency = classify(
    MONEY_DOC,
    "What currency are these amounts in?",
    ["USD", "EUR", "GBP", "JPY", "CAD"],
)
total = pick(MONEY_DOC, amounts, "Which amount is the total the customer must pay?")
credit = pick(
    MONEY_DOC, amounts, "Which amount is the courtesy credit that was applied?"
)


def to_decimal(value: str) -> Decimal:
    """Copy the picked value and parse the number in code (US grouping/decimal here)."""
    return Decimal(re.sub(r"[^\d.]", "", value))


for label, chosen in [("total due", total), ("credit", credit)]:
    is_credit = is_true(
        MONEY_DOC,
        f"Is the amount {chosen['choice']} a credit or refund to the customer, not a charge?",
    )
    kind = "credit" if is_credit > 0.5 else "charge"
    print(
        f"{label:<10}: {chosen['choice']:<10} -> {to_decimal(chosen['choice'])} {currency['choice']} "
        f"({kind}, P(credit)={is_credit:.2f})"
    )
print("\ncandidates :", amounts)
```

```
total due : $1,315.50  -> 1315.50 USD (charge, P(credit)=0.01)
credit    : $50.00     -> 50.00 USD (credit, P(credit)=0.99)

candidates : ['$1,200.00', '$115.50', '$1,315.50', '$50.00']
```

应付总额是 \$1,315.50，入账是 \$50.00，都以 USD 计。"是入账还是扣款"的 `Noul` 在总额上
答 0.01、在入账上答 0.99，于是代码知道自己解析出的每个 `Decimal` 的符号。

> `to_decimal` 假定逗号是千位分隔符、点是小数点。对 `$1,315.50` 成立；在 `€1.315,50` 里
> 正好相反。可以用一个 `Noul` 问题问文档用的是哪种约定，再在代码里据此分支。

## 在 TypeSafe playground 中打开

一个分享链接，在浏览器里打开那封邮件，上面带着收据那个问题，选项里包含正则找到的四个地址。

```python theme={null}
receipt_criteria = {e: None for e in emails} | {
    NONE: "None of these is the requested value."
}
playground_link = make_playground_link(
    EMAIL_DOC,
    {
        "receipt": Choice(
            instructions="Which email address does the sender want their receipt sent to?",
            criteria=receipt_criteria,
        )
    },
    models=[TYPESAFE_MODEL],
)
display(
    Markdown(
        f"🔗 [Open this thread + selection in the TypeSafe playground]({playground_link})"
    )
)
```

<a href="https://console.typesafe.ai/playground#share/N4IgJg9gxgrgtgUwHYBcAqCAeKQC4AEIAYgE4RwEAiAhktfgOoAWAlivgDxi3UB0A7qxQABalEQBaKBBIAHXtLgA+ADpI0EAgCMWAG10skAc1HiEUmfMVqAwlAIywCEgGdTk6XIXk1AJQSyugCeEhoE3HS8ss4uEHS6wkZw1HrecGpqABIs+CgI1HD4EviB+S4I+JBIAOTsMOW5TBU6+oZG+NQG1C74AGYyjSw9cQi8+ADKyGD4cEH4JAhQCCyy7CgQM0Fq0a5xnR1gYAsuPYYuedRgY2hMtADWLgA0+DSRIM8gsmRwqy4Y2HhCMAVCAFksVigQQRgSAUEFolD8CCoEwICwliDniCzigSDAoCgWHEXIiQcx0Ux8AhknoDkcECdKhAGY0KuUkE4SPh+LQ1k0WFywctVvh2WsIAB+TFIkBQEhsZwsaiImERPiCNjucyeKw+QFIGD6LEgFoGYxaixeaz6w26Y2OGIWnVpREGo0ytVRGJ7BJJFK6F0290gpAjUkgAByI3wEF6rIaQ1Z8wQAEcYAy8tMAG6ddO8EEAXyL70I1FkLAAajEiUhASAswBGEsgcq6RaZgCyECcuhcgIA2iAAFYILMSBu8BsAJhAAF0C0A" target="_blank" rel="noreferrer" className="text-primary">在 TypeSafe playground 中打开这封邮件和这次选择 →</a>

## 两个限制

* 一个 `Choice` 问题最多允许 255 个选项。候选比这更多时，分两步收窄：
  先挑出所在段落，再挑段落里的那一段文字。
* 真正费工的是找候选。邮箱、电话号码和金额都有现成的正则覆盖；人名没有，
  所以它的候选只能来自你已有的名册，或者来自命名实体识别器，或一个负责提名的 LLM。
  之后 TypeSafe 挑出问题所问的那一个。
