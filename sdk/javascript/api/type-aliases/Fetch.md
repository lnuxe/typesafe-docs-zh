# 类型别名：Fetch

```ts theme={null}
type Fetch = (input, init?) => Promise<Response>;
```

与全局 `fetch` 兼容的 HTTP fetch 实现。用于在 [TypeSafeClientConfig](/sdk/javascript/api/interfaces/TypeSafeClientConfig) 中注入自定义 fetch（例如测试桩、代理或带重试的实现）。


## 参数

### input

`string`

### init?

`RequestInit`

## 返回值

`Promise`\<`Response`>
