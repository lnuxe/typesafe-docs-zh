# 类型别名：EntryType

```ts theme={null}
type EntryType = 
  | string
  | {
[key: string]: JsonValue;
}
  | JsonValue[]
  | null;
```

文本、JSON 对象或数组；state、instructions 和 criteria 用 `null`。
