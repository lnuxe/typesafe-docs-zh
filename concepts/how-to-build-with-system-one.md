# 如何用 TypeSafe 构建

> 把控制权留在代码手里，只把狭窄、结构化的决策交给 System One，以此设计 AI 驱动的软件。

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

System One 是 TypeSafe 用来构建 AI 驱动软件（而不是智能体）的模型。它不生成代码，也不自己决定下一步做什么。它提供能嵌进软件的原语，因此控制权始终在代码手里，模型只负责对非结构化数据做常识性判断。

<Info>
  **小结：** 搭一个普通的软件工作流，只在需要 AI 的地方插入 System One。

  * 控制流、确定性规则和副作用都留在代码里。
  * 把宽泛的判断拆成狭窄、类型化的问题，并写明指令和判据。
  * 每个问题只给需要的上下文。
  * 用概率分布和置信度来决定执行、请求复核，还是上报人工。
  * 把互相独立的问题放在一起问，然后在代码里组合它们的答案。
</Info>

## 三种软件架构

TypeSafe 是为构建**AI 驱动的软件**而设计的：工作流归代码所有，AI 只负责狭窄、结构化的决策。

<Tabs>
  <Tab title="传统软件">
    传统代码是用简单的软件原语搭出来的复杂决策树。因为每个原语都可靠，开发者才可以把它们组合成更高层的抽象。
  </Tab>

  <Tab title="LLM 智能体">
    智能体会处理指令并自己选择下一步。有人在盯着流程时这样做没问题，但每多一次循环，就多一次跑偏的机会。
  </Tab>

  <Tab title="AI 驱动的软件">
    代码负责确定性工作，掌握控制流。模型只出现在系统需要可编程的常识、或者需要理解非结构化数据的地方。每个 AI 任务都保持原子化、受约束。
  </Tab>
</Tabs>

<Frame>
  <img className="block dark:hidden" src="https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/how-to-build-with-typesafe/software-architectures-light.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=35c7622176190d1b1f19dc712f2fbf11" alt="Traditional software, agents, and AI-powered software shown as three different system architectures." width="2048" height="1117" data-path="images/how-to-build-with-typesafe/software-architectures-light.webp" />

  <img className="hidden dark:block" src="https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/how-to-build-with-typesafe/software-architectures-dark.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=8e6c2c73bdd4c9b541c4f9294bd829b5" alt="Traditional software, agents, and AI-powered software shown as three different system architectures." width="2048" height="1117" data-path="images/how-to-build-with-typesafe/software-architectures-dark.webp" />
</Frame>

## System One 为什么可组合

<Columns cols={2}>
  <Card title="结构化" icon="braces">
    System One 在构造上就是类型安全的。决策和概率符合你代码期望的结构化软件类型与 JSON schema，因此不必再从生成的散文里把值捞回来。
  </Card>

  <Card title="并行" icon="split">
    问题被独立、并行地评估。一个原语的结果不会变成隐藏上下文，去改变另一个原语的结果。
  </Card>

  <Card title="可比较" icon="arrow-up-down">
    输出可以排序，能驱动更聪明的 `if` 语句、阈值和比较。
  </Card>

  <Card title="快" icon="gauge">
    大多数查询在 100 ms 左右返回。System One 快到足以用在实时请求链路和用户界面上。
  </Card>

  <Card title="校准的置信度" icon="chart-no-axes-combined">
    [RLCD](/introduction/machine-learning-primer) 用校准后的概率表达不确定性，而不是倾向于过度自信。
  </Card>

  <Card title="自一致性" icon="repeat-2">
    System One 的设计目标是在反复评估同一输入时给出稳定的答案。见[自一致性 cookbook](/cookbooks/consistency_noul_cookbook)。
  </Card>
</Columns>

因为每个输出都被限制在给定的选项内，模型返回的是这些选项上的完整概率分布，而不是凭空造出 schema 之外的值。TypeSafe 的目标是让智能与速度、成本的比值超过 100×；背后的赌注是：更便宜的智能会带来大得多的需求。

## 设计 System One 工作流

