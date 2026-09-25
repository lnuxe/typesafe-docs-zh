# 函数：noul()

```ts theme={null}
function noul(instructions?, criteria?): NoulQuestion;
```

创建一个是/否问题，可为两种结果分别提供可选描述。

## 参数

### instructions?

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType) = `null`

以文本、JSON 对象或数组形式给出的问题；默认为 `null`。

### criteria?

\| \{
`false?`: [`EntryType`](/sdk/javascript/api/type-aliases/EntryType);
`true?`: [`EntryType`](/sdk/javascript/api/type-aliases/EntryType);
}
\| `null`

对「是」和「否」两种结果的可选描述。

#### 类型字面量

\{
`false?`: [`EntryType`](/sdk/javascript/api/type-aliases/EntryType);
`true?`: [`EntryType`](/sdk/javascript/api/type-aliases/EntryType);
}

对「是」和「否」两种结果的可选描述。

##### false?

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType)

「否」结果的描述。

##### true?

[`EntryType`](/sdk/javascript/api/type-aliases/EntryType)

「是」结果的描述。

***

`null`

## 返回值

[`NoulQuestion`](/sdk/javascript/api/interfaces/NoulQuestion)
