# AI 入门

> 为什么 TypeSafe 训练的是带校准概率的决策模型，而不是为生成文本做优化。

大多数 AI 产品围绕模型与人之间的对话构建。TypeSafe 从一个不同的赌注出发：大规模自动化将由 AI 与 AI、AI 与软件的交互主导，因此机器接口比聊天接口更重要。

> **我们称之为 Machine Native Intelligence（机器原生智能）：**
>
> 具备软件般特性的 AI——结构化、可靠、可观测、可测试、快速、一致且低成本。

## 构建生产系统，而不是万能之神

TypeSafe 并不试图构建一个无所不能的模型。它为生产系统而设计：代码需要一个狭窄、可检查、可执行的决策。

我们预期，大规模 AI 自动化将更接近 99% 的机器对机器交互和 1% 的人机交互。这将设计目标从"读起来令人愉悦的回复"转向"在软件中行为可预测的输出"。

阅读 [TypeSafe 宣言](https://typesafe.ai/manifesto)。

## 三种后训练路线

预训练语言模型已有两种主要的适配方式，TypeSafe 增加了第三种。此处展示 RLHF 和 RLVR 作为背景对照；TypeSafe 的训练路线是 RLCD。

<Columns cols={3}>
  <Card title="RLHF" icon="messages-square" type="note">
    **基于人类反馈的强化学习**（Reinforcement learning from human feedback）把预训练模型变成了聊天机器人。它训练模型产生人类偏好的回复。
  </Card>

  <Card title="RLVR" icon="brain-circuit" type="note">
    **基于可验证奖励的强化学习**（Reinforcement learning with verifiable rewards）造就了在数学等任务上很强、但更慢更贵的推理模型。
  </Card>

  <Card title="RLCD" icon="binary" type="tip">
    **面向校准决策的强化学习**（Reinforcement learning for calibrated decisions）训练 TypeSafe 返回决策和校准概率，而非生成文本。
  </Card>
</Columns>

RLHF 曾用于训练 InstructGPT 和 ChatGPT，并由 TypeSafe 联合创始人 [Diogo Almeida](https://scholar.google.com/citations?user=0T4y07QAAAAJ\&hl=en) 共同发明。

<Frame>
  <img className="block dark:hidden" src="https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/ai-primer/training-paths-light.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=61898215ac31388d3be15bf583b743ee" alt="Pretrained language models branch into muted RLHF and RLVR paths and an emphasized RLCD decision-model path." width="2048" height="810" data-path="images/ai-primer/training-paths-light.webp" />

  <img className="hidden dark:block" src="https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/ai-primer/training-paths-dark.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=2747633edb0e54fa3f14a8aba830f4fd" alt="Pretrained language models branch into muted RLHF and RLVR paths and an emphasized RLCD decision-model path." width="2048" height="810" data-path="images/ai-primer/training-paths-dark.webp" />
</Frame>

## RLCD 与校准决策

RLCD 针对一种不同的输出契约做优化：

* 模型不生成文本。
* 它返回决策和概率。
* 更高的概率应对应答案正确的更大可能性。

校准让不确定性变得可被软件使用。对于一个校准良好的模型的大量预测：

* 被赋以 `0.2` 概率的结果，应该在约 20% 的情况下发生。
* 被赋以 `0.8` 概率的结果，应该在约 80% 的情况下发生。
* 被赋以 `1.0` 概率的结果，应该 100% 发生。

这些比率描述的是预测群体，而不是对任何单个答案的保证。何时让软件执行、何时上报人工的指引见[置信度](/confidence)。

## RLHF 的问题

RLHF 教会模型说人们偏好的话。这个目标对聊天机器人很有效，但它也可能奖励谄媚和听起来自信的幻觉。

偏好优化还会导致 **mode dropping（模式丢弃）**：模型学会偏好某种特定风格（如遵循指令），同时降低其他可能输出的概率。

<Frame>
  <img className="block dark:hidden" src="https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/ai-primer/mode-dropping-light.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=d51758a6212b526fc243cc9a81572cc7" alt="The probability distribution of a base model compared with a narrowed, mode-dropped distribution after RLHF." width="2048" height="1117" data-path="images/ai-primer/mode-dropping-light.webp" />

  <img className="hidden dark:block" src="https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/ai-primer/mode-dropping-dark.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=4330e6251ca335515a61f61794f21389" alt="The probability distribution of a base model compared with a narrowed, mode-dropped distribution after RLHF." width="2048" height="1117" data-path="images/ai-primer/mode-dropping-dark.webp" />
</Frame>

<Warning>
  一个输出可以对人极具说服力，却不足以支撑无人值守的自动化。人类偏好和机器可信度是不同的优化目标。
</Warning>

Mode dropping 是 **mode collapse（模式坍缩）** 的温和版本。在生成对抗网络的经典失败模式中，生成器学会反复产出同类输出，因为这种输出能持续骗过判别器。

<Accordion title="模式坍缩类比">
  <Frame>
    <img className="block dark:hidden" src="https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/ai-primer/mode-collapse-light.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=2896f125ad1a5835b31b088fbc64eff1" alt="Repeated characters illustrate a GAN suffering from mode collapse." width="1084" height="759" data-path="images/ai-primer/mode-collapse-light.webp" />

    <img className="hidden dark:block" src="https://mintcdn.com/ts-docs/aFVnpmCIX68NpsV1/images/ai-primer/mode-collapse-dark.webp?fit=max&auto=format&n=aFVnpmCIX68NpsV1&q=85&s=95645bdefd0bb3fa093edc3dd9308337" alt="Repeated characters illustrate a GAN suffering from mode collapse." width="1084" height="759" data-path="images/ai-primer/mode-collapse-dark.webp" />
  </Frame>
</Accordion>

RLHF 仍然适合对话式模型。TypeSafe 的立场是：生产自动化需要一个不同的训练目标——一个以受约束决策和校准不确定性为核心的目标。
