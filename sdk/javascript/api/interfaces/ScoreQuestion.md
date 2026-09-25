# 接口：ScoreQuestion\<T\>

按有序量规给出分数的问题。

## 类型参数

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria) = [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)

## 属性

<a id="sdk-criteria" />

### criteria

```ts theme={null}
criteria: T;
```

对各个可能结果的描述。

***

<a id="sdk-instructions" />

### instructions?

```ts theme={null}
optional instructions?: EntryType;
```

问题本身，可以是文本、JSON 对象或数组；可选，也可以为 `null`。

***

<a id="sdk-type" />

### type

```ts theme={null}
type: "score";
```
