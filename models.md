# 模型

Jev 是 TypeSafe 的旗舰模型，也是第一个 [System One 模型](/concepts/system-one)。本页的每个模型都由同一个端点 `POST /v1/systemone` 提供服务。请求的 `model` 字段选择由哪个模型处理调用；完整请求形态见 [API 参考](/api)。

## 当前模型

| Jev 1.13                     | `jev-1.13.0`                                                                              |
| :--------------------------- | :---------------------------------------------------------------------------------------- |
| 价格（每 Btok / 每 Mtok）    | \$42 / \$0.042                                                                            |
| 速率限制                      | 每秒 250,000 token / 每分钟 1,200 次请求                                                   |
| 上下文长度                    | 每请求 64k token；`state` 加最长问题为 32k token                                           |
| 输入                          | 仅文本。字符串、JSON 对象或文本值数组。不支持图像、音频或视频输入。                          |

* **价格：** 按输入 token 计费。输出 token 免费。Btok 是十亿 token，Mtok 是一百万 token。
* **速率限制：** 以每秒 token 数和每分钟请求数计。超出任一限制的请求返回 `429 Too Many Requests`。我们的[客户端 SDK](/sdk) 默认带退避重试，并在响应携带 `retry-after` 头时遵循它。如果你直接调用 HTTP API，参见[处理速率限制](/api#handling-rate-limits)。
* **上下文长度：** Jev 一次性接收 `state`，并对其并行评估每个问题。64k 预算覆盖 `state` 加所有问题之和；32k 预算适用于 `state` 加单个最长问题。把大量问题打包进一次请求的做法见[推测性扇出](/patterns/fan-out)，状态增长时准确率的变化见 [Jev 1.13 已知缺陷](/model-jaggedness/jev-1.13)。
* **输入：** Jev 评估自然语言文本。发送前请把非文本输入（图像、音频、视频、二进制）预处理成文本或结构化字段再放入 `state`。支持的形态见[状态](/concepts/state)。

<Warning>
  **速率限制正在动态调整。** 我们正在服务非常大量的需求，上述限制可能在我们消化需求期间随时变化——随着即将落地的大型 GPU 合作和我们放行更多用户。待情况稳定后，我们会提供更稳定的限制。更高限制可在定制和企业方案中获得。联系 [sales@typesafe.ai](mailto:sales@typesafe.ai)。
</Warning>

## 别名

别名是解析到带版本模型 ID 的模型名。像其他名字一样放进 `model` 字段发送即可。

| 别名          | 指向         | 含义                                                                                                    |
| :------------ | :----------- | :------------------------------------------------------------------------------------------------------ |
| `jev-latest`  | `jev-1.13.0` | 最新的稳定官方版本。是我们客户端 SDK 的默认值，也是本文档示例使用的名字。                                  |
| `jev-preview` | `jev-1.13.0` | 最新的版本，无论是否为官方版本。有预览构建可用时会领先于 `jev-latest`。                                     |

<Warning>
  `jev-preview` 目前与 `jev-latest` 指向同一模型。现在没有可用的预览构建。
</Warning>

别名会随着新版本发布而移动，因此它背后的答案可能在你没有改动的情况下变化。响应的 `model` 字段报告实际应答的带版本 ID，你可以据此记录每个结果由哪个模型产生。如果你已针对特定版本调好了置信度阈值，请固定该版本的 ID 而不是别名，并按你自己的节奏迁移到新版本。

## 定制 Jev

Jev 不会用客户数据做微调或 LoRA 适配。它以 [RLCD](/introduction/machine-learning-primer) 训练以返回校准决策，同一套权重服务所有账户。你通过请求把它的答案塑形到你的领域，而不是通过按账户的权重：

* 把你的专有内容、记录和参考资料放进 `state` 字段。见[状态](/concepts/state)。
* 把你的领域规则和边界情况编码进每个问题的 `instructions` 和 `criteria`。见[如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)和[进阶：结构化](/primitives/advanced)。
* 把宽泛的判断拆解为原子问题，并在代码中组合输出。见[复合评分](/patterns/composite-scoring)；用 Jev 的概率训练下游经典模型见 [AutoResearch cookbook](/cookbooks/autoresearch_feature_discovery)。

## 语言支持

Jev 接受自然语言文本。英语是主要训练语言，准确率目前最佳。其他语言（包括中日韩文字）可以处理但表现不均；在非英语工作负载上依赖 Jev 之前，请先用自己的内容测试，并在路由时密切关注[置信度](/confidence)。

## 数据处理

Jev 不用客户请求或响应做训练。数据处理协议（DPA）、隐私政策以及企业客户零数据保留（ZDR）的细节见[法律信息](/legal)。

## 列出模型

`GET /v1/models` 返回你的账户可在 `model` 字段中发送的名字，每个都附带描述和发布日期。目前列出的是别名。带版本的 ID（如 `jev-1.13.0`）无论是否出现在列表中，都可被 `model` 字段接受。

<CodeGroup>
  ```bash cURL theme={null}
  curl https://api.typesafe.ai/v1/models \
    -H "Authorization: Bearer $TYPESAFE_API_KEY"
  ```

  ```python Python theme={null}
  from typesafe_sdk import TypeSafeClient

  with TypeSafeClient() as client:
      for model in client.models.list().models:
          print(model.name, model.release_date, model.description)
  ```

  ```typescript JavaScript theme={null}
  import { TypeSafeClient } from "@typesafe-ai/sdk";

  const client = new TypeSafeClient();
  const models = await client.models.list();
  for (const model of models) {
    console.log(model.name, model.release_date, model.description);
  }
  ```
</CodeGroup>

<ResponseField name="models" type="array" required>
  每个模型或别名一条。

  <Expandable title="属性">
    <ResponseField name="name" type="string" required>
      模型 ID 或别名，`model` 字段可接受的写法。
    </ResponseField>

    <ResponseField name="description" type="string" required>
      该模型的用途。
    </ResponseField>

    <ResponseField name="release_date" type="string" required>
      该模型或别名的发布时间。
    </ResponseField>
  </Expandable>
</ResponseField>

完整方法签名见 [Python](/sdk/python/api/clients/sync#typesafe_sdk.Models.list) 和 [JavaScript](/sdk/javascript/api/interfaces/Models) SDK 参考。
