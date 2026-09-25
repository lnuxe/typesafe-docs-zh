# 类：APITimeoutError

超时时间内没有收到完整响应。是 `APIConnectionError` 的一种。

## 继承

* [`APIConnectionError`](/sdk/javascript/api/classes/APIConnectionError)

## 构造函数

<a id="sdk-constructor" />

### 构造函数

```ts theme={null}
new APITimeoutError(timeoutMs, options?): APITimeoutError;
```

#### 参数

##### timeoutMs

`number`

##### options?

`ErrorOptions`

#### 返回值

`APITimeoutError`

#### 覆盖

[`APIConnectionError`](/sdk/javascript/api/classes/APIConnectionError).[`constructor`](/sdk/javascript/api/classes/APIConnectionError#sdk-constructor)

## 属性

<a id="sdk-timeoutms" />

### timeoutMs

```ts theme={null}
readonly timeoutMs: number;
```

配置的超时时间，单位毫秒。
