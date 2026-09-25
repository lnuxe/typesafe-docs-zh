# 类：APIPromise\<T\>

一个承载解析结果的 promise，同时可以访问 HTTP 响应。

非 2xx 响应会让 promise 以 `APIError` 被拒绝，经由 `asResponse()` 时同样如此。

## 继承

* `Promise`\<`T`>

## 类型参数

### T

`T`

## 构造函数

<a id="sdk-constructor" />

### 构造函数

```ts theme={null}
new APIPromise<T>(responsePromise, parseResponse): APIPromise<T>;
```

#### 参数

##### responsePromise

`Promise`\<`Response`>

##### parseResponse

(`response`) => `Promise`\<`T`>

#### 返回值

`APIPromise`\<`T`>

#### 覆盖

```ts theme={null}
Promise<T>.constructor
```

## 方法

<a id="sdk-asresponse" />

### asResponse()

```ts theme={null}
asResponse(): Promise<Response>;
```

解析为原始的 `Response`，不解析响应体。SDK 的请求会在移交之前，
在请求超时之内完整缓冲响应体；之后再读取由调用方负责。
响应体归调用方所有；不要在同一个 promise 上同时 `await` 解析后的结果。

#### 返回值

`Promise`\<`Response`>

***

<a id="sdk-catch" />

### catch()

```ts theme={null}
catch<TResult>(onrejected?): Promise<T | TResult>;
```

只针对 Promise 被拒绝的情形附加一个回调。

#### 类型参数

##### TResult

`TResult` = `never`

#### 参数

##### onrejected?

((`reason`) => `TResult` | `PromiseLike`\<`TResult`>) | `null`

Promise 被拒绝时执行的回调。

#### 返回值

`Promise`\<`T` | `TResult`>

一个在回调完成时兑现的 Promise。

#### 覆盖

```ts theme={null}
Promise.catch
```

***

<a id="sdk-finally" />

### finally()

```ts theme={null}
finally(onfinally?): Promise<T>;
```

附加一个在 Promise 敲定（settled，即兑现或拒绝）时调用的回调。
已解析的值无法从回调中修改。

#### 参数

##### onfinally?

(() => `void`) | `null`

Promise 敲定（兑现或拒绝）时执行的回调。

#### 返回值

`Promise`\<`T`>

一个在回调完成时兑现的 Promise。

#### 覆盖

```ts theme={null}
Promise.finally
```

***

<a id="sdk-map" />

### map()

```ts theme={null}
map<U>(fn): APIPromise<U>;
```

转换解析后的结果，共用同一个 HTTP 响应，且只解析一次响应体。

#### 类型参数

##### U

`U`

#### 参数

##### fn

(`data`) => `U`

#### 返回值

`APIPromise`\<`U`>

***

<a id="sdk-then" />

### then()

```ts theme={null}
then<TResult1, TResult2>(onfulfilled?, onrejected?): Promise<TResult1 | TResult2>;
```

为 Promise 的兑现和/或拒绝附加回调。

#### 类型参数

##### TResult1

`TResult1` = `T`

##### TResult2

`TResult2` = `never`

#### 参数

##### onfulfilled?

((`value`) => `TResult1` | `PromiseLike`\<`TResult1`>) | `null`

Promise 被兑现时执行的回调。

##### onrejected?

((`reason`) => `TResult2` | `PromiseLike`\<`TResult2`>) | `null`

Promise 被拒绝时执行的回调。

#### 返回值

`Promise`\<`TResult1` | `TResult2`>

一个在任一被执行的回调完成时兑现的 Promise。

#### 覆盖

```ts theme={null}
Promise.then
```

***

<a id="sdk-withresponse" />

### withResponse()

```ts theme={null}
withResponse(): Promise<WithResponse<T>>;
```

返回解析后的结果、HTTP 响应和请求 ID。

#### 返回值

`Promise`\<[`WithResponse`](/sdk/javascript/api/interfaces/WithResponse)\<`T`>>
