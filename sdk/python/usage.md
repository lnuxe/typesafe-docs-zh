# 用法

> 使用 TypeSafe Python SDK 的指南与模式。

<a id="usage" />

<h2 id="calling-the-system-one-api">
  调用 System One API
</h2>

<Tabs>
  <Tab title="异步">
    ```python theme={null}
    import asyncio

    from typesafe_sdk import AsyncTypeSafeClient, Choice, Noul, Score


    async def main() -> None:
        async with AsyncTypeSafeClient() as client:
            result = await client.system_one(
                "I was charged twice. Please help ASAP.",
                {
                    "billing": Noul(instructions="Is this about billing?"),
                    "tone": Choice(
                        instructions="What is the tone?",
                        criteria={"calm": None, "angry": None},
                    ),
                    "urgency": Score(
                        instructions="How urgent is this?",
                        criteria=["low", "medium", "high"],
                    ),
                },
            )
            print(
                result.nouls["billing"].noul,
                result.choices["tone"].choice,
                result.scores["urgency"].score,
            )


    asyncio.run(main())
    ```
  </Tab>

  <Tab title="同步">
    ```python theme={null}
    from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

    client = TypeSafeClient()
    state = "I was charged twice. Please help ASAP."
    questions = {
        "billing": Noul(instructions="Is this about billing?"),
        "tone": Choice(
            instructions="What is the tone?", criteria={"calm": None, "angry": None}
        ),
        "urgency": Score(
            instructions="How urgent is this?", criteria=["low", "medium", "high"]
        ),
    }
    result = client.system_one(state, questions)
    print(
        result.nouls["billing"].noul,
        result.choices["tone"].choice,
        result.scores["urgency"].score,
    )
    ```
  </Tab>
</Tabs>

<h2 id="typed-system_one-responses">
  带类型标注的 <code>system\_one</code> 响应
</h2>

可以给 `system_one` 传入响应模型，让响应的使用更*类型安全*：

```python theme={null}
from typesafe_sdk import Noul, NoulAnswer, SystemOneResponse, TypeSafeClient


class BillingResponse(SystemOneResponse):
    billing: NoulAnswer


with TypeSafeClient() as client:
    result = client.system_one(
        "I was charged twice.",
        {"billing": Noul(instructions="Is this about billing?")},
        response_model=BillingResponse,
    )
    assert 0 <= result.billing.noul <= 1
    assert result.billing == result.nouls["billing"]
    print(result.request_id)
```

<h3 id="custom-response-types">
  自定义响应类型
</h3>

也可以定义全新的响应模型，不从 `SystemOneResponse` 继承：

```python theme={null}
from pydantic import BaseModel

from typesafe_sdk import Noul, NoulAnswer, TypeSafeClient


class BillingAnswers(BaseModel):
    billing: NoulAnswer


class BillingResponse(BaseModel):
    answers: BillingAnswers


result = TypeSafeClient().system_one(
    "I was charged twice.",
    {"billing": Noul(instructions="Is this about billing?")},
    response_model=BillingResponse,
)
assert 0 <= result.answers.billing.noul <= 1
```

<h2 id="choosing-a-model">
  选择模型
</h2>

查看可用模型：

```python theme={null}
from typesafe_sdk import TypeSafeClient

print(TypeSafeClient().models.list())
```

在构造客户端时选择模型：

```python theme={null}
client = TypeSafeClient(model="jev")
```

