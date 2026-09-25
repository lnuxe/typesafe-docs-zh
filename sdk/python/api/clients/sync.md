# 同步客户端

> 用 TypeSafeClient 提问、列出模型，并配置同步 TypeSafe API 请求。

export function SdkSignature({children}) {
  async function copy(event) {
    const button = event.currentTarget;
    const code = button.parentElement.querySelector("pre code");
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.setAttribute("aria-label", "Signature copied");
      button.dataset.copied = "true";
    } catch {
      button.setAttribute("aria-label", "Copy failed; select the signature to copy");
    }
    setTimeout(() => {
      button.setAttribute("aria-label", "Copy signature");
      delete button.dataset.copied;
    }, 2000);
  }
  return <div className="sdk-signature not-prose">
      <button type="button" className="sdk-signature-copy" aria-label="Copy signature" onClick={copy}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
      <pre tabIndex={0} aria-label="SDK signature"><code>{children}</code></pre>
    </div>;
}

<a id="synchronous-client" />

<h2 id="typesafe_sdk.TypeSafeClient">
  typesafe\_sdk.TypeSafeClient
</h2>

<SdkSignature>
  <span className="nf">{"TypeSafeClient"}</span><span className="p">{"("}</span>{"\n"}{"    "}<span className="o">{"*"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"api_key"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"model"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"retry"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">{"RetryPolicy"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"timeout"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/functions.html#float">{"float"}</a></span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="n">{"httpx2"}</span><span className="o">{"."}</span><span className="n">{"Timeout"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"headers"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{"]"}</span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"transport"}</span><span className="p">{":"}</span>{" "}<span className="n">{"httpx2"}</span><span className="o">{"."}</span><span className="n">{"BaseTransport"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"http_client"}</span><span className="p">{":"}</span>{" "}<span className="n">{"httpx2"}</span><span className="o">{"."}</span><span className="n"><a href="https://pydantic.dev/docs/httpx2/api/api/#httpx2.Client">{"Client"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"base_url"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}<span className="p">{")"}</span>{"\n"}
</SdkSignature>

为 [TypeSafe AI API](https://typesafe.ai) 创建 HTTP 客户端。

显式传入的选项优先于环境变量；空值或只有空白的环境变量值会被忽略。

<Tip>
  **日志配置**

  SDK 把日志写到 `typesafe_sdk` 日志器；用标准 logging 配置它，或设置 `TYPESAFE_LOG_LEVEL`（`debug`、`info` 等）快速采用默认值。密钥类请求头会从日志输出中脱敏；请求体和响应体不会。
</Tip>

参数：

* **`api_key`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>，默认：`None` ) –

  必填的 API 密钥；也可以通过 `TYPESAFE_API_KEY` 环境变量设置。首尾空白会被去掉。空密钥、内部空白、控制字符和非 ASCII 字符都会被拒绝。
* **`model`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>，默认：`None` ) –

  模型名；也可以通过 `TYPESAFE_DEFAULT_MODEL` 环境变量设置。
* **`retry`** (<code><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">RetryPolicy</a> | None</code>，默认：`None` ) –

  控制重试行为的 `RetryPolicy`；可用选项及各自默认值见 `RetryPolicy`。传入 `RetryPolicy(max_retries=0)` 可禁用重试。
* **`timeout`** (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a> | httpx2.Timeout | None</code>，默认：`None` ) –

  HTTP 操作的超时。提供了 `http_client.timeout` 时继承它，否则采用 SDK 默认值。
* **`headers`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>] | None</code>，默认：`None` ) –

  要额外设置的请求头。
* **`transport`** (`httpx2.BaseTransport | None`，默认：`None` ) –

  可选的定制 HTTP 传输层，本 SDK 客户端关闭时会一并关闭。
