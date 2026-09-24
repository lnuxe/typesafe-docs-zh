# 置信度

> TypeSafe 如何报告确定性，它与概率有何不同，以及如何用它控制系统的行为。

export function ConfidenceExplorer() {
  const [probabilities, setProbabilities] = useState([90, 6, 4]);
  const options = ["A", "B", "C"];
  function changeProbability(index, value) {
    setProbabilities(current => {
      const others = [0, 1, 2].filter(i => i !== index);
      const remaining = 100 - value;
      const previousRemaining = current[others[0]] + current[others[1]];
      const next = [...current];
      next[index] = value;
      next[others[0]] = previousRemaining > 0 ? remaining * current[others[0]] / previousRemaining : remaining / 2;
      next[others[1]] = remaining - next[others[0]];
      return next;
    });
  }
  function formatProbability(value) {
    if (Math.abs(value - 100 / 3) < 0.000001) return "33⅓%";
    return `${Number(value.toFixed(1))}%`;
  }
  function choiceConfidence(values) {
    const count = values.length;
    const peak = Math.max(...values) / 100;
    return Math.max(0, Math.min(1, (count * peak - 1) / (count - 1)));
  }
  const confidence = choiceConfidence(probabilities);
  const maximum = Math.max(...probabilities);
  const winners = options.filter((option, i) => Math.abs(probabilities[i] - maximum) < 0.000001);
  const selected = winners.length === 1 ? `Option ${winners[0]}` : `Tie: ${winners.join(", ")}`;
  const buttonClass = "border px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500";
  const buttonStyle = {
    borderColor: "#71717a"
  };
  const eyebrow = {
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase"
  };
  return <section aria-label="Explore probabilities and confidence" className="not-prose my-6 border border-zinc-300 dark:border-zinc-700 p-5 sm:p-6 text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-zinc-600 dark:text-zinc-400" style={eyebrow}>Choice question with three options</div>
          <div className="mt-2 text-base font-semibold">See how probability distribution changes confidence</div>
        </div>
        <div className="text-right" role="status" aria-live="polite" aria-atomic="true">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Confidence</div>
          <output className="block text-3xl font-semibold tabular-nums" style={{
    color: "#E551BA"
  }}>
            {confidence.toFixed(2)}
          </output>
        </div>
      </div>

      <div role="img" aria-label={`Probability distribution: ${options.map((option, i) => `${option} ${formatProbability(probabilities[i])}`).join(", ")}. ${selected}.`} className="my-6">
        <div className="text-xs text-zinc-600 dark:text-zinc-400">Probability</div>
        <div aria-hidden="true" style={{
    position: "relative",
    height: "180px",
    margin: "34px 0 36px 44px"
  }}>
          {[0, 50, 100].map(tick => <div key={tick} style={{
    position: "absolute",
    bottom: `${tick}%`,
    width: "100%",
    borderBottom: "1px solid",
    borderColor: "color-mix(in srgb, currentColor 18%, transparent)"
  }}>
              <span className="text-xs" style={{
    position: "absolute",
    right: "calc(100% + 8px)",
    transform: "translateY(-50%)"
  }}>{tick}%</span>
            </div>)}
          <div style={{
    position: "absolute",
    inset: 0,
    display: "flex",
    justifyContent: "space-around",
    alignItems: "flex-end"
  }}>
            {options.map((option, index) => <div key={option} style={{
    position: "relative",
    width: "21%",
    height: `${probabilities[index]}%`
  }}>
                <span className="text-sm font-semibold tabular-nums" style={{
    position: "absolute",
    bottom: "calc(100% + 6px)",
    left: "50%",
    transform: "translateX(-50%)",
    whiteSpace: "nowrap"
  }}>{formatProbability(probabilities[index])}</span>
                <div style={{
    height: "100%",
    background: winners.length === 1 && winners[0] === option ? "#E551BA" : "currentColor",
    opacity: winners.length === 1 && winners[0] === option ? 1 : 0.45
  }} />
                <span className="text-sm" style={{
    position: "absolute",
    top: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)"
  }}>{option}</span>
              </div>)}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => <label key={option} className="flex items-center gap-3 text-sm">
            <span className="w-5 font-semibold">{option}</span>
            <input type="range" min="0" max="100" step="1" value={probabilities[index]} onChange={event => changeProbability(index, Number(event.target.value))} aria-label={`Probability of ${option}`} aria-valuetext={formatProbability(probabilities[index])} className="min-w-0 flex-1 cursor-pointer" style={{
    accentColor: "#E551BA",
    minHeight: "44px"
  }} />
            <output className="w-16 text-right tabular-nums">{formatProbability(probabilities[index])}</output>
          </label>)}
      </div>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Move a slider to change an option's probability. The other probabilities adjust to keep the total at 100%.</p>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Example distributions">
        <button type="button" className={buttonClass} style={buttonStyle} onClick={() => setProbabilities([90, 6, 4])}>Clear winner</button>
        <button type="button" className={buttonClass} style={buttonStyle} onClick={() => setProbabilities([40, 33, 27])}>Spread out</button>
        <button type="button" className={buttonClass} style={buttonStyle} onClick={() => setProbabilities([100 / 3, 100 / 3, 100 / 3])}>Even split</button>
      </div>
      <div className="mt-4 text-sm" aria-live="polite">{winners.length === 1 ? `Selected: ${selected}` : selected}</div>
      <details className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        <summary className="cursor-pointer">How this demo calculates Confidence</summary>
        <p className="mt-3">TypeSafe computes confidence from how the probability is spread across the options. All of it on one option gives 1.0; the more evenly it spreads, the lower the confidence. This demo uses <code>(3 × largest probability − 1) / 2</code> to approximate confidence for three options.</p>
      </details>
    </section>;
}

