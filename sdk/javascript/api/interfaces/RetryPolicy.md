# 接口：RetryPolicy

重试配置。部分覆盖时，未设置的字段沿用客户端或 SDK 的默认值。

## 属性

<a id="sdk-apiconnectionerror" />

### apiConnectionError

```ts theme={null}
readonly apiConnectionError: boolean;
```

重试连接失败，包括响应体被中断的情况（`APIConnectionError`）。默认：true。

***

<a id="sdk-apitimeouterror" />

### apiTimeoutError

```ts theme={null}
readonly apiTimeoutError: boolean;
```

是否重试 `APITimeoutError`。默认：true。

***

<a id="sdk-backoffinitialms" />

### backoffInitialMs

```ts theme={null}
readonly backoffInitialMs: number;
```

首次退避延迟，单位为毫秒，逐次翻倍直至 `backoffMaxMs`。默认：500。

***

<a id="sdk-backoffjitter" />

### backoffJitter

```ts theme={null}
readonly backoffJitter: number;
```

每次退避延迟中被随机减去的比例，取值从 0 到 1。默认：0.25。

***

<a id="sdk-backoffmaxms" />

### backoffMaxMs

```ts theme={null}
readonly backoffMaxMs: number;
```

最大退避延迟，单位为毫秒。默认：5000。

***

<a id="sdk-httpstatuses" />

### httpStatuses

```ts theme={null}
readonly httpStatuses: ReadonlySet<number>;
```

需要重试的 HTTP 状态码。默认：408、429 与 500–599。

***

<a id="sdk-maxretries" />

### maxRetries

```ts theme={null}
readonly maxRetries: number;
```

初次尝试之后的最大重试次数；`0` 表示禁用重试。默认：2。

***

<a id="sdk-maxretryafterms" />

### maxRetryAfterMs

```ts theme={null}
readonly maxRetryAfterMs: number;
```

服务端重试延迟的上限，单位为毫秒；更长的延迟改用退避。默认：60000。

***

<a id="sdk-respectretryafter" />

### respectRetryAfter

```ts theme={null}
readonly respectRetryAfter: boolean;
```

遵循 `Retry-After` 与 `retry-after-ms`，上限为 `maxRetryAfterMs`。默认：true。