* **`http_client`** (<code>httpx2.<a href="https://pydantic.dev/docs/httpx2/api/api/#httpx2.Client">Client</a> | None</code>，默认：`None` ) –

  可选的 `httpx2.Client`；与 `transport` 互斥。本 SDK 客户端关闭时会一并关闭。
* **`base_url`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>，默认：`None` ) –

  API 基础 URL；也可以通过 `TYPESAFE_BASE_URL` 环境变量设置。

抛出：

* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError">TypeSafeError</a></code> –

  API 密钥缺失或无效，或者超时无效。
* <code><a href="https://docs.python.org/3/builtins/exceptions.html#ValueError">ValueError</a></code> –

  同时传入了 `transport` 和 `http_client`。

示例：

```python theme={null}
from typesafe_sdk import Choice, Noul, TypeSafeClient

with TypeSafeClient() as client:
    result = client.system_one(
        state="I was charged twice. Please help.",
        questions={
            "billing": Noul(instructions="Is this about billing?"),
            "tone": Choice(
                instructions="What is the tone?",
                criteria={"calm": None, "angry": None},
            ),
        },
    )
    assert 0 <= result.nouls["billing"].noul <= 1
    assert result.choices["tone"].choice in {"calm", "angry"}
```

<h3 id="typesafe_sdk.TypeSafeClient.models">
  models
</h3>

`cached` `property`

