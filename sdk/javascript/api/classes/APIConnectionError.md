# 类：APIConnectionError

请求或响应体的传输失败（DNS、TLS、连接被关闭等）。

## 继承

* [`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError)

## 被继承

* [`APITimeoutError`](/sdk/javascript/api/classes/APITimeoutError)

## 构造函数

<a id="sdk-constructor" />

### 构造函数

```ts theme={null}
new APIConnectionError(message?, options?): APIConnectionError;
```

#### 参数

##### message?

`string` = `"Connection error."`

##### options?

`ErrorOptions`

#### 返回值

`APIConnectionError`

#### 覆盖

[`TypeSafeError`](/sdk/javascript/api/classes/TypeSafeError).[`constructor`](/sdk/javascript/api/classes/TypeSafeError#sdk-constructor)
