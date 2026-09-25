# 问题类型

> 提供状态，用对象或字典提出是/否、Choice 和 Score 问题。

export function SdkSignature({children}) {
  async function copy(event) {
    const button = event.currentTarget;
    const code = button.parentElement.querySelector("pre code");
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.setAttribute("aria-label", "Signature copied");
      button.dataset.copied = "true";
    } catch {
      button.setAttribute("aria-label", "Copy failed; select the signature to copy");
    }
    setTimeout(() => {
      button.setAttribute("aria-label", "Copy signature");
      delete button.dataset.copied;
    }, 2000);
  }
  return <div className="sdk-signature not-prose">
      <button type="button" className="sdk-signature-copy" aria-label="Copy signature" onClick={copy}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
      <pre tabIndex={0} aria-label="SDK signature"><code>{children}</code></pre>
    </div>;
}

<a id="questions" />

<h2 id="state">
  状态
</h2>

`state` 是你要针对其提问的文本或 JSON 对象。它不能是 `None`，但对象内部的各个值可以是 `None`。

<h2 id="question-objects">
  问题对象
</h2>

用 `Noul`、`Choice` 和 `Score` 以具名参数定义问题。

<h2 id="typesafe_sdk.NoulCriteria">
  typesafe\_sdk.NoulCriteria
</h2>

基类：<code><a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.TypedDict">TypedDict</a></code>

对「是」和「否」两种结果的可选描述。

详见 [noul 原语](https://docs.typesafe.ai/primitives/noul)。

<h3 id="typesafe_sdk.NoulCriteria.true">
  true
</h3>

`instance-attribute`

<SdkSignature>
  <span className="n">
    {"true"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {"\n"}
</SdkSignature>

以文本、JSON 对象或数组给出的「是」结果描述；为 `None` 时不加描述。

<h3 id="typesafe_sdk.NoulCriteria.false">
  false
</h3>

`instance-attribute`

<SdkSignature>
  <span className="n">
    {"false"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {"\n"}
</SdkSignature>

以文本、JSON 对象或数组给出的「否」结果描述；为 `None` 时不加描述。

<h2 id="typesafe_sdk.Noul">
  typesafe\_sdk.Noul
</h2>

`pydantic-model`

基类：`_Question`, `wire.NoulQuestion`

一个是/否问题，可为任一结果提供可选描述。

详见 [noul 原语](https://docs.typesafe.ai/primitives/noul)。

<Note>
  **显示 JSON schema：**

  <Accordion title="详细信息" id="sdk-disclosure-1">
    ```json theme={null}
    {
      "$defs": {
        "JSONContent": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "additionalProperties": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "object"
            },
            {
              "items": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "array"
            }
          ]
        },
        "JSONValue": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "integer"
            },
            {
              "type": "number"
            },
            {
              "type": "boolean"
            },
            {
              "items": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "array"
            },
            {
              "additionalProperties": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "object"
            }
          ]
        },
        "NoulCriteria": {
          "additionalProperties": false,
          "description": "Optional descriptions of the yes and no outcomes.\n\nSee the [noul primitive](https://docs.typesafe.ai/primitives/noul) for details.",
          "properties": {
            "true": {
              "anyOf": [
                {
                  "$ref": "#/$defs/JSONContent"
                },
                {
                  "type": "null"
                }
              ]
            },
            "false": {
              "anyOf": [
                {
                  "$ref": "#/$defs/JSONContent"
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "title": "NoulCriteria",
          "type": "object"
        }
      },
      "additionalProperties": false,
      "description": "A yes/no question with optional descriptions for either outcome.\n\nSee the [noul primitive](https://docs.typesafe.ai/primitives/noul) for details.",
      "properties": {
        "type": {
          "const": "noul",
          "default": "noul",
          "title": "Type",
          "type": "string"
        },
        "instructions": {
          "anyOf": [
            {
              "$ref": "#/$defs/JSONContent"
            },
            {
              "type": "null"
            }
          ],
          "default": null
        },
        "criteria": {
          "anyOf": [
            {
              "$ref": "#/$defs/NoulCriteria"
            },
            {
              "type": "null"
            }
          ],
          "default": null
        }
      },
      "title": "Noul",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

字段：

* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['noul']</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Noul.instructions">instructions</a></code> (<code><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a> | None</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Noul.criteria">criteria</a></code> (<code><a href="/sdk/python/api/types/questions#typesafe_sdk.NoulCriteria">NoulCriteria</a> | None</code>)

<h3 id="typesafe_sdk.Noul.instructions">
  instructions
</h3>

`pydantic-field`

<SdkSignature>
  <span className="n">
    {"instructions"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {" "}

  <span className="o">
    {"="}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {"\n"}
</SdkSignature>

要提出的问题，以文本、JSON 对象或数组表示；可选。

<h3 id="typesafe_sdk.Noul.criteria">
  criteria
</h3>

`pydantic-field`

<SdkSignature>
  <span className="n">
    {"criteria"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/types/questions#typesafe_sdk.NoulCriteria">
      {"NoulCriteria"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {" "}

  <span className="o">
    {"="}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {"\n"}
</SdkSignature>

对「是」和「否」两种结果的可选描述。

<h2 id="typesafe_sdk.Choice">
  typesafe\_sdk.Choice
</h2>

`pydantic-model`

基类：`_Question`, `wire.ChoiceQuestion`

在具名选项之间做出选择的问题。

详见 [choice 原语](https://docs.typesafe.ai/primitives/choice)。

<Note>
  **显示 JSON schema：**

  <Accordion title="详细信息" id="sdk-disclosure-2">
    ```json theme={null}
    {
      "$defs": {
        "JSONContent": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "additionalProperties": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "object"
            },
            {
              "items": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "array"
            }
          ]
        },
        "JSONValue": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "integer"
            },
            {
              "type": "number"
            },
            {
              "type": "boolean"
            },
            {
              "items": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "array"
            },
            {
              "additionalProperties": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "object"
            }
          ]
        }
      },
      "additionalProperties": false,
      "description": "A question that selects between named alternatives.\n\nSee the [choice primitive](https://docs.typesafe.ai/primitives/choice) for details.",
      "properties": {
        "type": {
          "const": "choice",
          "default": "choice",
          "title": "Type",
          "type": "string"
        },
        "instructions": {
          "anyOf": [
            {
              "$ref": "#/$defs/JSONContent"
            },
            {
              "type": "null"
            }
          ],
          "default": null
        },
        "criteria": {
          "additionalProperties": {
            "anyOf": [
              {
                "$ref": "#/$defs/JSONContent"
              },
              {
                "type": "null"
              }
            ]
          },
          "title": "Criteria",
          "type": "object"
        }
      },
      "required": [
        "criteria"
      ],
      "title": "Choice",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

