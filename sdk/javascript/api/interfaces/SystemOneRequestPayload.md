# 接口：SystemOneRequestPayload

`POST /v1/systemone` 的请求体，其中模型已解析完成。

## 继承

* [`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest)

## 属性

<a id="sdk-model" />

### model

```ts theme={null}
model: string;
```

模型覆盖项；未提供的值沿用 `defaultModel`。

#### 覆盖

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest).[`model`](/sdk/javascript/api/interfaces/SystemOneRequest#sdk-model)

***

<a id="sdk-questions" />

### questions

```ts theme={null}
questions: Questions;
```

非空的问题集合，以用于标识其答案的名称为键。

#### 继承自

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest).[`questions`](/sdk/javascript/api/interfaces/SystemOneRequest#sdk-questions)

***

<a id="sdk-state" />

### state

```ts theme={null}
state: EntryType;
```

待评估的文本、JSON 对象或数组，也可以为 `null`。

#### 继承自

[`SystemOneRequest`](/sdk/javascript/api/interfaces/SystemOneRequest).[`state`](/sdk/javascript/api/interfaces/SystemOneRequest#sdk-state)
