# Choice

> Choice 是一种 System One 问题类型，用于从定义好的集合中选出一个选项。答案包含选中的选项、每个选项的概率以及置信度。

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

当答案是固定选项集合中的一个时，使用 Choice。例如：工单应由哪个团队处理、商品属于哪个类目、代码片段是用什么语言写的。如果答案是谱系上的位置，用 [Score](/primitives/score)；如果是是/非问题，用 [Noul](/primitives/noul)。三者的对比见[选择问题类型](/primitives#choose-a-question-type)。

Choice 答案是 `choice` 中选中的选项。模型还会在 `probabilities` 中返回每个选项的概率，以及在 `confidence` 中返回所选选项的置信度。

示例问题：

```
"这段代码是用什么编程语言写的"
  → 选项：python, javascript, typescript, go, rust, other

"根据标题和描述，这是什么类型的会议"
  → 选项：standup, planning, retrospective, one on one, brainstorm, none of the above

"这件商品属于哪个产品类目"
  → 选项：electronics, clothing, home garden, food and beverage
```

## 请求结构

发送到 [TypeSafe API](/api) 的 POST 请求体有固定的结构。顶层有三个字段：`state`（待评估的内容）、`model`，以及 `questions`（由你选择的问题 id 到问题对象的映射）。每个 Choice 问题有以下字段：

* `type`：固定为 `"choice"`。
* `instructions`：模型要回答的问题。
* `criteria`：答案选项，以映射形式给出。每个键是选项名，每个值是该选项的描述。

下面这个请求中，状态是一家在线鞋店的客服工单，问题是该由哪个团队处理：

<TypesafeExample
  display="request"
  example={{
state: 'My running shoes arrived in the wrong size. Can I swap them for a size 10?',
selectedModels: ['jev-latest'],
questions: {
  department: {
    type: 'choice',
    instructions: 'Which team should handle this?',
    criteria: {
      returns: 'Exchanges, wrong or damaged items',
      shipping: 'Delivery status, delays, lost packages',
      billing: 'Charges, invoices, payment problems',
    },
  },
},
}}
/>

问题 id 由你选择，本例中是 `department`。答案会以相同的 id 返回。模型永远看不到问题 id。选项名及其描述都会发送给模型，因此描述要能把各选项区分开。

我们的[客户端 SDK](/sdk) 提供类型化的问题。在 Python 中，同一个问题写作一个 `Choice`：

```python theme={null}
from typesafe_sdk import Choice, TypeSafeClient

with TypeSafeClient() as client:
    response = client.system_one(
        state="My running shoes arrived in the wrong size. Can I swap them for a size 10?",
        questions={
            "department": Choice(
                instructions="Which team should handle this?",
                criteria={
                    "returns": "Exchanges, wrong or damaged items",
                    "shipping": "Delivery status, delays, lost packages",
                    "billing": "Charges, invoices, payment problems",
                },
            ),
        },
    )

    print(response.answers["department"].choice)
```

使用 `system_one` 方法或 `https://api.typesafe.ai/v1/systemone` 端点调用 System One 模型。`model` 字段选择由哪个模型处理请求。在代码的哪个位置调用它，见[如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)。

使用我们的[客户端 SDK](/sdk) 之一，或直接调用 [HTTP API](/api)。如果是编码智能体替你写集成代码，请先安装 [TypeSafe 智能体技能](/agent-skill#installation)，让它了解请求和响应的形态。

<Note>
  `instructions` 和 `criteria` 中的每个条目都可以是字符串、对象或数组。先用字符串。当一条描述需要多种指引时再用对象，例如选项涵盖什么、不涵盖什么、以及一些示例。参见下文[结构化的指令与判据](#structured-instructions-and-criteria)和 [API 参考](/api#param-instructions-1)。
</Note>

## 响应结构

响应的 `answers` 中每个问题一个条目，键与请求中的 id 相同。这是对上面示例请求的响应：

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "returns",
      "confidence": 1.0,
      "probabilities": {
        "shipping": 0.0,
        "returns": 1.0,
        "billing": 0.0
      }
    }
  },
  "usage": {
    "input_tokens": 328,
    "output_tokens": 34
  }
}
```

除 `type` 外，每个 Choice 答案还有三个值：

* `choice`：概率最高的选项。
* `probabilities`：所有选项上的完整概率分布，各值之和为 1。
* [`confidence`](/confidence)：一个 0 到 1 的数，由 `probabilities` 的分散程度计算而来。形状平坦（概率摊在多个选项上）意味着低置信度；单一选项上出现尖峰意味着高置信度。

这张工单很简单，所以全部概率都落在 `returns` 上，置信度为 1.0。如果一张工单既提到尺码错误又提到退款未到，概率就会在 `returns` 和 `billing` 之间分摊，置信度随之下降。

## 最佳实践：每次调用问多个问题

把你代码可能用到的每个 Choice 问题都放进一次请求，而不是每个问题一次请求。问题会被并行评估。增加问题几乎不改变响应时间，代码可以忽略不需要的答案。额外的问题仍然消耗 token。完整说明见[一次提问多个问题](/primitives#ask-multiple-questions-together)；下一节展示了在一次调用中提出五个 Choice 问题。

同样的逻辑也适用于单个 Choice 问题内部的选项。一个 Choice 问题最多接受 255 个选项，每个选项各消耗少量 token，因此直接把完整的团队、类目或产品列表给模型，而不是只给一份候选名单。当列表可能覆盖不了所有输入时，加一个 `other` 或 `none of the above` 选项，让模型能够表达"其余选项都不符合"。

要通过深层级结构或大型分类体系给文档分类，可以逐级串联 Choice 问题。[层级分类 cookbook](/cookbooks/hierarchical_classification) 展示了如何在 Choice 概率上执行束搜索，每一级保留最优的 `K` 条候选路径，而不是只沿一条贪婪路径走到底。

## 一个更复杂的例子

上面的基础示例只是把工单路由到某个团队。更大的客服系统可能还需要退货原因、物流问题、客户想要什么、客户的语气。

下面的请求针对一张比第一张更含糊的工单提出五个 Choice 问题：它涉及三个团队，而且没说清客户想要什么。

<TypesafeExample
  display="request"
  example={{
state: 'Shoes arrived two weeks late and in the wrong size. Also I see two charges of $120 on my card. What are you going to do about this?',
selectedModels: ['jev-latest'],
questions: {
  department: {
    type: 'choice',
    instructions: 'Which team should handle this?',
    criteria: {
      returns: 'Exchanges, wrong or damaged items',
      shipping: 'Delivery status, delays, lost packages',
      billing: 'Charges, invoices, payment problems',
    },
  },
  return_reason: {
    type: 'choice',
    instructions: 'If the customer wants to return something, why?',
    criteria: {
      wrong_size: "The item doesn't fit",
      wrong_item: 'A different product was delivered',
      damaged: 'The item arrived broken or faulty',
      changed_mind: 'The item is fine, the customer no longer wants it',
      other: 'A return reason that fits none of the above',
    },
  },
  shipping_issue: {
    type: 'choice',
    instructions: 'If this is a shipping problem, which kind is it?',
    criteria: {
      not_delivered: 'The package never arrived',
      delayed: 'The package is late but still on its way',
      wrong_address: 'The package went to the wrong place',
      damaged_in_transit: 'The package arrived damaged',
      other: 'A shipping problem that fits none of the above',
    },
  },
  requested_resolution: {
    type: 'choice',
    instructions: 'What does the customer want to happen?',
    criteria: {
      exchange: 'Swap the item for a different one',
      refund: 'Money back',
      replacement: 'The same item sent again',
      information: 'Just an answer, no action needed',
    },
  },
  tone: {
    type: 'choice',
    instructions: "What is the customer's tone?",
    criteria: {
      calm: null,
      frustrated: null,
      angry: null,
    },
  },
},
}}
/>

其中两个 Choice 问题是推测性的：`return_reason` 只在 `department` 为 `returns` 时才有意义，`shipping_issue` 只在 `shipping` 时才有意义。`tone` 问题的描述用 `null`，因为选项名本身已经足够清楚。

TypeSafe 的响应：

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "returns",
      "confidence": 0.42,
      "probabilities": {
        "shipping": 0.04,
        "billing": 0.35,
        "returns": 0.61
      }
    },
    "return_reason": {
      "type": "choice",
      "choice": "wrong_size",
      "confidence": 1.0,
      "probabilities": {
        "other": 0.0,
        "wrong_size": 1.0,
        "changed_mind": 0.0,
        "damaged": 0.0,
        "wrong_item": 0.0
      }
    },
    "shipping_issue": {
      "type": "choice",
      "choice": "delayed",
      "confidence": 0.67,
      "probabilities": {
        "wrong_address": 0.0,
        "other": 0.26,
        "not_delivered": 0.0,
        "damaged_in_transit": 0.0,
        "delayed": 0.74
      }
    },
    "requested_resolution": {
      "type": "choice",
      "choice": "refund",
      "confidence": 0.2,
      "probabilities": {
        "replacement": 0.34,
        "refund": 0.4,
        "information": 0.02,
        "exchange": 0.24
      }
    },
    "tone": {
      "type": "choice",
      "choice": "frustrated",
      "confidence": 0.76,
      "probabilities": {
        "frustrated": 0.84,
        "angry": 0.16,
        "calm": 0.0
      }
    }
  },
  "usage": {
    "input_tokens": 589,
    "output_tokens": 212
  }
}
```