<Steps titleSize="h3">
  <Step title="能用代码就用代码">
    确定性工作留在代码里：可靠，而且便宜。软件工作流能表达同样的行为时，就不要用智能体的 `while` 循环。

    <Accordion title="示例：把确定性规则留在代码里">
      ```python theme={null}
      days_overdue = (today - invoice.due_date).days

      if days_overdue > 30:
          route_to_collections(invoice)
      ```
    </Accordion>

    如何以有边界的方式把模型决策与代码组合起来，见 [System One 模式](/patterns)。
  </Step>

  <Step title="拆解输入状态">
    只包含与当前问题相关的上下文。这能帮模型避开干扰和上下文腐烂。当前信息能从你自己的知识库拿到时，就不要依赖存在模型权重里的知识。

    <Accordion title="示例：只发送相关的上下文">
      <TypesafeExample
        title="request"
        display="request"
        example={{
      state: {
        ticket_message: 'My flight was cancelled. Can I get a refund?',
        refund_policy: 'Cancelled flights are eligible for a full refund.',
      },
      selectedModels: ['jev-latest'],
      questions: {
        policy_supports_refund: {
          type: 'noul',
          instructions:
            'Does the refund policy support the refund requested in the ticket?',
        },
      },
    }}
      />
    </Accordion>
  </Step>

  <Step title="在输入状态里使用结构">
    `state` 和 `questions` 字段都用嵌套 JSON。当指向具体值能消除歧义时，就让问题指向具体值，并在问题里给每个路径加上反引号。

    <Accordion title="示例：引用一个嵌套值">
      用带反引号的点号加下标路径，让问题指向某个具体的嵌套值，例如 `support.tickets[0].message`。

      <TypesafeExample
        title="request"
        display="request"
        example={{
      state: {
        support: {
          tickets: [
            { message: 'I was charged twice for order A-104.' },
            { message: 'How do I reset my password?' },
          ],
        },
        commerce: {
          orders: [
            {
              id: 'A-104',
              charges: [
                { amount_usd: 49, status: 'captured' },
                { amount_usd: 49, status: 'captured' },
              ],
            },
          ],
        },
        account: {
          security: {
            password_reset:
              'Email a reset link to the address on file.',
          },
        },
      },
      selectedModels: ['jev-latest'],
      questions: {
        duplicate_charge: {
          type: 'noul',
          instructions:
            'Do `support.tickets[0].message` and `commerce.orders[0].charges` indicate a duplicate charge?',
        },
        password_reset_supported: {
          type: 'noul',
          instructions:
            'Can `account.security.password_reset` resolve the request in `support.tickets[1].message`?',
        },
      },
    }}
      />
    </Accordion>
  </Step>

  <Step title="拆解问题">
    尽量问最明确、最狭窄、最具体、最原子的问题。把复杂或定义不清的问题拆成各自只评估一个属性的独立问题。

    <Info>
      这大概是本指南最重要的概念。宽泛的问题把好几个判断藏在一个答案背后。原子化的问题把这些判断摊开，你就能在代码里检查、调优和组合它们。
    </Info>

    <Accordion title="示例：拆解垃圾邮件检测">
      <TypesafeExample
        title="一个宽泛的问题（差）"
        display="questions"
        example={{
      state: {
        message: {
          sender: {
            display_name: 'Acme Payroll',
            email: 'rewards@claim-bonus.example',
          },
          subject: 'Urgent: claim your employee bonus',
          body:
            'You have been selected for a $1,000 bonus. Confirm your payroll password today to receive it.',
          links: [
            {
              text: 'Claim bonus',
              url: 'http://claim-bonus.example/acme',
            },
          ],
        },
      },
      selectedModels: ['jev-latest'],
      questions: {
        is_spam: {
          type: 'noul',
          instructions: 'Is `message` spam?',
        },
      },
    }}
      />

      <TypesafeExample
        title="拆解后的问题（好）"
        display="questions"
        example={{
      state: {
        message: {
          sender: {
            display_name: 'Acme Payroll',
            email: 'rewards@claim-bonus.example',
          },
          subject: 'Urgent: claim your employee bonus',
          body:
            'You have been selected for a $1,000 bonus. Confirm your payroll password today to receive it.',
          links: [
            {
              text: 'Claim bonus',
              url: 'http://claim-bonus.example/acme',
            },
          ],
        },
      },
      selectedModels: ['jev-latest'],
      questions: {
        requests_credentials: {
          type: 'noul',
          instructions:
            'Does `message.body` ask the recipient to provide a password or other login credential?',
        },
        offers_unexpected_reward: {
          type: 'noul',
          instructions:
            'Does `message.body` claim the recipient received an unexpected prize, payment, or reward?',
        },
        creates_time_pressure: {
          type: 'noul',
          instructions:
            'Does `message.subject` or `message.body` pressure the recipient to act quickly?',
        },
        sender_identity_mismatch: {
          type: 'noul',
          instructions:
            'Does the organization named in `message.sender.display_name` conflict with the domain in `message.sender.email`?',
        },
        link_domain_mismatch: {
          type: 'noul',
          instructions:
            'Does the domain in `message.links[0].url` conflict with the organization named in `message.sender.display_name`?',
        },
        disguises_link_destination: {
          type: 'noul',
          instructions:
            'Does `message.links[0].text` conceal or misrepresent the destination in `message.links[0].url`?',
        },
      },
    }}
      />
    </Accordion>

    <Accordion title="示例：验证工具调用轨迹">
      <TypesafeExample
        title="一个宽泛的问题（差）"
        display="questions"
        example={{
      state: {
        request: {
          text: "What's the weather in Seattle tomorrow in Fahrenheit?",
          location: 'Seattle, WA',
          date: '2026-09-03',
          unit: 'fahrenheit',
        },
        available_tools: {
          geocode_city: {
            description: 'Resolve a city to latitude and longitude.',
            parameters: { city: 'string' },
          },
          get_weather: {
            description: 'Get the forecast for coordinates and a date.',
            parameters: {
              latitude: 'number',
              longitude: 'number',
              date: 'YYYY-MM-DD',
              unit: ['fahrenheit', 'celsius'],
            },
          },
        },
        trace: {
          tool_calls: [
            {
              id: 'call_1',
              name: 'geocode_city',
              arguments: { city: 'Seattle, WA' },
            },
            {
              id: 'call_2',
              name: 'get_weather',
              arguments: {
                latitude: 47.6062,
                longitude: -122.3321,
                date: '2026-09-03',
                unit: 'celsius',
              },
            },
          ],
          tool_results: [
            {
              tool_call_id: 'call_1',
              output: { latitude: 47.6062, longitude: -122.3321 },
            },
          ],
        },
      },
      selectedModels: ['jev-latest'],
      questions: {
        tool_calls_are_correct: {
          type: 'noul',
          instructions:
            'Is `trace.tool_calls` correct for `request` and `available_tools`?',
        },
      },
    }}
      />

      <TypesafeExample
        title="拆解后的问题（好）"
        display="questions"
        example={{
      state: {
        request: {
          text: "What's the weather in Seattle tomorrow in Fahrenheit?",
          location: 'Seattle, WA',
          date: '2026-09-03',
          unit: 'fahrenheit',
        },
        available_tools: {
          geocode_city: {
            description: 'Resolve a city to latitude and longitude.',
            parameters: { city: 'string' },
          },
          get_weather: {
            description: 'Get the forecast for coordinates and a date.',
            parameters: {
              latitude: 'number',
              longitude: 'number',
              date: 'YYYY-MM-DD',
              unit: ['fahrenheit', 'celsius'],
            },
          },
        },
        trace: {
          tool_calls: [
            {
              id: 'call_1',
              name: 'geocode_city',
              arguments: { city: 'Seattle, WA' },
            },
            {
              id: 'call_2',
              name: 'get_weather',
              arguments: {
                latitude: 47.6062,
                longitude: -122.3321,
                date: '2026-09-03',
                unit: 'celsius',
              },
            },
          ],
          tool_results: [
            {
              tool_call_id: 'call_1',
              output: { latitude: 47.6062, longitude: -122.3321 },
            },
          ],
        },
      },
      selectedModels: ['jev-latest'],
      questions: {
        geocode_tool_is_relevant: {
          type: 'noul',
          instructions:
            'Is `trace.tool_calls[0].name` an appropriate tool for resolving `request.location`?',
        },
        geocode_location_matches: {
          type: 'noul',
          instructions:
            'Does `trace.tool_calls[0].arguments.city` match `request.location`?',
        },
        geocode_arguments_match_schema: {
          type: 'noul',
          instructions:
            'Does `trace.tool_calls[0].arguments` conform to `available_tools.geocode_city.parameters`?',
        },
        geocode_result_matches_call: {
          type: 'noul',
          instructions:
            'Does `trace.tool_results[0].tool_call_id` match `trace.tool_calls[0].id`?',
        },
        weather_tool_is_relevant: {
          type: 'noul',
          instructions:
            'Is `trace.tool_calls[1].name` an appropriate tool for answering `request.text`?',
        },
        weather_arguments_match_schema: {
          type: 'noul',
          instructions:
            'Does `trace.tool_calls[1].arguments` conform to `available_tools.get_weather.parameters`?',
        },
        weather_uses_geocoded_coordinates: {
          type: 'noul',
          instructions:
            'Do the coordinates in `trace.tool_calls[1].arguments` match those in `trace.tool_results[0].output`?',
        },
        weather_date_matches: {
          type: 'noul',
          instructions:
            'Does `trace.tool_calls[1].arguments.date` match `request.date`?',
        },
        weather_unit_matches: {
          type: 'noul',
          instructions:
            'Does `trace.tool_calls[1].arguments.unit` match `request.unit`?',
        },
      },
    }}
      />
    </Accordion>
  </Step>

  <Step title="在问题里使用结构">
    问题写短一点。`instructions` 和 `criteria` 通常是字符串，对简短、无歧义的问题来说，字符串就够了。它们也可以是对象或数组。把问题放进一个字段，把指导这个问题的数据放进其他字段。

    结构在这些情况下有用：

    * 问题需要上下文或示例。一长句背景信息或一组示例输入，应该放进问题旁边有名字的字段里，这样代码可以增补或替换它们，而不必改写问题。
    * 问题的一部分来自你的代码。值来自数据库时，把它放进独立字段，而不是拼进字符串模板。
    * 多个问题的指令相似。一次请求接收一个状态，可以包含多个问题。补充数据有助于把这些问题区分开。

    <Accordion title="示例：引用来自你代码的一条记录">
      这个 Noul 把状态里的一份简历与候选人数据库里的一条记录做比较。记录原样放进 `potential_duplicate`，问题按名字引用它。

      <TypesafeExample
        title="questions"
        display="questions"
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
            potential_duplicate: { name: 'John Smith', location: 'Oakland, California', last_employer: 'Google' },
            question: 'Is the resume for the same person as `potential_duplicate`?',
          },
        },
      },
    }}
      />
    </Accordion>

    来自代码的 "potential\_duplicate" 数据会随时间变化。"question" 用反引号引用它。

    `criteria` 里的描述也可以是对象。对 Choice 来说，每个选项的描述可以是一个对象，说明这个选项涵盖什么、什么归别的选项，以及几个示例。各选项使用相同的字段名，模型就能直接比较它们。

    <Accordion title="示例：定义有对比性的 Choice 判据">
      <TypesafeExample
        title="questions"
        display="questions"
        example={{
      state: 'How many disposable virtual cards can I make per day?',
      selectedModels: ['jev-latest'],
      questions: {
        card_help_topic: {
          type: 'choice',
          instructions: {
            question:
              'Which disposable virtual card topic is the user asking about?',
            focus: 'Classify the information the user wants.',
          },
          criteria: {
            get_disposable_virtual_card: {
              what: 'Purpose, eligibility, or setup',
              not_for: 'Quantity, transaction, or merchant restrictions',
              examples: [
                'How can I get a disposable virtual card?',
                'What are disposable cards for?',
              ],
            },
            disposable_card_limits: {
              what: 'Quantity, transaction, or merchant restrictions',
              not_for: 'Purpose, eligibility, or setup',
              examples: [
                'How many disposable cards can I make per day?',
                'Where can I use a disposable card?',
              ],
            },
          },
        },
      },
    }}
      />
    </Accordion>

    每种问题类型的页面都有一个完整示例：

    * [Noul](/primitives/noul#structured-instructions) 把一份简历与多条候选人记录逐条比较，一条记录一个问题，问题在代码里构造。
    * [Choice](/primitives/choice#structured-instructions-and-criteria) 描述两个容易混淆的选项，分别说明各自涵盖什么、不适用于什么，并给出示例。
    * [Score](/primitives/score#structured-level-descriptions) 给每个档位配上描述和示例场景。

    [结构化数据抽取级联 cookbook](/cookbooks/sde_cascade) 展示了措辞共用的情形：对抽取出的记录里的每个字段，都问同一组问题。

    简短、无歧义的问题或判据可以保持字符串形式。当结构化能把原本会混在一起的指引分开时，就加上结构。结构可以用在哪些位置，完整清单见[进阶：结构化](/primitives/advanced)。
  </Step>

  <Step title="大量提问">
    在一次请求里，针对同一个状态问许多狭窄、独立的问题。这是用 API 把效果和每美元智能最大化的方式：问题并行执行，代码可以组合它们的信号，而不用增加串行的模型往返。

    见[推测性扇出模式](/patterns/fan-out)和[并行问题 cookbook](/cookbooks/parallel_questions)。
  </Step>

  <Step title="在代码里组合问题输出（或喂给经典 ML 模型）">
    用确定性规则或加权求和把互相独立的答案组合起来。要做基于学习的组合，就把概率当作特征，交给下游的经典机器学习模型。

    <Accordion title="示例：用加权分数组合信号">
      ```python theme={null}
      answers = response.answers

      # 把互相独立的信号组合成一个应用专属的分数。
      quality = (
          0.4 * answers["answers_request"].noul
          + 0.4 * answers["citations_are_supported"].noul
          + 0.2 * (1 - answers["contradicts_context"].noul)
      )
      ```
    </Accordion>

    [复合评分](/patterns/composite-scoring) 展示了如何在组合判断的同时保留每个判断。如果下游模型没有标签，可以用一组昂贵的推理模型来生成标签；[AutoResearch cookbook](/cookbooks/autoresearch_feature_discovery) 展示了如何用 System One 的输出训练经典模型。
  </Step>

  <Step title="按不确定性路由">
    让代码对置信度高和置信度低的答案采取不同动作。把不确定的案例上报给人工或更昂贵的推理模型。在你的数据上画置信度与准确率的对比图来测试阈值。

    <Accordion title="示例：按置信度路由">
      ```python theme={null}
      answer = response.answers["card_help_topic"]

      if answer.confidence < 0.8:
          route_to_human_review(ticket)
      else:
          route_to_handler(answer.choice, ticket)
      ```
    </Accordion>

    如何选择阈值，以及如何让阈值匹配每种动作的风险，见[置信度](/confidence)和[置信度门控路由](/patterns/confidence-routing)。
  </Step>
</Steps>

<Tip>
  拆解并不需要更多往返。针对同一个状态的问题并行执行。
</Tip>

## 全部串起来

这个客服工单工作流把确定性工作留在代码里，只发送相关的结构化上下文，在一次请求里评估许多原子问题，并用明确的置信度门控组合答案。

```python title="triage_ticket.py" theme={null}
from typesafe_sdk import Choice, Noul, NoulCriteria, Score, TypeSafeClient


def triage_ticket(ticket, customer):
    # 不调用模型就能处理的确定性情况。
    if ticket["status"] == "closed":
        return "no_action"

    open_orders = [
        order for order in customer["orders"] if order["status"] != "delivered"
    ]

    # 只包含下面这些问题需要的结构化上下文。
    state = {
        "ticket": {
            "message": ticket["message"],
            "sender": ticket["sender"],
            "links": ticket["links"],
        },
        "customer": {
            "plan": customer["plan"],
            "open_orders": open_orders,
        },
        "policy": {
            "sensitive_credentials": ["password", "security code", "API key"],
        },
    }

    # 把结构化、原子化的问题放在一起问，让它们并行执行。
    questions = {
        "topic": Choice(
            instructions={
                "question": "Which team should handle `ticket.message`?",
                "focus": "Classify the customer's primary request.",
            },
            criteria={
                "billing": {
                    "what": "Charges, invoices, refunds, or subscriptions",
                    "not_for": "Order tracking or account access",
                    "examples": ["I was charged twice", "Where is my refund?"],
                },
                "orders": {
                    "what": "Order status, delivery, cancellation, or returns",
                    "not_for": "Charges or account access",
                    "examples": ["Where is my order?", "Cancel my shipment"],
                },
                "account": {
                    "what": "Login, profile, permissions, or security",
                    "not_for": "Charges or order tracking",
                    "examples": ["Reset my password", "I cannot sign in"],
                },
            },
        ),
        "requests_credentials": Noul(
            instructions={
                "question": "Does the message request a sensitive credential?",
                "compare": [
                    "`ticket.message`",
                    "`policy.sensitive_credentials`",
                ],
                "focus": "Look for a request to disclose the credential itself.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Asks the recipient to disclose a listed credential",
                    "examples": [
                        "Reply with your password",
                        "Send us your API key",
                    ],
                },
                false={
                    "what": "Does not ask the recipient to disclose a credential",
                    "not_for": "A legitimate instruction to reset a credential",
                    "examples": ["Use this link to reset your password"],
                },
            ),
        ),
        "sender_identity_mismatch": Noul(
            instructions={
                "question": "Does the claimed sender identity conflict with its domain?",
                "compare": [
                    "`ticket.sender.display_name`",
                    "`ticket.sender.email`",
                ],
                "focus": "Compare the named organization with the email domain.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Claims an organization unrelated to the email domain",
                    "examples": ["Acme Payroll sent from claim-bonus.example"],
                },
                false={
                    "what": "The identity and domain agree or make no conflicting claim",
                    "examples": ["Acme Payroll sent from acme.example"],
                },
            ),
        ),
        "unexpected_reward": Noul(
            instructions={
                "question": "Does the message announce an unexpected reward?",
                "inspect": "`ticket.message`",
                "focus": "Look for an unsolicited prize, payment, or reward claim.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Announces an unrequested prize, payment, or reward",
                    "examples": ["You were selected for a $1,000 bonus"],
                },
                false={
                    "what": "Contains no reward claim or discusses an expected payment",
                    "not_for": "A customer asking about a known refund or payroll deposit",
                    "examples": ["When will my approved refund arrive?"],
                },
            ),
        ),
        "refund_requested": Noul(
            instructions={
                "question": "Does the customer explicitly request a refund or credit?",
                "inspect": "`ticket.message`",
                "focus": "Require a requested remedy, not a billing complaint alone.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Directly asks for money back or an account credit",
                    "examples": ["Please refund the duplicate charge"],
                },
                false={
                    "what": "Does not ask for a refund or credit",
                    "not_for": "A complaint or billing question without a requested remedy",
                    "examples": ["Why was I charged twice?"],
                },
            ),
        ),
        "mentions_open_order": Noul(
            instructions={
                "question": "Does the message refer to a supplied open order?",
                "compare": [
                    "`ticket.message`",
                    "`customer.open_orders`",
                ],
                "focus": "Match an order id or other identifying details.",
            },
            criteria=NoulCriteria(
                true={
                    "what": "Refers to an open order by id or identifying details",
                    "examples": ["Where is order A-104?"],
                },
                false={
                    "what": "Does not identify any supplied open order",
                    "not_for": "A generic order question with no matching details",
                    "examples": ["How long does shipping usually take?"],
                },
            ),
        ),
        "frustration": Score(
            instructions={
                "question": "How frustrated does the customer appear?",
                "inspect": "`ticket.message`",
                "focus": "Judge expressed frustration, not issue severity.",
            },
            criteria=[
                {
                    "what": "Calm and matter-of-fact",
                    "signals": ["Neutral wording", "No complaint about the experience"],
                },
                {
                    "what": "Frustrated but civil",
                    "signals": ["Expresses annoyance", "Remains constructive"],
                },
                {
                    "what": "Very angry or threatening to leave",
                    "signals": ["Hostile language", "Threatens cancellation or churn"],
                },
            ],
        ),
    }

    with TypeSafeClient() as client:
        response = client.system_one(
            state=state,
            questions=questions,
        )

    # 用代码控制的权重组合互相独立的垃圾邮件信号。
    answers = response.answers
    spam_risk = (
        0.45 * answers["requests_credentials"].noul
        + 0.30 * answers["sender_identity_mismatch"].noul
        + 0.25 * answers["unexpected_reward"].noul
    )

    # 判断不确定时上报，而不是猜。
    spam_is_uncertain = 0.4 < spam_risk < 0.6
    if spam_is_uncertain or answers["topic"].confidence < 0.75:
        return route_to_human_review(ticket)
    if spam_risk >= 0.6:
        return quarantine_as_spam(ticket)

    # 由代码决定这条路径上哪些推测性答案是有用的。
    if answers["topic"].choice == "billing":
        return route_to_billing(
            ticket,
            refund_requested=answers["refund_requested"].noul >= 0.7,
        )
    if answers["topic"].choice == "orders":
        return route_to_orders(
            ticket,
            mentions_open_order=answers["mentions_open_order"].noul >= 0.7,
        )

    priority = (
        "high"
        if answers["frustration"].confidence >= 0.7
        and answers["frustration"].score >= 1.5
        else "normal"
    )
    return route_to_account_support(ticket, priority=priority)
```
