# 接口：Logger

接收消息与结构化值的一组日志方法；与 `console` 兼容。可在 [TypeSafeClientConfig](/sdk/javascript/api/interfaces/TypeSafeClientConfig) 中注入自定义实现，SDK 内部会用它输出请求日志。


## 方法

<a id="sdk-debug" />

### debug()

```ts theme={null}
debug(message, ...args): void;
```

#### 参数

##### message

`string`

##### args

...`unknown`\[]

#### 返回值

`void`

***

<a id="sdk-error" />

### error()

```ts theme={null}
error(message, ...args): void;
```

#### 参数

##### message

`string`

##### args

...`unknown`\[]

#### 返回值

`void`

***

<a id="sdk-info" />

### info()

```ts theme={null}
info(message, ...args): void;
```

#### 参数

##### message

`string`

##### args

...`unknown`\[]

#### 返回值

`void`

***

<a id="sdk-warn" />

### warn()

```ts theme={null}
warn(message, ...args): void;
```

#### 参数

##### message

`string`

##### args

...`unknown`\[]

#### 返回值

`void`
