# 接口：Models

对 Models API 资源的访问入口。

## 方法

<a id="sdk-list" />

### list()

```ts theme={null}
list(options?): APIPromise<ModelCard[]>;
```

列出账户可用的模型。

#### 参数

##### options?

[`RequestOptions`](/sdk/javascript/api/interfaces/RequestOptions) = `{}`

#### 返回值

[`APIPromise`](/sdk/javascript/api/classes/APIPromise)\<[`ModelCard`](/sdk/javascript/api/interfaces/ModelCard)\[]>
