# 函数：score()

```ts theme={null}
function score<T>(instructions, criteria): ScoreQuestion<T>;
```

创建使用有序量规的评分问题。

## 类型参数

### T

`T` *extends* [`ScoreCriteria`](/sdk/javascript/api/type-aliases/ScoreCriteria)

## 参数

### instructions

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType)

以文本、JSON 对象或数组形式给出的问题，也可以为 `null`。

### criteria

`T`

至少两条描述，从 0 开始按分数索引；条目可以为 `null`。

## 返回值

[`ScoreQuestion`](/sdk/javascript/api/interfaces/ScoreQuestion)\<`T`>
