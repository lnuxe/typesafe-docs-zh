# 类：TypeSafeClient

TypeSafe AI API 的客户端。

## 构造函数

<a id="sdk-constructor" />

### 构造函数

```ts theme={null}
new TypeSafeClient(config?): TypeSafeClient;
```

创建 TypeSafe AI API 的客户端。

显式传入的选项优先于环境变量，环境变量优先于 SDK 默认值。
空值或只含空白字符的环境变量会被忽略。

#### 参数

##### config?

[`TypeSafeClientConfig`](/sdk/javascript/api/interfaces/TypeSafeClientConfig) = `{}`

#### 返回值

`TypeSafeClient`

#### 抛出

API 密钥缺失、配置无效，或运行环境不受支持。

## 属性

<a id="sdk-baseurl" />

### baseURL

```ts theme={null}
readonly baseURL: string;
```

移除末尾斜杠后的 API 基础 URL。

***

<a id="sdk-defaultheaders" />

### defaultHeaders

```ts theme={null}
readonly defaultHeaders: Readonly<Record<string, string>>;
```

随每个请求发送的额外请求头。

***

<a id="sdk-defaultmodel" />

### defaultModel

```ts theme={null}
readonly defaultModel: string;
```

请求省略 `model` 时使用的模型。

***

<a id="sdk-fetch" />

### fetch

```ts theme={null}
readonly fetch: Fetch;
```

HTTP fetch 实现。

***

<a id="sdk-logger" />

### logger

```ts theme={null}
readonly logger: Logger;
```

已配置的日志器，按 `logLevel` 过滤。

***

<a id="sdk-loglevel" />

### logLevel

```ts theme={null}
readonly logLevel: LogLevel;
```

已配置的日志详细程度。

***

<a id="sdk-models" />

### models

```ts theme={null}
readonly models: Models;
```

该账户可用的模型。

***

<a id="sdk-retry" />

### retry

```ts theme={null}
readonly retry: RetryPolicy;
```

已应用构造函数覆盖项的重试设置。

***

<a id="sdk-timeout" />

### timeout

```ts theme={null}
readonly timeout: number;
```

每次尝试的超时时间，单位为毫秒。

## 方法

<a id="sdk-systemone" />

### systemOne()

```ts theme={null}
systemOne<Q>(request, options?): APIPromise<SystemOneResult<Q>>;
```

对文本或结构化状态回答具名问题。

#### 类型参数

##### Q

`Q` *extends* [`Questions`](/sdk/javascript/api/interfaces/Questions)

#### 参数

##### request

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest)\<`Q`>

状态、问题，以及可选的模型覆盖项。

##### options?

[`RequestOptions`](/sdk/javascript/api/interfaces/RequestOptions) = `{}`

单次调用的超时、重试、请求头与取消设置。

#### 返回值

[`APIPromise`](/sdk/javascript/api/classes/APIPromise)\<[`SystemOneResult`](/sdk/javascript/api/interfaces/SystemOneResult)\<`Q`>>

按问题名与判据类型化的答案，附带模型与 token 用量。

#### 抛出

问题为空，或 Score 的判据不是至少包含两项的列表。

#### 抛出

重试之后服务器仍返回非 2xx 响应。

#### 抛出

重试之后请求仍无法连接或超时。

#### 抛出

调用方中止了请求。

#### 示例

```ts theme={null}
const { answers } = await client.systemOne({
  state: "I was charged twice. Please help.",
  questions: { billing: noul("Is this about billing?") },
});
console.log(answers.billing.noul);
```