字段：

* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['choice']</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Choice.criteria">criteria</a></code> (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">Mapping</a>\[<a href="https://docs.python.org/3/builtins/stdtypes.html#str">str</a>, <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a> | None]</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Choice.instructions">instructions</a></code> (<code><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a> | None</code>)

<h3 id="typesafe_sdk.Choice.criteria">
  criteria
</h3>

`pydantic-field`

<SdkSignature>
  <span className="n">
    {"criteria"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">
      {"Mapping"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="n">
    <a href="https://docs.python.org/3/builtins/stdtypes.html#str">
      {"str"}
    </a>
  </span>

  <span className="p">
    {","}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

标签到文本、对象或数组描述的映射；未提供描述的标签用 `None`。

<h3 id="typesafe_sdk.Choice.instructions">
  instructions
</h3>

`pydantic-field`

<SdkSignature>
  <span className="n">
    {"instructions"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {" "}

  <span className="o">
    {"="}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {"\n"}
</SdkSignature>

要提出的问题，以文本、JSON 对象或数组表示；可选。

<h2 id="typesafe_sdk.Score">
  typesafe\_sdk.Score
</h2>

`pydantic-model`

基类：`_Question`, `wire.ScoreQuestion`

按有序量规给出分数的问题。

详见 [score 原语](https://docs.typesafe.ai/primitives/score)。

<Note>
  **显示 JSON schema：**

  <Accordion title="详细信息" id="sdk-disclosure-3">
    ```json theme={null}
    {
      "$defs": {
        "JSONContent": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "additionalProperties": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "object"
            },
            {
              "items": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "array"
            }
          ]
        },
        "JSONValue": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "integer"
            },
            {
              "type": "number"
            },
            {
              "type": "boolean"
            },
            {
              "items": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "array"
            },
            {
              "additionalProperties": {
                "anyOf": [
                  {
                    "$ref": "#/$defs/JSONValue"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "type": "object"
            }
          ]
        }
      },
      "additionalProperties": false,
      "description": "A question that assigns a score using an ordered rubric.\n\nSee the [score primitive](https://docs.typesafe.ai/primitives/score) for details.",
      "properties": {
        "type": {
          "const": "score",
          "default": "score",
          "title": "Type",
          "type": "string"
        },
        "instructions": {
          "anyOf": [
            {
              "$ref": "#/$defs/JSONContent"
            },
            {
              "type": "null"
            }
          ],
          "default": null
        },
        "criteria": {
          "items": {
            "$ref": "#/$defs/JSONContent"
          },
          "title": "Criteria",
          "type": "array"
        }
      },
      "required": [
        "criteria"
      ],
      "title": "Score",
      "type": "object"
    }
    ```
  </Accordion>
</Note>

字段：

* `type` (<code><a href="https://docs.python.org/3/library/typing.html#typing.Literal">Literal</a>\['score']</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Score.criteria">criteria</a></code> (<code><a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Sequence">Sequence</a>\[<a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a>]</code>)
* <code><a href="/sdk/python/api/types/questions#typesafe_sdk.Score.instructions">instructions</a></code> (<code><a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">JSONContent</a> | None</code>)

<h3 id="typesafe_sdk.Score.criteria">
  criteria
</h3>

`pydantic-field`

<SdkSignature>
  <span className="n">
    {"criteria"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Sequence">
      {"Sequence"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

非空且有序的描述列表，从 0 开始按分数索引，每项为文本、对象或数组。

<h3 id="typesafe_sdk.Score.instructions">
  instructions
</h3>

`pydantic-field`

<SdkSignature>
  <span className="n">
    {"instructions"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {" "}

  <span className="o">
    {"="}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  {"\n"}
</SdkSignature>

要提出的问题，以文本、JSON 对象或数组表示；可选。

<h2 id="typesafe_sdk.Question">
  typesafe\_sdk.Question
</h2>

`module-attribute`

<SdkSignature>
  <span className="n">{"Question"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/typing.html#typing.TypeAlias">{"TypeAlias"}</a></span>{" "}<span className="o">{"="}</span>{" "}<span className="p">{"("}</span>{"\n"}{"    "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.Noul">{"Noul"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.Choice">{"Choice"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.Score">{"Score"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.QuestionModel">{"QuestionModel"}</a></span>{"\n"}<span className="p">{")"}</span>{"\n"}
</SdkSignature>

问题对象或问题字典。

<h2 id="typesafe_sdk.Questions">
  typesafe\_sdk.Questions
</h2>

`module-attribute`

<SdkSignature>
  <span className="n">
    {"Questions"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://docs.python.org/3/library/typing.html#typing.TypeAlias">
      {"TypeAlias"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"="}
  </span>

  {" "}

  <span className="n">
    <a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">
      {"Mapping"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="n">
    <a href="https://docs.python.org/3/builtins/stdtypes.html#str">
      {"str"}
    </a>
  </span>

  <span className="p">
    {","}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/types/questions#typesafe_sdk.Question">
      {"Question"}
    </a>
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

以用于标识答案的名称为键的问题输入。

<h2 id="question-dictionaries">
  问题字典
</h2>

问题字典包含一个 `type` 键：`"noul"`、`"choice"` 或 `"score"`。你可以在同一个请求中混用字典和问题对象。

<h2 id="typesafe_sdk.NoulModel">
  typesafe\_sdk.NoulModel
</h2>

基类：<code><a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.TypedDict">TypedDict</a></code>

`type="noul"` 的是/否问题字典。

详见 [noul 原语](https://docs.typesafe.ai/primitives/noul)。

<h3 id="typesafe_sdk.NoulModel.type">
  type
</h3>

`instance-attribute`

<SdkSignature>
  <span className="nb">
    {"type"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://docs.python.org/3/library/typing.html#typing.Literal">
      {"Literal"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="s1">
    {"'noul'"}
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

<h3 id="typesafe_sdk.NoulModel.instructions">
  instructions
</h3>

`instance-attribute`

<SdkSignature>
  <span className="n">
    {"instructions"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.NotRequired">
      {"NotRequired"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

要提出的问题，以文本、JSON 对象或数组表示；可选。

<h3 id="typesafe_sdk.NoulModel.criteria">
  criteria
</h3>

`instance-attribute`

<SdkSignature>
  <span className="n">
    {"criteria"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.NotRequired">
      {"NotRequired"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="n">
    <a href="/sdk/python/api/types/questions#typesafe_sdk.NoulCriteria">
      {"NoulCriteria"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

对「是」和「否」两种结果的可选描述。

<h2 id="typesafe_sdk.ChoiceModel">
  typesafe\_sdk.ChoiceModel
</h2>

基类：<code><a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.TypedDict">TypedDict</a></code>

`type="choice"` 的 Choice 问题字典。

详见 [choice 原语](https://docs.typesafe.ai/primitives/choice)。

<h3 id="typesafe_sdk.ChoiceModel.type">
  type
</h3>

`instance-attribute`

<SdkSignature>
  <span className="nb">
    {"type"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://docs.python.org/3/library/typing.html#typing.Literal">
      {"Literal"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="s1">
    {"'choice'"}
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

<h3 id="typesafe_sdk.ChoiceModel.instructions">
  instructions
</h3>

`instance-attribute`

<SdkSignature>
  <span className="n">
    {"instructions"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.NotRequired">
      {"NotRequired"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

要提出的问题，以文本、JSON 对象或数组表示；可选。

<h3 id="typesafe_sdk.ChoiceModel.criteria">
  criteria
</h3>

`instance-attribute`

<SdkSignature>
  <span className="n">
    {"criteria"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Mapping">
      {"Mapping"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="n">
    <a href="https://docs.python.org/3/builtins/stdtypes.html#str">
      {"str"}
    </a>
  </span>

  <span className="p">
    {","}
  </span>

  {" "}

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

标签到文本、对象或数组描述的映射；未提供描述的标签用 `None`。

<h2 id="typesafe_sdk.ScoreModel">
  typesafe\_sdk.ScoreModel
</h2>

基类：<code><a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.TypedDict">TypedDict</a></code>

`type="score"` 的 Score 问题字典。

详见 [score 原语](https://docs.typesafe.ai/primitives/score)。

<h3 id="typesafe_sdk.ScoreModel.type">
  type
</h3>

`instance-attribute`

<SdkSignature>
  <span className="nb">
    {"type"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://docs.python.org/3/library/typing.html#typing.Literal">
      {"Literal"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="s1">
    {"'score'"}
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

<h3 id="typesafe_sdk.ScoreModel.instructions">
  instructions
</h3>

`instance-attribute`

<SdkSignature>
  <span className="n">
    {"instructions"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://typing-extensions.readthedocs.io/en/latest/index.html#typing_extensions.NotRequired">
      {"NotRequired"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  {" "}

  <span className="o">
    {"|"}
  </span>

  {" "}

  <span className="kc">
    {"None"}
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

要提出的问题，以文本、JSON 对象或数组表示；可选。

<h3 id="typesafe_sdk.ScoreModel.criteria">
  criteria
</h3>

`instance-attribute`

<SdkSignature>
  <span className="n">
    {"criteria"}
  </span>

  <span className="p">
    {":"}
  </span>

  {" "}

  <span className="n">
    <a href="https://docs.python.org/3/library/collections.abc.html#collections.abc.Sequence">
      {"Sequence"}
    </a>
  </span>

  <span className="p">
    {"["}
  </span>

  <span className="n">
    <a href="/sdk/python/api/types/common#typesafe_sdk.JSONContent">
      {"JSONContent"}
    </a>
  </span>

  <span className="p">
    {"]"}
  </span>

  {"\n"}
</SdkSignature>

非空且有序的描述列表，从 0 开始按分数索引，每项为文本、对象或数组。

<h2 id="typesafe_sdk.QuestionModel">
  typesafe\_sdk.QuestionModel
</h2>

`module-attribute`

<SdkSignature>
  <span className="n">{"QuestionModel"}</span><span className="p">{":"}</span>{" "}<span className="n"><a href="https://docs.python.org/3/library/typing.html#typing.TypeAlias">{"TypeAlias"}</a></span>{" "}<span className="o">{"="}</span>{" "}<span className="p">{"("}</span>{"\n"}{"    "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.NoulModel">{"NoulModel"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.ChoiceModel">{"ChoiceModel"}</a></span>{" "}<span className="o">{"|"}</span>{" "}<span className="n"><a href="/sdk/python/api/types/questions#typesafe_sdk.ScoreModel">{"ScoreModel"}</a></span>{"\n"}<span className="p">{")"}</span>{"\n"}
</SdkSignature>

由 `type` 键标识的问题字典。
