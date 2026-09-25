# Noul

> Noul 问题让 TypeSafe 模型评估一个是非问题，并返回答案为「是」的概率。

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

当答案只有「是」或「否」时，就用 Noul。比如这条消息是不是在要求退款、这份简历有没有提到分布式系统、这条评论里有没有个人数据。如果答案是若干选项之一，就用 [Choice](/primitives/choice)；如果答案是一条谱系上的位置，就用 [Score](/primitives/score)。[选择问题类型](/primitives#choose-a-question-type)对这三者做了比较。

Noul 的答案是一个数字，表示答案为「是」的概率：0 表示否，1 表示是。

## 请求结构

发往 [TypeSafe API](/api) 的 POST 请求体和其他问题类型一样，有三个顶层字段：要评估的内容 `state`、`model` 和 `questions`。每个 Noul 问题包含以下字段：

* `type`：始终是 `"noul"`。
* `instructions`：模型要回答的是非问题，或者一句让它判断的陈述。
* `criteria`：可选。一个对象，用 `true` 和 `false` 两条描述说明什么算「是」、什么算「否」。

下面这个请求里，状态是一条客服消息，两个问题分别是：客户是不是想找真人，以及客户之前有没有联系过客服：

<TypesafeExample
  display="request"
  example={{
state: 'I have asked three times now. Can I please just talk to a real person?',
selectedModels: ['jev-latest'],
questions: {
  is_human_escalation: {
    type: 'noul',
    instructions: 'Is the customer asking for a human agent?',
  },
  is_repeat_contact: {
    type: 'noul',
    instructions: 'Has the customer contacted support about this before?',
    criteria: {
      true: 'Mentions a prior attempt, ticket, or that they have asked before',
      false: 'No sign of any previous contact',
    },
  },
},
}}
/>

问题 id 由你决定，这里是 `is_human_escalation` 和 `is_repeat_contact`。这些 id 不会发给模型，每个答案都以同一个 id 返回。第一个问题只靠 `instructions`；第二个额外加了 `criteria`，说明什么算「是」、什么算「否」。

用 [Python SDK](/sdk/python) 时，同样的问题写成 `Noul` 对象：

```python theme={null}
from typesafe_sdk import Noul, NoulCriteria, TypeSafeClient

with TypeSafeClient() as client:
    response = client.system_one(
        model="jev-latest",
        state="I have asked three times now. Can I please just talk to a real person?",
        questions={
            "is_human_escalation": Noul(
                instructions="Is the customer asking for a human agent?",
            ),
            "is_repeat_contact": Noul(
                instructions="Has the customer contacted support about this before?",
                criteria=NoulCriteria(
                    true="Mentions a prior attempt, ticket, or that they have asked before",
                    false="No sign of any previous contact",
                ),
            ),
        },
    )

    print(response.answers["is_human_escalation"].noul)
    print(response.answers["is_repeat_contact"].noul)
```

`system_one` 方法和 `https://api.typesafe.ai/v1/systemone` 端点都取自 TypeSafe 的 AI 模型 [System One](/concepts/system-one) 的名字。[如何用 TypeSafe 构建](/concepts/how-to-build-with-system-one)讲了在代码里该在哪里用它。

如果你用编码智能体来写，先装好 [TypeSafe 智能体技能](/agent-skill#installation)，它就知道请求与响应长什么样了。

<Note>
  `instructions` 可以是字符串、对象或数组。先用字符串。当问题需要把数据带在身边时（比如一条用来和状态比对的记录），或者当问题的某部分由你的代码生成时，再用对象。[在问题里使用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)说明了什么时候结构化有帮助，[下面的例子](#structured-instructions)演示了用代码生成问题的情况。
</Note>

## 响应结构

响应里 `answers` 每个问题一个条目，键就是你请求里用的那组 id：

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "is_human_escalation": {
      "type": "noul",
      "noul": 0.99
    },
    "is_repeat_contact": {
      "type": "noul",
      "noul": 0.93
    }
  },
  "usage": {
    "input_tokens": 360,
    "output_tokens": 39
  }
}
```

这里两个答案都接近 1。客户说了"跟真人说句话"，所以 `is_human_escalation` 是 0.99；"我已经问过三次了"命中 `is_repeat_contact` 的 `true` 描述，所以是 0.93。

## 如何解读 Noul

这个数字同时是答案和确定性。接近 1 就是强烈的「是」，接近 0 就是强烈的「否」，接近 0.5 说明模型给「是」和「否」的概率差不多。

下表是 `jev-1.13.0` 对不同客户消息在 `is_human_escalation` 这个问题上的实际回答记录：

| 状态                                                                   | `noul` |
| ---------------------------------------------------------------------- | ------ |
| 谢谢，这下好了！                                                       | 0.02   |
| 怎么重置我的密码？                                                     | 0.07   |
| 今天必须给我解决，不管用什么办法。                                     | 0.26   |
| 你是机器人吗？                                                         | 0.40   |
| 有没有办法找个人问问我的账单？                                         | 0.84   |
| 我已经问过三次了。能不能让我跟真人说句话？                             | 0.99   |

前两条和后两条都很清楚。"今天必须给我解决"很急，但并没有要找人，得 0.26；"你是机器人吗"暗示想要真人，却没有明说，模型几乎对半分，给了 0.40。这两条都属于要靠代码里的阈值来决定的类型。

和 [Choice](/primitives/choice)、[Score](/primitives/score) 不同，Noul 没有单独的 `confidence` 值。Noul 的概率分布只有「是」和「否」两种结果，所以单个 `noul` 值就把它完整描述了。Choice 和 Score 会把概率摊在多个选项或档位上，`confidence` 就是对这种分散程度的概括。

最常见的是在代码里给 `noul` 设阈值，转成布尔值：

```python theme={null}
wants_human = response.answers["is_human_escalation"].noul > 0.9

if wants_human:
    route_to_agent(ticket)
else:
    route_to_bot(ticket)
```

阈值定在哪里取决于判断错的代价。当「是」和「否」都同样容易处理时，用 0.5；当错误地当成「是」代价很高时（比如半夜把人叫起来、或者退款），就调高；当漏掉一个真正的「是」代价很高时（比如没标出一个安全问题），就调低。中间那些值可以交给人工，而不走任何一条代码路径。这就是[置信度](/confidence#three-paths-for-using-confidence-in-your-code)页面为 Choice 和 Score 答案描述的同一种三分法。

Noul 的值在 0 到 1 之间，但它并不是你所问之事的刻度，而是「答案为是」的概率。如果问题本质上问的是程度，这个值并不衡量程度。下面把"这位候选人的 Python 强吗？"问在四位候选人身上，旁边配一个四档的 [Score](/primitives/score)：没有经验、略知一二、工作中经常使用、精通。

| 候选人                                                                                      | Noul："这位候选人的 Python 强吗？"          | Score："这位候选人有多少 Python 经验？"                      |
| ------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| 我的经验在 Java 和 Go 上，没用过 Python。                                                   | 0.03                                       | 0.0（没有经验）                                              |
| 我做 Java 的间隙偶尔用 Python 写点小脚本。                                                  | 0.14                                       | 1.0（略知一二）                                              |
| 上一份工作里我每天用 Python，用了两年，主要是数据流水线。                                   | 0.81                                       | 2.05（工作中经常使用）                                       |
| 我每天写 Python 已经八年了，包括维护一个大型 Django 代码库。                                | 0.92                                       | 2.89（精通）                                                 |

Noul 判断的是一个命题——"强"，返回值是它为真的可能性。你可以在代码里自己划出 0 到 1 之间的档位，比如把 0.3 到 0.7 叫作"有些经验"，但模型看不到这些档位，所以答案里没有任何东西是针对它们判断出来的。中间值既可能意味着经验中等，也可能意味着情况不明；候选之间的间距也不是你选的。Score 则对每条档位描述单独判断，所以每位候选人都落在你写的某个档位之上或附近，返回的概率显示模型如何在各档位之间分配判断。如果你不认同，就改写某个档位再跑一次。[选择问题类型](/primitives#choose-a-question-type)解释了两者的区别。

## 怎么写 Noul 问题

一个 Noul 只问一个是非问题。如果一个问题里塞了两个条件，比如"客户很生气并且在要求退款吗？"，模型就得同时判断两件事，这个值的意义就下降了。拆成两个 Noul，在代码里组合。

提问的措辞要让高值代表「是」。"这条消息里包含个人数据吗？"很清楚；"这条消息不含个人数据吗？"把含义反了过来，后面读它的代码很容易弄反。

写成陈述句和写成问题一样可以。对"客户正在要求退款"这句陈述，值接近 1 表示这句话为真。两种措辞都在你自己的数据上试一下，看哪种更好。

让「是」和「否」的界线不含糊。"这位候选人有没有任何 Python 经验？"效果不错，因为"任何"没有留下中间地带。当界线很微妙时，就加上带 `true` 和 `false` 描述的 `criteria`，就像上面那个 `is_repeat_contact` 问题那样。多数 Noul 光靠指令就够了，所以带不带 `criteria` 都试一遍，在你自己的文档上哪种答案更好就留哪种。

## 好做法：一次调用问不止一个问题

要核对一串条件，就在一次请求里问多个 Noul：一个条件一个问题，由代码决定这个组合意味着什么。问题是并行评估的，所以多几个 Noul 几乎不改变响应时间。[一次提多个问题](/primitives#ask-multiple-questions-together)讲得更细。

## 在代码里处理多个 Noul 答案 {#handling-multiple-noul-answers-in-code}
上面那个两问请求已经够代码把这条消息路由走了。下面的例子在客户要求找人时报给人工，在客户之前联系过时提高优先级；任一问题的值落在中间，就交给复核者，而不是走任何代码路径：

```python theme={null}
from typesafe_sdk import Noul, NoulCriteria, TypeSafeClient

SUPPORT_QUESTIONS = {
    "is_human_escalation": Noul(
        instructions="Is the customer asking for a human agent?",
    ),
    "is_repeat_contact": Noul(
        instructions="Has the customer contacted support about this before?",
        criteria=NoulCriteria(
            true="Mentions a prior attempt, ticket, or that they have asked before",
            false="No sign of any previous contact",
        ),
    ),
}

YES = 0.8
NO = 0.2


def route(message: str) -> None:
    with TypeSafeClient() as client:
        response = client.system_one(
            model="jev-latest",
            state=message,
            questions=SUPPORT_QUESTIONS,
        )
    answers = response.answers

    wants_human = answers["is_human_escalation"].noul
    repeat = answers["is_repeat_contact"].noul

    if NO < wants_human < YES or NO < repeat < YES:
        # The model isn't sure either way. Let a person decide.
        send_to_review(message)
        return

    priority = "high" if repeat > YES else "normal"
    if wants_human > YES:
        route_to_agent(message, priority=priority)
    else:
        route_to_bot(message, priority=priority)
```

对上面那条消息，`is_human_escalation` 的 noul 答案是 0.99，`is_repeat_contact` 是 0.93，所以代码以高优先级把它路由给人工坐席。"怎么重置我的密码？"这条消息在两个问题上的值都是 0.07，被路由给机器人。

阈值就在你的代码里。如果复核者看到的待审消息太多，就把 `NO` 和 `YES` 之间的间隔收窄；如果太多错误路由漏了过去，就把间隔放宽。以后需要知道消息里有没有提到付款、有没有包含个人数据，就往 `SUPPORT_QUESTIONS` 里再加一个 Noul，请求次数仍然是一次。

## 结构化的指令 {#structured-instructions}
指令可以是对象而不是字符串：问题放一个字段，补充数据放其他字段。[在问题里使用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)讲了什么时候这样做有帮助。这里用它来处理由代码生成的问题：一份刚到的简历，要和候选人库里可能同一个人的记录逐一比对。每条记录原样放进一个 `potential_duplicate` 字段，`question` 对所有记录都一样，所有记录在一次请求里全部检查完。由代码生成的问题键里带着每条记录的数据库 ID：

<TypesafeExample
  display="request"
  example={{
state: {
  resume: {
    name: 'John Smith',
    location: 'Oakland, CA',
    summary: 'Backend engineer with eight years of Python and Go experience.',
    experience: [
      { employer: 'Google', title: 'Senior Backend Engineer', years: '2021-2025' },
      { employer: 'Microsoft', title: 'Software Engineer', years: '2017-2021' },
    ],
  },
},
selectedModels: ['jev-latest'],
questions: {
  same_as_record_18: {
    type: 'noul',
    instructions: {
      potential_duplicate: { name: 'Jon Smith', location: 'Oakland, CA', last_employer: 'Google' },
      question: 'Is the resume for the same person as `potential_duplicate`?',
    },
  },
  same_as_record_42: {
    type: 'noul',
    instructions: {
      potential_duplicate: { name: 'John Smith', location: 'Austin, TX', last_employer: 'Lone Star Freight' },
      question: 'Is the resume for the same person as `potential_duplicate`?',
    },
  },
  same_as_record_77: {
    type: 'noul',
    instructions: {
      potential_duplicate: { name: 'John Smithers', location: 'Oakland, CA', last_employer: 'Bay Health Clinic' },
      question: 'Is the resume for the same person as `potential_duplicate`?',
    },
  },
},
}}
/>

响应：

```json theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "same_as_record_18": {
      "type": "noul",
      "noul": 0.74
    },
    "same_as_record_42": {
      "type": "noul",
      "noul": 0.09
    },
    "same_as_record_77": {
      "type": "noul",
      "noul": 0.08
    }
  },
  "usage": {
    "input_tokens": 535,
    "output_tokens": 58
  }
}
```

每个答案都是「这份简历和那条记录是同一个人」的概率。18 号记录名字拼写不同，但地点和雇主对得上，得 0.74；42 号记录名字相同，但城市和雇主都不同，得 0.09；77 号记录名字相近、地点相同，雇主不同，得 0.08。在代码里给每个值设阈值，做法见[在代码里处理多个 Noul 答案](#handling-multiple-noul-answers-in-code)，中间值交给人工。

用 Python SDK 时，这些问题由候选记录生成：问题文本固定不变，记录在换：

```python theme={null}
from typesafe_sdk import Noul, TypeSafeClient

