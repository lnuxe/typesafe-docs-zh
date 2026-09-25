# 接口：TypeSafeClientConfig

客户端选项。显式取值优先于环境变量，其次才是 SDK 默认值。

## 属性

<a id="sdk-apikey" />

### apiKey?

```ts theme={null}
optional apiKey?: string;
```

必需的 API 密钥；未提供时回退到 `TYPESAFE_API_KEY`。

***

<a id="sdk-baseurl" />

### baseURL?

```ts theme={null}
optional baseURL?: string;
```

API 基础 URL；未提供时回退到 `TYPESAFE_BASE_URL`，再回退到 `https://api.typesafe.ai`。

***

<a id="sdk-dangerouslyallowbrowser" />

### dangerouslyAllowBrowser?

```ts theme={null}
optional dangerouslyAllowBrowser?: boolean;
```

允许在浏览器中使用，这会把 API 密钥暴露给页面使用者。默认：false。

***

<a id="sdk-defaultheaders" />

### defaultHeaders?

```ts theme={null}
optional defaultHeaders?: Record<string, string>;
```

额外的请求头；逐次调用的请求头优先。

***

<a id="sdk-defaultmodel" />

### defaultModel?

```ts theme={null}
optional defaultModel?: string;
```

默认模型；未提供时回退到 `TYPESAFE_DEFAULT_MODEL`，再回退到 `jev-latest`。

***

<a id="sdk-fetch" />

### fetch?

```ts theme={null}
optional fetch?: Fetch;
```

自定义 HTTP fetch 实现，用于配置传输层或编写测试。默认：全局 `fetch`。

***

<a id="sdk-logger" />

### logger?

```ts theme={null}
optional logger?: Logger;
```

经过 `logLevel` 及以上级别过滤的日志器。默认：带前缀的 `console`。

***

<a id="sdk-loglevel" />

### logLevel?

```ts theme={null}
optional logLevel?: LogLevel;
```

日志级别；未提供时回退到 `TYPESAFE_LOG_LEVEL`，再回退到 `warn`。
`info` 会记录请求摘要；`debug` 额外记录请求头与请求体／响应体。
已知的凭据请求头会被脱敏；请求体与响应体不会。

***

<a id="sdk-retry" />

### retry?

```ts theme={null}
optional retry?: Partial<RetryPolicy>;
```

重试覆盖项；未提供的字段使用 `RetryPolicy` 中的默认值。

***

<a id="sdk-timeout" />

### timeout?

```ts theme={null}
optional timeout?: number;
```

每次尝试的超时时间，单位为毫秒，没有总的重试预算。默认：10000。