每个问题都独立针对这张工单作答：

* `department` 的答案是 `returns`（概率 0.61），但由于双重扣款，`billing` 拿到了 0.35。这张工单属于两个团队，0.42 的分裂置信度正反映了这一点。
* `return_reason` 是 `wrong_size`，置信度 1.0——意料之中，工单里写得明明白白。
* `shipping_issue` 的答案在 `delayed` 和 `other` 之间分裂。这是个推测性问题，且 `department` 并未返回 shipping，代码可以忽略它，如下面示例代码所示。
* `requested_resolution` 的答案倾向 `refund`（0.40），`replacement` 和 `exchange` 分摊了其余大部分，置信度只有 0.20。双重扣款指向退款，尺码错误指向换货，而客户从未说要哪个。
* `tone` 的答案是 `frustrated`，概率 0.84，置信度 0.76。

下面的示例代码读取它需要的答案、忽略其余的，并把低置信度答案当作"先询问、不擅自行动"的理由：

```python theme={null}
from typesafe_sdk import Choice, TypeSafeClient

TRIAGE_QUESTIONS = {
    "department": Choice(
        instructions="Which team should handle this?",
        criteria={
            "returns": "Exchanges, wrong or damaged items",
            "shipping": "Delivery status, delays, lost packages",
            "billing": "Charges, invoices, payment problems",
        },
    ),
    "return_reason": Choice(
        instructions="If the customer wants to return something, why?",
        criteria={
            "wrong_size": "The item doesn't fit",
            "wrong_item": "A different product was delivered",
            "damaged": "The item arrived broken or faulty",
            "changed_mind": "The item is fine, the customer no longer wants it",
            "other": "A return reason that fits none of the above",
        },
    ),
    "shipping_issue": Choice(
        instructions="If this is a shipping problem, which kind is it?",
        criteria={
            "not_delivered": "The package never arrived",
            "delayed": "The package is late but still on its way",
            "wrong_address": "The package went to the wrong place",
            "damaged_in_transit": "The package arrived damaged",
            "other": "A shipping problem that fits none of the above",
        },
    ),
    "requested_resolution": Choice(
        instructions="What does the customer want to happen?",
        criteria={
            "exchange": "Swap the item for a different one",
            "refund": "Money back",
            "replacement": "The same item sent again",
            "information": "Just an answer, no action needed",
        },
    ),
    "tone": Choice(
        instructions="What is the customer's tone?",
        criteria={"calm": None, "frustrated": None, "angry": None},
    ),
}


def triage(ticket: str) -> None:
    with TypeSafeClient() as client:
        response = client.system_one(
            state=ticket,
            questions=TRIAGE_QUESTIONS,
        )
    answers = response.answers

    department = answers["department"]
    if department.confidence < 0.3:
        # 不清楚该派给哪个团队。让人来决定。
        send_to_manual_triage(ticket)
        return

    if department.choice == "returns":
        # return_reason 的答案只在这里使用
        assign(ticket, team="returns", issue=answers["return_reason"].choice)
    elif department.choice == "shipping":
        # shipping_issue 的答案只在这里使用
        assign(ticket, team="shipping", issue=answers["shipping_issue"].choice)
    else:
        assign(ticket, team="billing")

    # 概率占比确实可观的第二个团队会收到副本
    for team, probability in department.probabilities.items():
        if team != department.choice and probability > 0.25:
            notify(ticket, team=team)

    resolution = answers["requested_resolution"]
    if resolution.confidence < 0.5:
        # 客户没说想要什么。问，别猜。
        ask_customer_what_they_want(ticket)
    elif resolution.choice == "refund":
        flag_for_refund_approval(ticket)

    if answers["tone"].choice == "angry":
        flag_for_senior_agent(ticket)
```