详见[模型资源参考](/sdk/python/api/clients/sync#models-resource)。

<h2 id="configuring-the-base-url">
  配置基础 URL
</h2>

要让 SDK 使用其他 API 地址，可以设置客户端上的 `base_url`，或设置 `TYPESAFE_BASE_URL` 环境变量。

例如，用 AI 网关的 API 密钥和模型 ID 连接：

<Tabs>
  <Tab title="OpenRouter">
    使用 OpenRouter API 密钥和 [OpenRouter 模型 ID](https://openrouter.ai/~typesafe/jev-latest/)：

    skip: next

    ```python theme={null}
    import os

    from typesafe_sdk import Noul, TypeSafeClient

    with TypeSafeClient(
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api",
        model="~typesafe/jev-latest",
    ) as client:
        result = client.system_one(
            "I was charged twice.",
            {"billing": Noul(instructions="Is this about billing?")},
        )
        print(result.nouls["billing"].noul)
    ```
  </Tab>

  <Tab title="Vercel AI Gateway">
    [Vercel 的 TypeSafe 兼容 API](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe) 可以和 SDK 一起使用：

    skip: next

    ```python theme={null}
    import os

    from typesafe_sdk import Noul, TypeSafeClient

    with TypeSafeClient(
        api_key=os.environ["AI_GATEWAY_API_KEY"],
        base_url="https://ai-gateway.vercel.sh/typesafe",
        model="typesafe-ai/jev",
    ) as client:
        result = client.system_one(
            "I was charged twice.",
            {"billing": Noul(instructions="Is this about billing?")},
        )
        print(result.nouls["billing"].noul)
    ```
  </Tab>
</Tabs>

这要求替代 API 遵循 [TypeSafe OpenAPI 规范](https://api.typesafe.ai/docs/)。

<h2 id="retries">
  重试
</h2>

在客户端上或每次调用时，把自定义的 [`RetryPolicy`](/sdk/python/api/retries) 作为 `retry` 传入。API 密钥无效时会在创建客户端期间抛出 `TypeSafeError`，此时还没有发出任何请求或进行重试。

<Tabs>
  <Tab title="客户端">
    ```python theme={null}
    from typesafe_sdk import RetryPolicy, TypeSafeClient

    client = TypeSafeClient(retry=RetryPolicy(max_retries=3, backoff_max=0.2, timeout=1.0))
    ```
  </Tab>

  <Tab title="每次调用">
    ```python theme={null}
    from typesafe_sdk import RetryPolicy

    client.system_one(
        state, questions, retry=RetryPolicy(max_retries=3, backoff_max=0.2, timeout=1.0)
    )
    ```
  </Tab>
</Tabs>

<h2 id="error-handling">
  错误处理
</h2>

处理 SDK 抛出的[异常](/sdk/python/api/exceptions)：

```python theme={null}
from typesafe_sdk import TypeSafeAPIError

try:
    client.system_one(state, questions)
except TypeSafeAPIError as error:
    print(error.status, error.request_id)
```

<h2 id="logging">
  日志
</h2>

SDK 会把日志写入 `typesafe_sdk` 日志器。可以按照[标准日志](https://docs.python.org/3/library/logging.html)指南进行配置：

```python theme={null}
import logging

logging.getLogger("typesafe_sdk").setLevel(logging.DEBUG)
```

也可以在导入 SDK 之前，把 `TYPESAFE_LOG_LEVEL` 设为 `debug`、`info`、`warning`、`error` 或 `off`。

`info` 会为每个请求记录一行摘要；`debug` 还会记录请求头、响应头以及请求体和响应体。敏感请求头——authorization、API 密钥、cookie，以及名称中含 `token` 或 `secret` 的请求头——会从日志输出中隐去。请求体和响应体**不会**隐去。

<h2 id="environment-variables">
  环境变量
</h2>

SDK 会读取并使用以下环境变量：

| 变量                     | 作用                                                | 默认值                    |
| ------------------------ | --------------------------------------------------- | ------------------------- |
| `TYPESAFE_API_KEY`       | API 密钥（必填）                                    | —                         |
| `TYPESAFE_BASE_URL`      | API 根 URL                                          | `https://api.typesafe.ai` |
| `TYPESAFE_DEFAULT_MODEL` | 默认模型                                            | `jev-latest`              |
| `TYPESAFE_LOG_LEVEL`     | `typesafe_sdk` 日志器级别，仅在导入时应用一次       | 未设置                    |

SDK 的默认值见[常量参考](/sdk/python/api/constants)。

通过 `api_key` 或 `TYPESAFE_API_KEY` 提供的 API 密钥会去掉首尾空白，包括密钥文件带来的换行。空密钥、中间空白、控制字符和非 ASCII 字符会在发出请求之前被拒绝。显式传入的空密钥不会回退到环境变量。

<h2 id="forward-compatibility">
  向前兼容
</h2>

随着 TypeSafe API 演进，SDK 会继续可用，因此你可以在某个 SDK 版本正式支持之前，就先用上新的 API 特性。

<h3 id="extra-request-fields">
  额外的请求字段
</h3>

可以用 [`extra_body`](/sdk/python/api/clients/sync) 发送额外的 API 请求字段。下面的 `beam_width` 只是示例；请只发送 API 支持的字段。

skip: next

```python theme={null}
from typesafe_sdk import Noul, TypeSafeClient

with TypeSafeClient() as client:
    client.system_one(
        "I was charged twice.",
        {"billing": Noul(instructions="About billing?")},
        extra_body={"beam_width": 4},
    )
```

<h3 id="raw-question-dictionaries">
  原始问题字典
</h3>

```python theme={null}
from typesafe_sdk import TypeSafeClient

with TypeSafeClient() as client:
    client.system_one(
        "I was charged twice.",
        {"billing": {"type": "noul", "instructions": "About billing?", "weight": 2}},
    )
```

<Tip>
  **提示**

  未知字段是向前兼容的备用出口。可以忽略它们的类型检查错误，更好的做法是升级 SDK。
</Tip>

<h3 id="unknown-answer-kinds">
  未知的答案类型
</h3>

SDK 会记录一条警告，并跳过无法识别的答案类型。用 `raw_http_response` 可以查看完整的 API 响应，包括这些答案：

```python theme={null}
from typesafe_sdk import Noul, TypeSafeClient

result = TypeSafeClient().system_one(
    "I was charged twice.",
    {"billing": Noul(instructions="Is this about billing?")},
)
raw_answers = result.raw_http_response.json()["answers"]
```

<h3 id="unknown-response-fields">
  未知的响应字段
</h3>

可识别的响应上的未知额外字段会被忽略。