<SdkSignature>
  <span className="n">
    {"models"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/clients/sync#typesafe_sdk.Models">
      {"Models"}
    </a>
  </span>

  {"\n"}
</SdkSignature>

Models API 资源的访问器。

示例：

```python theme={null}
with TypeSafeClient() as client:
    models = client.models.list()
```

<h3 id="typesafe_sdk.TypeSafeClient.system_one">
  system\_one
</h3>

<Tabs>
  <Tab title="实现">
    <SdkSignature>
      <span className="nf">{"system_one"}</span><span className="p">{"("}</span>{"\n"}{"    "}<span className="n">{"state"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">{"JSONContent"}</a></span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"questions"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.Question">{"Question"}</a></span><span className="p">{"],"}</span>{"\n"}{"    "}<span className="o">{"*"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"model"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"retry"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">{"RetryPolicy"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"timeout"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/functions.html#float">{"float"}</a></span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="n">{"httpx2"}</span><span className="o">{"."}</span><span className="n">{"Timeout"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"extra_headers"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{"]"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"extra_body"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="/sdk/python/api/types/common#typesafe_sdk.JSONValue">{"JSONValue"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span><span className="p">{"]"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"response_model"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/functions.html#type">{"type"}</a></span><span className="p">{"["}</span><span className="n">{"ResponseT"}</span><span className="p">{"]"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}<span className="p">{")"}</span>{" "}<span className="o">{"->"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse">{"SystemOneResponse"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="n">{"ResponseT"}</span>{"\n"}
    </SdkSignature>
  </Tab>

  <Tab title="重载 1">
    <SdkSignature>
      <span className="nf">{"system_one"}</span><span className="p">{"("}</span>{"\n"}{"    "}<span className="n">{"state"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">{"JSONContent"}</a></span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"questions"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.Question">{"Question"}</a></span><span className="p">{"],"}</span>{"\n"}{"    "}<span className="o">{"*"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"model"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"retry"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">{"RetryPolicy"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"timeout"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/functions.html#float">{"float"}</a></span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="n">{"httpx2"}</span><span className="o">{"."}</span><span className="n">{"Timeout"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"extra_headers"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{"]"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"extra_body"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="/sdk/python/api/types/common#typesafe_sdk.JSONValue">{"JSONValue"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span><span className="p">{"]"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"response_model"}</span><span className="p">{":"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}<span className="p">{")"}</span>{" "}<span className="o">{"->"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse">{"SystemOneResponse"}</a></span>{"\n"}
    </SdkSignature>
  </Tab>

  <Tab title="重载 2">
    <SdkSignature>
      <span className="nf">{"system_one"}</span><span className="p">{"("}</span>{"\n"}{"    "}<span className="n">{"state"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">{"JSONContent"}</a></span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"questions"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.Question">{"Question"}</a></span><span className="p">{"],"}</span>{"\n"}{"    "}<span className="o">{"*"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"model"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"retry"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">{"RetryPolicy"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"timeout"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/functions.html#float">{"float"}</a></span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="n">{"httpx2"}</span><span className="o">{"."}</span><span className="n">{"Timeout"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"extra_headers"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{"]"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"extra_body"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="/sdk/python/api/types/common#typesafe_sdk.JSONValue">{"JSONValue"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span><span className="p">{"]"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"response_model"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/functions.html#type">{"type"}</a></span><span className="p">{"["}</span><span className="n">{"ResponseT"}</span><span className="p">{"],"}</span>{"\n"}<span className="p">{")"}</span>{" "}<span className="o">{"->"}</span>{" "}<span className="n">{"ResponseT"}</span>{"\n"}
    </SdkSignature>
  </Tab>
</Tabs>

回答关于文本或结构化状态的具名问题。

详见 [System One](https://docs.typesafe.ai/concepts/system-one)。

参数：

* **`state`** (<code><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a></code>) –

  要评估的文本、JSON 对象或数组。详见[状态](https://docs.typesafe.ai/concepts/state)。
* **`questions`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/questions#typesafe_sdk.Question">Question</a>]</code>) –

  从名称到问题对象或原始字典的非空映射。
* **`model`** (<code><a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a> | None</code>，默认：`None` ) –

  模型覆盖；`None` 表示沿用客户端的默认值。
* **`retry`** (<code><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">RetryPolicy</a> | None</code>，默认：`None` ) –

  可选的重试策略，仅覆盖本次调用的客户端级配置。
* **`timeout`** (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a> | httpx2.Timeout | None</code>，默认：`None` ) –

  可选的 HTTP 操作超时，仅覆盖本次调用的客户端级配置，单位为秒。
* **`extra_headers`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>] | None</code>，默认：`None` ) –

  要额外设置的请求头。
* **`extra_body`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/common#typesafe_sdk.JSONValue">JSONValue</a> | None] | None</code>，默认：`None` ) –

  额外的顶层请求体字段，在设置好 `state`、`model` 和 `questions` 之后浅合并到请求体上。合并采用后写覆盖：与 `state`、`model` 或 `questions` 冲突的键会覆盖它们，对象值整体替换而非深合并。
* **`response_model`** (<code><a href="https://docs.python.org/3/builtins/functions.html#type">type</a>\[ResponseT] | None</code>，默认：`None` ) –

  可选的 Pydantic `BaseModel` 类型，用于描述 JSON 响应体，其中包括任何嵌套的答案模型。

返回值：

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse">SystemOneResponse</a> | ResponseT</code> –

  `response_model` 的实例；未提供自定义模型时，则是以问题名称为键的 `SystemOneResponse`，
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.SystemOneResponse">SystemOneResponse</a> | ResponseT</code> –

  以及模型和 token 用量详情。

抛出：

* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeError">TypeSafeError</a></code> –

  问题为空，或某个 Score 问题的判据列表为空。
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code> –

  重试之后服务端仍返回不成功的 HTTP 响应。
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIConnectionError">TypeSafeAPIConnectionError</a></code> –

  重试之后请求仍无法连接或超时。
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIResponseValidationError">TypeSafeAPIResponseValidationError</a></code> –

  响应体与响应模型不匹配。

示例：

用命名参数创建问题：

```python theme={null}
with TypeSafeClient() as client:
    result = client.system_one(
        state="I was charged twice. Please help.",
        questions={
            "billing": Noul(instructions="Is this about billing?"),
            "tone": Choice(
                instructions="What is the tone?",
                criteria={"calm": None, "angry": None},
            ),
        },
    )
    assert 0 <= result.nouls["billing"].noul <= 1
    assert result.choices["tone"].choice in {"calm", "angry"}
```

以字典形式传入问题：

```python theme={null}
with TypeSafeClient() as client:
    result = client.system_one(
        state={"message": "I was charged twice. Please help."},
        questions={
            "billing": {"type": "noul", "instructions": "Is this about billing?"},
            "tone": {
                "type": "choice",
                "instructions": "What is the tone?",
                "criteria": {"calm": None, "angry": None},
            },
        },
    )
    assert 0 <= result.nouls["billing"].noul <= 1
    assert result.choices["tone"].choice in {"calm", "angry"}
```

<h3 id="typesafe_sdk.TypeSafeClient.close">
  close
</h3>

```python theme={null}
close() -> None
```

释放网络资源并关闭底层的 HTTP 客户端，包括外部传入的那个。

<h2 id="models-resource">
  Models 资源
</h2>

通过 [`TypeSafeClient.models`](/sdk/python/api/clients/sync#typesafe_sdk.TypeSafeClient.models) 访问。

<h3 id="typesafe_sdk.Models">
  typesafe\_sdk.Models
</h3>

用于访问账号可用的模型，入口是 `TypeSafeClient.models`。

<h4 id="typesafe_sdk.Models.list">
  list
</h4>

<SdkSignature>
  <span className="nf">{"list"}</span><span className="p">{"("}</span>{"\n"}{"    "}<span className="o">{"*"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"retry"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">{"RetryPolicy"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"timeout"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/functions.html#float">{"float"}</a></span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="n">{"httpx2"}</span><span className="o">{"."}</span><span className="n">{"Timeout"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}{"    "}<span className="n">{"extra_headers"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">{"Mapping"}</a></span><span className="p">{"["}</span><span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{","}</span>{" "}<span className="n"><a href="https://docs.python.org/3/builtins/stdtypes.html#str">{"str"}</a></span><span className="p">{"]"}</span>{"\n"}{"    "}<span className="o">{"|"}</span>{" "}<span className="kc">{"None"}</span>{" "}<span className="o">{"="}</span>{" "}<span className="kc">{"None"}</span><span className="p">{","}</span>{"\n"}<span className="p">{")"}</span>{" "}<span className="o">{"->"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/responses#typesafe_sdk.ListModelsResponse">{"ListModelsResponse"}</a></span>{"\n"}
</SdkSignature>

列出账号可用的模型。

参数：

* **`retry`** (<code><a href="/sdk/python/api/retries#typesafe_sdk.RetryPolicy">RetryPolicy</a> | None</code>，默认：`None` ) –

  可选的重试策略，仅覆盖本次调用的客户端级配置。
* **`timeout`** (<code><a href="https://docs.python.org/3/builtins/functions.html#float">float</a> | httpx2.Timeout | None</code>，默认：`None` ) –

  单次操作的超时覆盖；`None` 表示沿用客户端设置。
* **`extra_headers`** (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>] | None</code>，默认：`None` ) –

  对额外请求头的覆盖；认证、SDK 标识和 `Accept` 仍受保护。

返回值：

* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ListModelsResponse">ListModelsResponse</a></code> –

  `ListModelsResponse`，其 `models` 中保存了每个模型的名称、描述，
* <code><a href="/sdk/python/api/types/responses#typesafe_sdk.ListModelsResponse">ListModelsResponse</a></code> –

  以及发布日期。

抛出：

* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIError">TypeSafeAPIError</a></code> –

  重试之后服务端仍返回不成功的 HTTP 响应。
* <code><a href="/sdk/python/api/exceptions#typesafe_sdk.TypeSafeAPIConnectionError">TypeSafeAPIConnectionError</a></code> –

  重试之后请求仍无法连接或超时。

示例：

```python theme={null}
from typesafe_sdk import TypeSafeClient

with TypeSafeClient() as client:
    models = client.models.list()
```
