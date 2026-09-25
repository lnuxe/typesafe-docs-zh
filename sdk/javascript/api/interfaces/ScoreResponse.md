# 接口：ScoreResponse\<T\>

带有量规与概率分布的期望分数。

## 类型参数

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria) = [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)

## 属性

<a id="sdk-confidence" />

### confidence

```ts theme={null}
readonly confidence: number;
```

对分数给出的置信度。

***

<a id="sdk-legend" />

### legend

```ts theme={null}
readonly legend: ScoreLegend<T>;
```

以分数为键的量规描述。

***

<a id="sdk-probabilities" />

### probabilities

```ts theme={null}
readonly probabilities: { readonly [score in number | `${number}`]: number };
```

以分数为键的概率分布。

***

<a id="sdk-score" />

### score

```ts theme={null}
readonly score: number;
```

期望分数，可能落在量规的整数档位之间。

***

<a id="sdk-type" />

### type

```ts theme={null}
readonly type: "score";
```
