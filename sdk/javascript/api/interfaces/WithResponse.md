# 接口：WithResponse\<T\>

解析后的数据，连同它的 HTTP 响应与请求 ID。

## 类型参数

### T

`T`

## 属性

<a id="sdk-data" />

### data

```ts theme={null}
data: T;
```

解析后的响应体。

***

<a id="sdk-requestid" />

### requestId

```ts theme={null}
requestId: string | undefined;
```

来自 `x-typesafe-request-id` 的请求 ID；不存在时为 `undefined`。

***

<a id="sdk-response" />

### response

```ts theme={null}
response: Response;
```

HTTP 响应，其响应体已被解析过程消费。
