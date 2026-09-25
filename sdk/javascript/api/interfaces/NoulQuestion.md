# 接口：NoulQuestion

一个是/否问题，可为任一结果附带描述。

## 属性

<a id="sdk-criteria" />

### criteria?

```ts theme={null}
optional criteria?: 
  | {
  false?: EntryType;
  true?: EntryType;
}
  | null;
```

对「是」与「否」两种结果的可选描述。

#### 联合成员

##### 类型字面量

```ts theme={null}
{
  false?: EntryType;
  true?: EntryType;
}
```

##### false?

```ts theme={null}
optional false?: EntryType;
```

对「否」这一结果的描述。

##### true?

```ts theme={null}
optional true?: EntryType;
```

对「是」这一结果的描述。

***

`null`

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
type: "noul";
```