TypeSafe 的所有 Score 和 Choice 答案都包含一个 `probabilities` 属性，表示各选项（Choice）或各档位（Score）上的概率分布。这个分布的*形状*告诉你模型有多确定：集中在一个结果上意味着自信的答案，摊开则意味着不确定。

答案的 `confidence` 属性把那个形状折叠成一个 0 到 1 的数，你可以直接对它设阈值而不必自己计算。（Noul 答案没有这个属性。）

## 置信度由概率推导而来

`confidence` 是从答案已经给出的概率分布计算出的统计量。TypeSafe 替你算好并在每个 Choice 和 Score 答案上返回，常见场景下你无需额外工作。

<ConfidenceExplorer />

<Note>
  **一个可靠的默认值：** 我们提供的 `confidence` 是适合大多数用例的便利度量，但你并不被我们的定义锁定。根据你评估的内容，别的度量可能更合适——这正是我们在响应中给出完整 `probabilities` 的原因。不同计算方式的利弊是一个专门话题，我们会放在单独的 cookbook 中而非本页，届时会在此添加链接！
</Note>

对于 [Choice](/primitives/choice)，分布是你的选项上的 `probabilities`。对于 [Score](/primitives/score)，是你的档位上的分布。两种情况下，分布越平坦置信度越低：Choice 的低置信度通常意味着没有哪个选项明显胜出，Score 的低置信度通常意味着档位含糊、多维度，或状态中缺少可依据的信息。

## "我不知道"是有用的信号

如果一个智能系统——无论人还是机器——无法表达诚实的不确定性，这个系统就无法被信任。

置信度为模型提供了一个内置机制来表达"我对这个不太确定"。这让你的代码可以针对不同确定程度实现不同行为，这是构建真正可信赖系统的基础。

## 在代码中使用置信度的三条路径

一个有用的起步模式是把置信度分成三段，每段产生不同的系统行为：

**高置信度：** 自动执行。模型读得很清楚，你可以无需人工介入继续。

**中等置信度：** 谨慎进行。模型有一个合理但不确定的答案。视上下文而定，你可以要求用户确认、标记待审核，或先收集更多信息再行动。

**低置信度：** 不要行动。转给人工、请求澄清，或回退到别的系统。模型在告诉你它信息不足，或这个问题不合适。

界线画在哪里，取决于风险大小。

## 阈值随风险伸缩

置信度阈值不是单一的数字。同一系统内不同的行动，应根据出错的后果设在不同门槛上。

```python theme={null}
response = client.system_one(
    state=user_message,
    questions={
        "action": Choice(
            instructions="What is the user trying to do?",
            criteria={
                "check_balance": "View account balance",
                "approve_transfer": "Approve the pending withdrawal request",
                "support": "Get help with an issue",
            },
        ),
    },
)

action = response.answers["action"]
confidence = action.confidence

if confidence < 0.5:
    # 模型是真的不确定。不要猜。
    route_to_human(user_message)

elif action.choice == "check_balance":
    # 低风险。显示错屏幕是可以挽回的。
    show_balance(account_id)

elif action.choice == "approve_transfer":
    if confidence > 0.9:
        # 高风险，高置信度。确认后执行。
        confirm_then_execute(account_id)
    else:
        # 高风险，中等置信度。先核实。
        ask_user_to_confirm(account_id)
```

0.5 的置信度下限兜住了模型真正不确定的一切。在此之上，无需确认即可行动的门槛，破坏性操作要高于只读操作。你的代码承载了风险容忍度。

<Note>
  正确的阈值取决于你的领域和模型在你的用例上的表现。从保守的阈值开始，用你自己的数据测试，并根据观察到的结果调整。
</Note>
