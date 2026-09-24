# 状态（State）

> 什么是状态、如何组织它，以及如何为 System One 模型提供所需的上下文。

**状态（State）** 是你要求 System One 模型评估的内容。它可以是一条客服消息、一段文本，或是你应用的当前状态。你通过 API 请求的 `state` 字段传入它，同时附上你想得到答案的问题。

每次请求针对一个状态评估一个或多个问题。所有问题看到的是同一个状态，且相互独立评估。你可以在一次请求中混用 [Choice](/primitives/choice)、[Score](/primitives/score) 和 [Noul](/primitives/noul) 问题。

## 状态可以是简单字符串或结构化 JSON 值

最简单的状态是一个纯字符串：

```python theme={null}
state = "My card was charged twice."
```

状态也可以是包含相关上下文、示例及其他有助于模型回答问题的信息的 JSON 对象或数组。可以把状态想象成你请一组专家做出判断之前呈现给他们的材料。在 Python 中，直接把对应的字符串、字典或列表传给 `client.system_one(state=...)` 即可。

| 格式   | 适用场景                            | 示例                                                                    |
| ------ | ----------------------------------- | ----------------------------------------------------------------------- |
| 字符串 | 一条消息、一篇文章或一段文字         | `"My card was charged twice."`                                          |
| 对象   | 带命名字段、相关记录或应用状态        | `{"message": "My card was charged twice.", "order_id": "A-104"}`        |
| 数组   | 一连串消息或记录                     | `["Hi", "My customer number is TS1337.", "My card was charged twice."]` |

大多数请求应使用对象，这样状态的每个部分都有描述性名称，各部分之间的关系也保持清晰。当用例简单且只需要一段文本时，字符串即可。

<Note>
  Jev 仅接受文本。状态必须是字符串、JSON 对象或文本值数组。暂不支持图像、音频和视频。Jev 的主要训练语言是英语；其他语言（包括中日韩文字）可以接受，但目前准确率较低——参见[模型](/models#language-support)。
</Note>

```json title="以一段客服对话作为状态" theme={null}
{
  "ticket": {
    "subject": "Duplicate charge",
    "messages": [
      {"from": "customer", "text": "I was charged twice for order A-104. Please refund the duplicate."},
      {"from": "support", "text": "We are checking the charges."}
    ]
  },
  "order": {
    "id": "A-104",
    "charges": [
      {"amount_usd": 49, "status": "captured"},
      {"amount_usd": 49, "status": "captured"}
    ]
  },
  "refund_policy": "Duplicate charges are eligible for a refund."
}
```

这个对象是一个状态，尽管它包含一场对话、一个订单和一项政策。当决策需要比较这些部分时，就把相关信息放在一起。

## 内容与问题分离

状态包含内容和支撑事实。[问题](/primitives)定义模型应该对这些材料做出的判断。例如，把退款请求和政策放进状态，然后询问客户是否请求了退款、政策是否支持退款。

关于指令（instructions）、判据（criteria）、问题类型以及针对一个状态提问多个问题的指引，见[原语（问题）](/primitives)。请求模式见 [API 参考](/api)，安装、类型化输入和响应处理见[客户端 SDK](/sdk)。
