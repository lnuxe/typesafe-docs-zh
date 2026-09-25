# 接口：SystemOneRequest\<Q\>

供 `systemOne` 使用的状态与具名问题。

请求变量上的额外属性会被转发，`null` 值也不例外。

## 被继承

* [`SystemOneRequestPayload`](/sdk/javascript/api/interfaces/SystemOneRequestPayload)

## 类型参数

### Q

`Q` *extends* [`Questions`](/sdk/javascript/api/interfaces/Questions) = [`Questions`](/sdk/javascript/api/interfaces/Questions)

## 属性

<a id="sdk-model" />

### model?

```ts theme={null}
optional model?: string;
```

模型覆盖项；未提供的值沿用 `defaultModel`。

***

<a id="sdk-questions" />

### questions

```ts theme={null}
questions: Q;
```

非空的问题集合，以用于标识其答案的名称为键。

***

<a id="sdk-state" />

### state

```ts theme={null}
state: EntryType;
```

待评估的文本、JSON 对象或数组，也可以为 `null`。
