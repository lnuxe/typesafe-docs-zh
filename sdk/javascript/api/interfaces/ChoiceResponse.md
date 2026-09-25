# 接口：ChoiceResponse\<T\>

选中的标签及其概率分布。

## 类型参数

### T

`T` *extends* [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria) = [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria)

## 属性

<a id="sdk-choice" />

### choice

```ts theme={null}
readonly choice: keyof T & string;
```

选中的标签。

***

<a id="sdk-confidence" />

### confidence

```ts theme={null}
readonly confidence: number;
```

对所选标签给出的置信度。

***

<a id="sdk-probabilities" />

### probabilities

```ts theme={null}
readonly probabilities: { readonly [label in string | number | symbol]: number };
```

以标签为键的概率分布。

***

<a id="sdk-type" />

### type

```ts theme={null}
readonly type: "choice";
```