对上面那张工单，这段代码把工单派给 returns 团队并附上问题 `wrong_size`；由于 billing 的 0.35 占比超过了 0.25 的阈值，给 billing 团队发了一份副本；由于期望解决方案的置信度 0.20 低于 0.5，会去询问客户想要什么。代码没有使用 `shipping_issue` 的答案。

一次请求、五个答案，路由逻辑就是普通的 `if` 语句。之后如果你还需要知道客户的语言、或工单涉及哪件商品，往 `TRIAGE_QUESTIONS` 里再加一个 Choice 问题即可，请求数依然是一。

[智能家居助手演示](/demos/smart-home)在一次调用中用一长串 Choice 问题评估每一条用户请求：请求类目、房间、设备、动作。这些问题中的大多数对任何单条请求都不相关，代码会忽略它们。

## 结构化的指令与判据

先从每个选项一行描述开始。当两个选项相近、模型反复混淆时，把字符串换成对象来描述每个选项。给它加上字段：该选项涵盖什么、哪些该归到相邻选项、以及几个示例输入。

下面的两个答案选项 return\_policy 和 return\_status 很容易混淆。关于其中任何一个的工单都可能提到退货和退款，所以每个选项都写明了它不适用于什么。

<TypesafeExample
  display="request"
  example={{
state: 'I sent the shoes back a week ago. When do I get my money?',
selectedModels: ['jev-latest'],
questions: {
  return_topic: {
    type: 'choice',
    instructions: {
      question: 'Which returns topic is the customer asking about?',
      focus: 'Classify the information the customer wants.',
    },
    criteria: {
      return_policy: {
        what: 'Whether and how an item can be returned',
        not_for: 'Progress of a return already sent',
        examples: [
          "Can I return shoes I've worn once?",
          'How long do I have to return an order?',
        ],
      },
      return_status: {
        what: 'Progress of a return already sent',
        not_for: 'Whether and how an item can be returned',
        examples: [
          'Has my return arrived yet?',
          'When will my refund be paid?',
        ],
      },
    },
  },
},
}}
/>

响应是 `return_status`，置信度 1.0：

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "return_topic": {
      "type": "choice",
      "choice": "return_status",
      "confidence": 1.0,
      "probabilities": {
        "return_policy": 0.0,
        "return_status": 1.0
      }
    }
  },
  "usage": {
    "input_tokens": 407,
    "output_tokens": 32
  }
}
```

字段名 `question`、`focus`、`what`、`not_for`、`examples` 不是 API 的一部分，也没有任何保留字段。它们由你选择，与你选择选项名的方式相同。模型会看到这些名字及其对应的值，因此用简短、能标注其后内容的名字。
