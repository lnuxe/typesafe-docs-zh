# 智能体技能

> 可直接装进 Claude Code、Codex 等智能体环境的技能包。

TypeSafe 智能体技能为你的 AI 编码智能体补上 TypeSafe API 的完整上下文：三种问题[类型](/primitives)、架构[模式](/patterns)，以及组织评估的最佳实践。

## 安装

<Tabs>
  <Tab title="Claude Code">
    在终端里运行这两条命令：

    ```bash theme={null}
    claude plugin marketplace add typesafe-ai/skills
    claude plugin install typesafe@typesafe-ai
    ```
  </Tab>

  <Tab title="其他智能体">
    ```bash theme={null}
    npx skills add typesafe-ai/skills --skill typesafe-ai
    ```

    提示时选择你在用的智能体。默认装到当前项目；加 `-g` 装到全局。
  </Tab>

  <Tab title="复制给智能体">
    把下面这段提示词粘贴给你的编码智能体：

    ```text wrap theme={null}
    Install the TypeSafe skill. If you're in Claude Code, run `claude plugin marketplace add typesafe-ai/skills`, then `claude plugin install typesafe@typesafe-ai`. If you're in another agent, run `npx skills add typesafe-ai/skills --skill typesafe-ai` and select your agent. Use one installation method. You can read the skill directly at https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md (raw: https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md). Then use the TypeSafe skill when working on this project.
    ```
  </Tab>
</Tabs>

也可以直接读 GitHub 上的 [SKILL.md](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md)，或直接取[原始 Markdown](https://raw.githubusercontent.com/typesafe-ai/skills/main/skills/typesafe-ai/SKILL.md)。手动安装时，把整个 [skills/typesafe-ai 目录](https://github.com/typesafe-ai/skills/tree/main/skills/typesafe-ai)（含其中的参考文件）复制进你的智能体的 skills 目录。

只选一种安装方式，避免装上重复的副本。

### 更新

Claude Code 插件这样更新：

```bash theme={null}
claude plugin marketplace update typesafe-ai
claude plugin update typesafe@typesafe-ai
```

重启 Claude Code，或运行 `/reload-plugins` 加载更新。想开启自动更新，打开 `/plugin`，选择 **Marketplaces → typesafe-ai → Enable auto-update**。

用 skills.sh 安装的，运行 `npx skills update`。手动复制的，用 GitHub 上的最新版本整个替换技能目录。

## 提示词示例

在提示词里点名技能——写「use the TypeSafe skill」——在任何智能体里都管用，所以下面每段提示词都这么写。装了 Claude Code 插件之后，也可以直接调用 `/typesafe:typesafe-ai`。

* 起步推荐用一段头脑风暴式提示词，让它帮你想清楚项目里哪些地方最适合用 TypeSafe。

  ```text theme={null}
  Using the TypeSafe skill, explore the project and find opportunities for using
  intelligent judgement to stand in for complex parsing or other fragile code.
  ```

* 也可以创建一个 [API 密钥](https://console.typesafe.ai/keys)，允许智能体跑一些便宜的测试查询，自己摸索出最合适的用法。

  ```text theme={null}
  Using the TypeSafe skill, run some experiments using the TypeSafe API key that I've
  exported to `TYPESAFE_API_KEY`. Propose changes based on the most promising results.
  ```

* 把某个能解决你代码库里具体问题的 [cookbook](/cookbooks/consistency_noul_cookbook) 指给智能体，或者把它指到 [cookbook 索引](/cookbooks)，让它看看有没有跟你项目里相似的模式。

  ```text theme={null}
  Using the TypeSafe skill, analyze my code and see if there are any applicable
  cookbooks (https://console.typesafe.ai/docs/cookbooks) that show how I could
  refactor my code to be less fragile or complex.
  ```

## 好的 vibe coding 原则

1. 以上面的提示词示例为起点，和智能体把需求聊清楚。
2. 动手前先看方案，确认它讲得通。
3. 把常量（问题和阈值）集中放在一处，方便审阅。智能体写问题写得不怎么样，做好和它一起改的准备。
4. 不要照单全收它的结论，让它自己去验证假设。

## 常见问题

### 智能体没有用这个技能

装了 Claude Code 插件就直接调用 `/typesafe:typesafe-ai`；其他智能体里让它「use the TypeSafe skill」。还是不加载的话，确认安装时选的是你现在用的那个智能体，然后重启它。

### 路由的表现和预期不符

先看问题和阈值。可能是阈值设高了（产生漏判），也可能是设低了（产生误判）。也可能需要把问题改得更具体。

### 到处都在用置信度阈值

如果你只关心选出最好的那个选项，直接选置信度最高的就行，不必再设置信度阈值。如果你心里有具体的统计算法，那多半该用概率，而不是置信度。

### TypeSafe 代码不好审阅

最需要人审的是 TypeSafe 代码里的问题和阈值常量。把它们定义在同一个代码文件里，不用到处翻就能找到。

### 智能体会编造请求或响应字段

技能版本太旧会导致这种情况。按上面的安装方式更新技能，然后重试。
