# Primitives (Questions)

> The three TypeSafe question types (Choice, Score, Noul), the typed answers they return, how to choose between them, and how to ask several at once.

export function TypesafeExample({example, display, title}) {
  const keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
  function compressToEncodedURIComponent(input) {
    if (input == null) return "";
    return _compress(input, 6, function (a) {
      return keyStrUriSafe.charAt(a);
    });
  }
  function _compress(uncompressed, bitsPerChar, getCharFromInt) {
    if (uncompressed == null) return "";
    var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }
      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) {
              context_data_val = context_data_val << 1;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 8; i++) {
              context_data_val = context_data_val << 1 | value & 1;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i = 0; i < context_numBits; i++) {
              context_data_val = context_data_val << 1 | value;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 16; i++) {
              context_data_val = context_data_val << 1 | value & 1;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1 | value & 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }
    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 8; i++) {
            context_data_val = context_data_val << 1 | value & 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1 | value;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 16; i++) {
            context_data_val = context_data_val << 1 | value & 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i = 0; i < context_numBits; i++) {
          context_data_val = context_data_val << 1 | value & 1;
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }
    value = 2;
    for (i = 0; i < context_numBits; i++) {
      context_data_val = context_data_val << 1 | value & 1;
      if (context_data_position == bitsPerChar - 1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }
    while (true) {
      context_data_val = context_data_val << 1;
      if (context_data_position == bitsPerChar - 1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      } else context_data_position++;
    }
    return context_data.join("");
  }
  function buildHref(ex) {
    const documentText = ex.state === undefined ? "" : typeof ex.state === "string" ? ex.state : JSON.stringify(ex.state, null, 2);
    return "https://console.typesafe.ai/decode#share/" + compressToEncodedURIComponent(JSON.stringify({
      apiVersion: "v1",
      documentText,
      promptsText: JSON.stringify(ex.questions, null, 2),
      selectedModels: ex.selectedModels
    }));
  }
  const displayedExample = display === "questions" ? example.questions : example.state === undefined ? {
    questions: example.questions
  } : {
    state: example.state,
    questions: example.questions
  };
  const code = JSON.stringify(displayedExample, null, 2);
  const href = buildHref(example);
  return <div style={{
    margin: "1.25rem 0"
  }}>
      <CodeBlock language="json" filename={title ?? "request"}>
        {code}
      </CodeBlock>
      <div className="pb-8">
        <a href={href} target="_blank" rel="noreferrer" className="text-primary">
          Try it in the Playground →
        </a>
      </div>
    </div>;
}

TypeSafe 的原语是你在代码中组合的小巧、类型化的构建块。它们成对出现：一个问题（question）定义了一个 [System One 模型](/concepts/system-one)要对某个[状态](/concepts/state)做出的判断，其答案（answer）则是返回的类型化值。你在代码中组合这些答案来做出决策。共有三种问题类型，每种返回不同形态的答案。

| 类型                         | 回答什么               | 返回值                                            |
| ---------------------------- | ----------------------- | ------------------------------------------------ |
| [Choice](/primitives/choice) | 选哪个选项？            | `choice`、`probabilities`、`confidence`          |
| [Score](/primitives/score)   | 处于哪一档？            | `score`、`legend`、`probabilities`、`confidence` |
| [Noul](/primitives/noul)     | 这是否为真？            | `noul`（0 到 1）                                 |

你可以只问一个问题，也可以把多个问题一起发送。请求中的每个问题看到的是同一个状态，相互独立评估，并在你指定的 ID 下返回类型化答案。

## 每个问题只要求一次直觉式判断

System One 模型为快速、聚焦的判断而构建。提出的问题应该是知识渊博的人在给定恰当上下文时一秒钟内就能做出的判断。"这条消息是否表达了紧迫性？"是一个好问题。"分析这条消息并确定最佳行动方案"则不是。那需要慢速推理，并且这是一个信号：应该把任务拆解成多个小问题，然后在代码中组合答案。

