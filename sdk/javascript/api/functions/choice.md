# 函数：choice()

```ts theme={null}
function choice<T>(instructions, criteria): ChoiceQuestion<T>;
```

创建一个在具名选项之间做选择的问题。

## 类型参数

### T

`T` *extends* [`ChoiceCriteria`](/sdk/javascript/api/type-aliases/ChoiceCriteria)

## 参数

### instructions

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType)

以文本、JSON 对象或数组形式给出的问题，也可以为 `null`。

### criteria

`T`

标签到描述的映射；未提供描述的标签用 `null`。

## 返回值

[`ChoiceQuestion`](/sdk/javascript/api/interfaces/ChoiceQuestion)\<`T`>
