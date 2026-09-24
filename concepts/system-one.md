# System One

> System One 模型为软件做出快速、结构化的决策。Jev 是 TypeSafe 的旗舰模型，也是第一个 System One 模型。

System One 模型是一类专为软件直接使用的快速、结构化决策而构建的 AI 模型。System One 模型评估一个[状态](/concepts/state)，并返回类型化的答案和概率。

Jev 是 TypeSafe 的旗舰模型，也是第一个 System One 模型。

与 LLM 一样，System One 模型理解自然语言输入。但它返回的是类型化的决策和概率，而不是生成的文本。

<Note>
  Jev 目前仅接受文本输入。它可以评估字符串、JSON 对象和文本数组。暂不支持图像、音频和视频。
</Note>

## 与 LLM 的区别

System One 模型为校准决策（calibrated decisions）而训练：其概率针对真实结果做了优化，以反映不确定性。校准是在预测群体层面衡量的；它不保证单个答案是正确的。

System One 模型不撰写回复、不生成代码、也不对自己的推理过程做出解释。你通过[原语](/primitives)定义可能的答案：

| 原语                          | 问题                              | 示例答案空间                              | 示例输出            |
| ----------------------------- | --------------------------------- | ---------------------------------------- | ------------------- |
| [Choice](/primitives/choice) | 这个工单应该由哪个团队处理？          | `billing`、`technical` 或 `account`       | `choice: "billing"` |
| [Score](/primitives/score)   | 这位客户有多沮丧？                  | 0 = 平静，1 = 沮丧，2 = 非常沮丧           | `score: 1.4`        |
| [Noul](/primitives/noul)     | 这条消息是否请求退款？               | 真或假                                    | `noul: 0.95`        |

以上仅为示例配置和值。各原语页面描述了可用的配置选项和完整的响应字段。

阅读 [AI 入门](/introduction/machine-learning-primer)了解 System One 模型的工作原理和训练方式。

<Note>
  System One 这个名字来自 Daniel Kahneman 在其著作《思考，快与慢》中普及的概念。系统 1 思维快速而直觉。系统 2 则更慢、更审慎。这里强调的是快速、聚焦的判断。
</Note>

## 更大工作流中的快速判断

以一个退款请求为例，你的应用可以：

1. 构建一个包含客户消息、相关交易记录和退款政策的状态。
2. 一起提问相互独立的问题：是否请求了退款、证据是否表明存在重复扣款、政策是否支持退款。
3. 在代码中将答案与确定性检查相结合，然后将该案件路由到执行或审核。

看到原语的实际效果后，你就可以把它们组合成更大的系统。因为 System One 模型返回的是类型化、受约束的输出而非自由文本，你的代码可以检查并将其答案组合成可预测的工作流。完整工作流见[如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)。

System One 模型的答案还包含[置信度](/confidence)，因此你可以决定何时采取行动、何时升级到人工或推理模型。

## 调用 System One 模型

通过我们的[客户端 SDK](/sdk) 或 [HTTP API](/api) 中的 `POST /v1/systemone` 调用 System One 模型。`model` 字段选择处理请求的模型。本文档中的示例使用 `jev-latest`，这也是 SDK 的默认值。可用模型、价格及别名见[模型](/models)。

从[状态](/concepts/state)开始准备输入，并通过[原语（问题）](/primitives)探索可以提问的问题类型。