如果你想要的判断依赖多个独立因素，就分别询问每个因素，然后用自己的逻辑组合答案。不要说"给这个创业路演打分"，而是分别询问市场规模、技术可行性和差异化，再在代码中按相对重要性为它们加权。当优先级变化时，只需修改权重值，而不是重写提示词。具体做法见[一次提问多个问题](#ask-multiple-questions-together)。

## 定义一个问题

每个问题都有一个 ID、一个 `type` 和 `instructions`。Choice 和 Score 问题还需要 `criteria`，它定义 Choice 问题的选项或 Score 的档位。Noul 问题接受 `criteria` 作为对"是"与"否"含义的可选澄清。

* ID。你选择的键，例如 `refund_requested`。它在响应中标识对应的答案。
* `type`。`choice`、`score` 或 `noul` 三者之一。
* `instructions`. 你针对状态提出的问题。你的评估逻辑就写在这里。可以写成清晰、具体的问题，也可以写成让模型判断的陈述。大多数问题用一个字符串就够了。它也可以是对象或数组，把问题放在一个字段、把其所指的数据放在其他字段；参见[在问题中使用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)。
* `criteria`。可能的答案：Choice 问题的选项映射、Score 的有序档位列表、Noul 的可选"是/否"描述。每种问题类型的页面会介绍其具体形态。

下面这个问题询问客户是否请求了退款：

```python theme={null}
from typesafe_sdk import Noul

questions = {
    "refund_requested": Noul(
        instructions="Does the customer request a refund?",
    ),
}
```

<Tip>
  问题 ID 是给代码用的，不会发送给模型。即使 ID 看起来不言自明，也要在 `instructions` 中写下完整的问题。
</Tip>

## 选择问题类型

选择与你所需答案形态匹配的类型。

* **Choice** 适合答案是已知选项集合中的一个、且选项之间没有顺序的情形：把工单路由到某个部门、分类文档类型、检测编程语言。给出完整的选项列表，并在列表可能无法覆盖所有输入时添加 `other` 或 `以上都不是` 选项。

* **Score** 适合答案落在一个谱系上、且你能描述谱系上每个点含义的情形：缺陷严重程度、客户沮丧程度、技能水平。档位由你定义，模型返回沿档位的位置。

* **Noul** 适合干净的是/非问题，且概率本身就是有用信号：这条消息是否包含个人身份信息、客户是否在请求退款、简历是否提到了分布式系统。

<Note>
  是/非判断用 Noul，衡量谱系上的位置用 Score。"这位候选人 Python 强吗？"需要对"强"有清晰的定义。Noul 值为 0.5 表示模型给"是"与"否"相同的概率，并不意味着候选人的技能水平居中。定义不清晰会让这个概率难以解读。

  如果要衡量技能水平，使用带明确档位的 Score，例如：没有经验、有一定了解、日常使用、深度专精。如果需要是/非决策，就把条件定义清楚，例如"简历是否写明候选人在工作中使用过 Python？"
</Note>

如果两种类型看起来都合适，优先选择你的代码可以直接据此行动的那种。`refund`、`rebook`、`information` 之间的 Choice 可以直接映射到三条代码路径。客户沮丧程度的 Score 映射到一个阈值。Noul 映射到一个 `if`。

## 返回什么

答案也是原语。每种问题类型返回一个类型化的值，你的代码可以比较、设阈值、排序、传入后续逻辑，或放进后续请求的状态中（参见[当一个问题依赖另一个问题时](#when-one-question-depends-on-another)）。

| 类型   | 答案字段                                         | 如何解读                                                                                                                                                              |
| ------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Choice | `choice`、`probabilities`、`confidence`          | `choice` 是选中的选项。`probabilities` 是所有选项上的分布。`confidence` 概括该分布有多尖锐。                                                                         |
| Score  | `score`、`legend`、`probabilities`、`confidence` | `score` 是沿档位的位置，可以落在两档之间。`legend` 按编号重复档位。`probabilities` 是各档位上的分布。                                                                |
| Noul   | `noul`                                           | 答案为"是"的概率。接近 1 是强烈的"是"，接近 0 是强烈的"否"，接近 0.5 表示不确定。Noul 没有单独的 `confidence`。                                                  |

这些答案的两个特性使它们可组合：

* **每个答案都被限制在你提供的选项之内。** 模型返回的是你的选项或档位上的概率分布，绝不会超出它们。你的代码永远不需要从生成的散文中还原值。
* **每个答案相互独立。** 一个问题的答案不会成为另一个问题的隐藏上下文。你可以增删问题而不改变其他问题的结果。

[置信度](/confidence)解释了 `confidence` 如何从 `probabilities` 推导而来，以及如何用它决定何时自动执行、何时上报人工。

## 引用特定字段

被评估的内容——[状态](/concepts/state)——常常是一个包含多个部分的 JSON 对象：一场对话、一条记录、一项政策。当问题只涉及其中某个部分时，在 `instructions` 中用点加索引的路径指向其键（保留反引号）来指名它。模型就知道该判断状态的哪一部分。

以状态页中的客服对话为例：

```json theme={null}
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

这两个问题通过路径分别指向客户消息、政策和扣款记录：

```python theme={null}
questions = {
    "refund_requested": {
        "type": "noul",
        "instructions": "Does `ticket.messages[0].text` request a refund?",
    },
    "policy_supports_refund": {
        "type": "noul",
        "instructions": (
            "Does `refund_policy` support the refund requested "
            "in `ticket.messages[0].text`, given `order.charges`?"
        ),
    },
}
```

显式路径清楚地指明了结构化状态的哪些部分应当参与每个判断。如何组织输入见[状态](/concepts/state)。

## 一次提问多个问题

把所有使用同一个状态的问题放进一次请求。你可以随意混用问题类型。System One 模型并行评估请求中的每个问题。增加问题几乎不改变响应时间，成本也只是额外问题的 token，非常便宜。问一个可能用不上的问题几乎是免费的。

下面这个请求一次完成：分类客户消息、检查紧迫性、评估沮丧程度：

<TypesafeExample
  example={{
state:
  "Our API integration started returning 500 errors on every request about 20 minutes ago, and we can't process any customer orders until this is fixed.",
questions: {
  department: {
    type: 'choice',
    instructions: 'Which team should handle this',
    criteria: {
      billing: 'Payment or subscription issues',
      technical: 'Bugs or integration problems',
      sales: 'Pricing or account questions',
    },
  },
  is_urgent: {
    type: 'noul',
    instructions: 'The message conveys urgency or time-sensitivity',
  },
  frustration: {
    type: 'score',
    instructions: 'How frustrated the customer appears',
    criteria: [
      'Calm, just stating facts',
      'Frustrated but civil',
      'Very angry, strong language',
    ],
  },
},
}}
/>

我们的[客户端 SDK](/sdk) 提供类型化的问题和答案。在 Python 中，把由 `Choice`、`Noul`、`Score` 对象组成的 `questions` 字典传给 `client.system_one(...)`。这个请求一次性发送工单和退款政策，并为每个问题获得类型化答案：

```python theme={null}
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

state = {
    "ticket_message": "My flight was cancelled. Can I get a refund?",
    "refund_policy": "Cancelled flights are eligible for a full refund.",
}

with TypeSafeClient() as client:
    response = client.system_one(
        state=state,
        questions={
            "refund_requested": Noul(
                instructions="Does `ticket_message` request a refund?",
            ),
            "request_type": Choice(
                instructions="What is the main request in `ticket_message`?",
                criteria={
                    "refund": "The customer wants money returned.",
                    "rebooking": "The customer wants a replacement flight.",
                    "information": "The customer is asking for information only.",
                },
            ),
            "frustration": Score(
                instructions="How frustrated does the customer appear in `ticket_message`?",
                criteria=[
                    "Calm and neutral.",
                    "Concerned but civil.",
                    "Very angry or using strong language.",
                ],
            ),
        },
    )

print(response.answers["refund_requested"].noul)
print(response.answers["request_type"].choice)
print(response.answers["frustration"].score)
```

在你所用语言中的安装与用法见[客户端 SDK](/sdk)。

### 提出推测性问题

把你代码可能需要的每个问题都问出来，包括那些答案只对部分输入有意义的问题，然后由代码决定使用哪些答案。如果工单最终不是缺陷报告，就忽略严重程度那个答案。我们把这种做法称为[推测性扇出](/patterns/fan-out)模式。[并行问题 cookbook](/cookbooks/parallel_questions) 展示了把 13 个问题打包进一次调用，比 13 次独立调用便宜 11.5 倍、快 9.6 倍，且答案毫无变化。

<Tip>
  编码智能体比人更容易陷入"每次调用只问一个问题"的习惯。[TypeSafe 智能体技能](/agent-skill#installation)会告诉你的智能体在每次调用中放入大量问题，包括那些只对部分输入有意义的问题。
</Tip>

### 把复杂判断拆成多个问题

依赖多个因素的判断，最好拆成每个因素一个问题。在代码中组合答案，并为每个答案按相对重要性赋予权重。权重由你掌控。当组合结果与团队的实际决策不符时，在代码中修改权重并重新运行。增加问题几乎不改变响应时间，因为它们在同一次请求中并行执行。拆分只多花一点问题 token。

例如，工单优先级可以由三个 Score 问题构建：缺陷有多严重、客户有多沮丧、报告给工程师留下了多少可着手的信息。Score 页面在[把复杂判断拆成多个 Score](/primitives/score#splitting-a-complex-judgment-into-several-scores)中详细演示了这个请求以及归一化并加权答案的代码。这种技术称为[复合评分](/patterns/composite-scoring)模式。

### 当一个问题依赖另一个问题时

同一请求中的问题是相互独立的：一个答案不会成为另一个问题的上下文。如果后续判断依赖前面的答案，就在代码中发起第二次请求。只有当你的代码没有第一个答案就无法构建第二个请求时，依赖才是真实的：需要答案来为状态获取更多数据、决定状态的组成，或选择下一个问题的选项。否则，就把问题放在一起提问，并在代码中组合它们的答案。

两次请求是例外而不是常态。如果第二次请求的问题本可以针对原始状态提出，就把它们放进第一次请求，让代码忽略不需要的答案。有三个 cookbook 是出于真实原因发起第二次请求的。[技能推荐](/cookbooks/skill_suggestion)在一次请求中对 182 个技能排序，然后获取前三名的完整文本，再基于这些更好的证据重新评判它们。[结构恢复](/cookbooks/autoformat)先询问每个换行是否截断了句子，根据答案把行合并成块，再对这些块分类——而这些块在第一次请求应答之前根本不存在。[层级分类](/cookbooks/hierarchical_classification)用每个 Choice 的答案决定下一次请求提供哪些选项。

关于如何把工作流拆解为聚焦判断的指引，见[如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)。

## 下一步

<Columns cols={3}>
  <Card title="Choice" href="/primitives/choice" icon="list">
    从固定列表中选择一个选项。
  </Card>

  <Card title="Score" href="/primitives/score" icon="gauge">
    沿有序档位对状态评分。
  </Card>

  <Card title="Noul" href="/primitives/noul" icon="circle-check">
    获得一个陈述为真的概率。
  </Card>
</Columns>

想了解它们如何组合成系统架构，请前往[模式](/patterns)。