SAME_PERSON = "Is the resume for the same person as `potential_duplicate`?"


def duplicate_questions(candidates: list[dict]) -> dict[str, Noul]:
    """One Noul per candidate record, all asking the same question."""
    return {
        f"same_as_record_{candidate['id']}": Noul(
            instructions={
                "potential_duplicate": {
                    "name": candidate["name"],
                    "location": candidate["location"],
                    "last_employer": candidate["last_employer"],
                },
                "question": SAME_PERSON,
            },
        )
        for candidate in candidates
    }


def find_duplicates(resume: dict, candidates: list[dict]) -> list[str]:
    with TypeSafeClient() as client:
        response = client.system_one(
            model="jev-latest",
            state={"resume": resume},
            questions=duplicate_questions(candidates),
        )
    return [
        question_id
        for question_id, answer in response.answers.items()
        if answer.noul > 0.7
    ]
```

[结构化数据抽取级联 cookbook](/cookbooks/sde_cascade)用结构化的指令来校验抽出来的记录。每个字段都拿到同一组问题，每个问题的 `instructions` 对象把问题文本放在 `main_question` 属性里，另外还有随字段变化的 `field_spec` 和 `extracted_field` 属性。

## cookbook 里的 Noul

看看我们的 cookbook，里面有使用 Noul 问题的应用：

* [并行问题](/cookbooks/parallel_questions) 在一次请求里对一篇文章跑完一份 13 个问题的合规检查清单。
* [自一致性：noul](/cookbooks/consistency_noul_cookbook) 用一份 15 个问题的量规给保险理赔打分，并衡量多次运行之间这些值有多稳定。
* [重排](/cookbooks/rerank_typesafe) 用的是概率本身而不是阈值：每个「查询-候选」对一个 Noul，再按值给候选排序。
* [逐行搜索](/cookbooks/semantic_find) 把「找出匹配的行」的 Choice 和「文档里到底有没有答案」的 Noul 配对使用。
* [结构恢复](/cookbooks/autoformat) 对每一对相邻行问一个 Noul——这里是不是把一个句子断开了——从而从纯文本重建段落。
