# API 参考

> TypeSafe 评估端点的完整 HTTP API 参考。

对一个 `state` 依据一组类型化的 `questions` 进行评估，返回结构化的 `answers`，每个问题一个。如需引导式介绍，请从[原语](/primitives)开始。

## 评估端点

```http theme={null}
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

## 请求体

每个请求的顶层结构。`questions` 映射中的每个条目都是一个由你命名的类型化问题。

<ParamField body="state" type="string | object | array" required>
  待评估的内容。纯字符串用于文本，结构化数据（对象/数组）用于聊天记录、业务记录或应用当前状态之类的内容。格式与最佳实践见[状态](/concepts/state)。
</ParamField>

<ParamField body="model" type="string" required>
  处理该请求的模型。使用 `"jev-latest"`，即 TypeSafe 的旗舰模型。可用模型与别名见[模型](/models)。
</ParamField>

<ParamField body="questions" type="map<string, Question>" required>
  类型化 [Question](#question-types) 对象的映射。每个键由你选择；答案会以相同的键返回。

  <Expandable title="map entries">
    <ParamField body="‹question id›" type="Question">
      你选择的键。对应的 [Answer](#answer-types) 会以相同的 id 返回。该键不会发送给底层模型，也不参与推理。
    </ParamField>
  </Expandable>
</ParamField>

```json Example request theme={null}
{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "is_urgent": {
      "type": "noul",
      "instructions": "Does this convey urgency?"
    }
  }
}
```

## 问题类型

一个 `Question` 是三种类型之一，由其 `type` 字段设定。三者共享 `type` 和 `instructions`；各自添加自己的 `criteria`。

`instructions` 属性可以是字符串、对象或数组。你可以把一个带有额外上下文或需引用数据的长问题拆成结构化对象：问题放一个字段，数据放其他字段，并在问题中用反引号按名称引用数据字段——与你让问题指向 `state` 中嵌套值的写法相同：

```json theme={null}
"instructions": {
  "potential_duplicate": {
    "name": "John Smith",
    "location": "Oakland, California",
    "last_employer": "Google"
  },
  "question": "Is the resume for the same person as `potential_duplicate`?"
}
```

了解更多见[在问题中使用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)。

### Noul

一个是/非问题。返回答案为"是"的概率。

<ParamField body="type" type="&#x22;noul&#x22;" required />

<ParamField body="instructions" type="string | object | array" required>
  待评估的是/非问题。对象可以把问题放一个字段、所引用的数据放其他字段；见[在问题中使用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)。
</ParamField>

<ParamField body="criteria" type="object">
  对"是"与"否"含义的可选描述。

  <Expandable title="properties">
    <ParamField body="true" type="string | object | array">
      "是"（值接近 1）的含义。
    </ParamField>

    <ParamField body="false" type="string | object | array">
      "否"（值接近 0）的含义。
    </ParamField>
  </Expandable>
</ParamField>

```json Example request focus={5-12} theme={null}
{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "is_urgent": {
      "type": "noul",
      "instructions": "Does this convey urgency?",
      "criteria": {
        "true": "Explicitly time-sensitive",
        "false": "No urgency expressed"
      }
    }
  }
}
```

### Choice

从你定义的集合中选出一个选项。返回选中的选项和完整的概率分布。

<ParamField body="type" type="&#x22;choice&#x22;" required />

<ParamField body="instructions" type="string | object | array" required>
  模型应当决定什么。对象可以把问题放一个字段、所引用的数据放其他字段；见[结构化的指令与判据](/primitives/choice#structured-instructions-and-criteria)。
</ParamField>

<ParamField body="criteria" type="map<string, string | object | array | null>" required>
  选项到量规描述的映射；选项不需要额外说明时用 null。每个 Choice 最多 255 个选项。

  <Expandable title="map entries">
    <ParamField body="‹option›" type="string | object | array | null">
      你选择的键。对该选项的描述。
    </ParamField>
  </Expandable>
</ParamField>

```json Example request focus={5-13} theme={null}
{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "billing": "Payments, invoicing, refunds",
        "technical": "Bugs, outages, integrations",
        "sales": "Pricing, upgrades, new accounts"
      }
    }
  }
}
```

### Score

按你定义的量规对状态评分。返回你的档位上的概率加权值。

<ParamField body="type" type="&#x22;score&#x22;" required />

<ParamField body="instructions" type="string | object | array" required>
  模型应当给什么评分。对象可以把问题放一个字段、所引用的数据放其他字段；见[在问题中使用结构](/concepts/how-to-build-with-system-one#use-structure-in-the-questions)。
</ParamField>

<ParamField body="criteria" type="array<string | object | array>" required>
  有序的档位描述数组。一个 Score 应至少有两档；API 最多接受 10 档。
</ParamField>

```json Example request focus={5-9} theme={null}
{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "frustration": {
      "type": "score",
      "instructions": "How frustrated is the customer?",
      "criteria": ["Calm", "Frustrated", "Very angry"]
    }
  }
}
```

## 响应体

每个问题一个答案，以你提供的相同 id 返回。

<ResponseField name="model" type="string" required>
  执行评估的模型。
</ResponseField>

<ResponseField name="answers" type="map<string, Answer>" required>
  每个问题一个 [Answer](#answer-types)，以你在 questions 中使用的相同 id 作为键。

  <Expandable title="map entries">
    <ResponseField name="‹question id›" type="Answer">
      你在 questions 中选择的相同 id。
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="usage" type="object" required>
  该请求的 token 用量。

  <Expandable title="properties">
    <ResponseField name="input_tokens" type="integer" />

    <ResponseField name="output_tokens" type="integer" />
  </Expandable>
</ResponseField>

```json Example response theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "is_urgent": {
      "type": "noul",
      "noul": 0.95
    }
  },
  "usage": { "input_tokens": 296, "output_tokens": 20 }
}
```

## 答案类型

每个答案都带有与其问题匹配的 `type`。Choice 和 Score 答案还带有 0 到 1 之间的 `confidence`，由答案的概率分布推导而来。见[置信度](/confidence)。

### Noul 答案

<ResponseField name="type" type="&#x22;noul&#x22;" required />

<ResponseField name="noul" type="number" required>
  是/非答案，取值范围 0（否）到 1（是）。
</ResponseField>

```json Example response focus={4-7} theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "is_urgent": {
      "type": "noul",
      "noul": 0.95
    }
  },
  "usage": { "input_tokens": 307, "output_tokens": 20 }
}
```

### Choice 答案

<ResponseField name="type" type="&#x22;choice&#x22;" required />

<ResponseField name="choice" type="string" required>
  概率最高的选项。
</ResponseField>

<ResponseField name="probabilities" type="map<string, number>" required>
  每个选项映射到其概率（浮点数，总和为 1）。

  <Expandable title="map entries">
    <ResponseField name="‹option›" type="number">
      你在 criteria 中定义的选项。
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="confidence" type="number" required>
  模型的确定程度，由概率推导而来。
</ResponseField>

```json Example response focus={4-9} theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "billing",
      "probabilities": { "billing": 0.88, "technical": 0.12, "sales": 0.0 },
      "confidence": 0.81
    }
  },
  "usage": { "input_tokens": 318, "output_tokens": 34 }
}
```

### Score 答案

<ResponseField name="type" type="&#x22;score&#x22;" required />

<ResponseField name="score" type="number" required>
  各档位上的概率加权答案；可以落在档位之间。
</ResponseField>

<ResponseField name="legend" type="map<string, string>" required>
  每个档位编号映射回其描述。
</ResponseField>

<ResponseField name="probabilities" type="map<string, number>" required>
  每个档位（字符串键）映射到其概率（浮点数，总和为 1）。

  <Expandable title="map entries">
    <ResponseField name="‹level›" type="number">
      档位索引，与 legend 匹配的字符串键。
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="confidence" type="number" required>
  模型的确定程度，由概率推导而来。
</ResponseField>

```json Example response focus={4-10} theme={null}
{
  "model": "jev-1.13.0",
  "answers": {
    "frustration": {
      "type": "score",
      "score": 1.05,
      "legend": { "0": "Calm", "1": "Frustrated", "2": "Very angry" },
      "probabilities": { "0": 0.0, "1": 0.95, "2": 0.05 },
      "confidence": 0.92
    }
  },
  "usage": { "input_tokens": 304, "output_tokens": 18 }
}
```

## 错误

错误使用标准 HTTP 状态码，附带描述问题所在的 JSON 响应体。

| 状态码                      | 含义                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `401 Unauthorized`         | API 密钥缺失或无效。检查 `Authorization` 头。                                                                                             |
| `422 Unprocessable Entity` | 请求体验证失败——例如缺少必填字段或问题格式错误。响应体会指出问题字段。                                                                    |
| `429 Too Many Requests`    | 超出速率限制。退避一会儿再重试。                                                                                                          |
| `529 Overloaded`           | TypeSafe 暂时过载。稍等片刻后重试。                                                                                                      |

### 处理速率限制

收到 `429 Too Many Requests` 或 `529 Overloaded` 响应时，应以指数退避重试而非立即重试。我们的客户端 SDK 会自动处理，因此如果你使用我们的 SDK 及其默认重试策略，无需额外处理。
