# 翻译工作流

本仓库是 [docs.typesafe.ai](https://docs.typesafe.ai) 的简体中文复刻站，用 Mintlify 构建。
这份文档说明中文页面怎么加、哪些东西一个字都不能动、以及怎么用审计器证明自己没搞坏东西。

所有操作都在仓库根目录执行。

## 目录与文件约定

* 仓库根目录就是 Mintlify 的内容根。一个页面 = 一个 `.md` 文件，**文件路径就是 slug**。
* `docs.json` 里的 `navigation` 引用页面时**不写扩展名**：`patterns/fan-out` 对应磁盘上的 `patterns/fan-out.md`。
  新增页面必须同时在 `docs.json` 里挂到合适的 group 下，否则页面不可达。
* `sdk/**` 是**自动生成的 API 参考**，上游重新生成时会被整份覆盖：**不要手工逐字翻译**。
  审计器把这一整片归类为 `generated`，不计入人工翻译覆盖率。要改文案就改上游生成器。
* `tools/` 下是审计工具与术语表；`README.md`、`TRANSLATING.md` 是仓库自身文档，
  审计器归为 `meta`，同样不计入站点覆盖率。
* 图片、`favicon.svg`、`logo_*.png` 是静态资源，原样保留。

## 绝对不能翻译的东西

翻译只改**正文和标题**。下面这些一律保持英文原样，一个字符都不要动：

| 类别 | 例子 | 说明 |
| ---- | ---- | ---- |
| 代码块内容 | 围栏里的 Python / TypeScript / JSON / bash | 只有**代码里的散文注释**可以翻，代码本身逐字节保留 |
| 行内代码 | `confidence`、`client.system_one(...)` | 反引号内的内容整体不动，包括字段名、枚举值、参数名 |
| API / SDK 名称 | `POST /v1/systemone`、`typesafe_sdk`、`TypeSafeClient` | HTTP 方法、路径、包名、类名 |
| 函数与标识符 | `client.system_one()`、`questions`、`refund_requested` | 包括问题 ID、变量名、常量名 |
| MDX / JSX 组件名与 props | `<Note>`、`<Tabs>`、`<Card>`、`cols={3}` | 组件名、属性名、属性里的代码一律不动；`title` / `description` 这类**展示文本属性的值**要翻译 |
| 链接与锚点 | `(/primitives/choice)`、`#ask-multiple-questions-together`、`{#anchor}` | URL、页面 slug、锚点 ID 都不译（即使标题已经译成中文） |
| 图片路径 | `![...](https://mintcdn.com/...)` | src 不动，alt 可留英文 |
| 文件路径与 CLI | `skills/typesafe-ai/SKILL.md`、`npx skills add ...`、`--skill` | 命令、参数、路径原样 |
| 模型与产品名 | `Jev`、`System One`、`Choice`、`Score`、`Noul`、`Playground`、`TypeSafe` | 品牌名不译；卡尼曼心理学意义上的 System 1 / System 2 例外，译作「系统 1 / 系统 2」 |
| front matter 的键 | `title:`、`description:` | **键不译，值要译**；`sidebarTitle` 等键与 `slug` 一律不动 |

判据很简单：**这句话被粘进代码或浏览器地址栏之后还能用吗？** 能用就说明它不该被翻。

## 术语

术语表在 `tools/glossary.yml`。每个词条给英文原词、推荐中文译名、禁用译法、理由，以及仓库里真实出现过的例句。

* `status: 沿用现有译法` 的条目**必须照抄**，它们已经在已译页面里定下来了（例如 confidence → 置信度、criteria → 判据、rubric → 量规）。
* `status: 保留英文` 的条目不要翻译，正文里原样写英文（例如 cookbook、Playground、System One）。
* 翻译时遇到反复出现、术语表里没有的词，**补进 glossary.yml**，格式照抄现有条目，例句必须是你刚翻的那句话（真实存在，不要编）。补完再跑一次审计器。
* 审计器会检查禁用译法是否出现在已翻译页面里，出现即失败。

## 语气与写法

对照 `introduction.md`、`primitives/choice.md`、`confidence.md` 这三篇，保持同一套说法。

* 简体中文技术文档语气，直白、说人话，不逐字直译英文语序。
* 不堆「我们」：英文的 "we recommend" 写成「建议」，不写「我们建议」。
* 术语首次出现可以「中文（English）」并列，例如「推测性扇出（speculative fan-out）」；**同一页后面只用中文**。
* 不添加英文原文里没有的内容，不加营销式吹捧，不补「总之」「众所周知」这类原文没有的话。
* 标题译成中文，但**标题的层级、顺序、数量必须和英文原文一模一样**。

## 结构保真

翻译时必须逐项保持：

* 标题层级与顺序（`#` / `##` / `###` 的数量与嵌套不能变）；
* 围栏代码块：数量、语言标记、内容逐字节一致，只有代码注释可翻；
* 表格：行列数、对齐行；
* 链接：目标不变，文字可译；纯锚点链接的锚点不变；
* 图片、`<Frame>` 这类容器组件；
* Mermaid 块：图定义里的节点 ID 与连线不能动，节点里的人类可读标签可译；
* 自定义锚点 `{#custom-anchor}`。

## 怎么跑审计器

审计器是零第三方依赖的 Python 脚本（`python3` 即可，装了 PyYAML 会自动用）。

```bash
# 人类可读摘要
python tools/i18n_audit.py

# CI 用：写完整 JSON 报告，出问题用退出码 1 失败
python tools/i18n_audit.py --strict --json i18n-report.json

# 有英文原文目录时，逐项比对结构
python tools/i18n_audit.py --source-dir ../typesafe-docs

# 与结构基线比对，检测结构回归
python tools/i18n_audit.py --baseline tools/structure-baseline.json
```

它报这些内容：

1. **覆盖率**：逐文件 CJK 占比与字数，分类为 已翻译 / 部分翻译 / 未翻译 / 索引页 / 自动生成（`sdk/**`）/ 仓库文档。
   阈值可调：`--untranslated-below`（默认 0.05）、`--translated-above`（默认 0.45）。
2. **混排残留**：已经是中文的文件里剩下的整段英文，给文件名 + 行号 + 原文。
   标题行和 `<Tab title="...">` 这类展示文本属性的值都会被检查。
3. **结构保真**：围栏代码块（含逐字节内容指纹）、行内代码、链接目标、图片、Mermaid、MDX 组件、标题层级、锚点、表格。
   有 `--source-dir` 时与英文原文逐项比对；没有时与 `tools/structure-baseline.json` 比对回归。
4. **导航覆盖**：`docs.json` 引用的每个页面是否存在于磁盘（死链），哪些导航条目还是英文。
5. **术语表合规**：禁用的译法有没有漏进来，术语表里的译名有没有真的在用。

### 结构基线

`tools/structure-baseline.json` 记录了每个在人工翻译范围内的文件的**结构指纹**。翻译前后结构必须一致，否则 `--strict` 直接失败。

* 正常情况下**不要**重新生成基线：它是防回归的锚点。
* 只有上游英文原文本身改了结构（加了代码块、改了链接）时，才重新生成：

```bash
python tools/i18n_audit.py --write-baseline tools/structure-baseline.json
```

重新生成等于承认结构变化是有意的，请在 commit message 里说明。

## 新增一个页面

1. 拿到英文原文，放到与英文站相同的路径，例如 `patterns/xyz.md`。
2. **先存基线**（此时文件还是英文，结构指纹就是「标准答案」）：

```bash
python tools/i18n_audit.py --write-baseline tools/structure-baseline.json
```

3. 翻译正文与标题，遵守上面的「绝对不能翻译」和「结构保真」。
4. 把页面挂进 `docs.json` 对应的 group（`pages` 里写不带扩展名的路径）。改完确认 JSON 仍然合法：

```bash
python -c "import json; json.load(open('docs.json', encoding='utf-8')); print('docs.json OK')"
```

5. 自查，必须 0 error（混排残留清零、术语表违规清零、结构回归清零）：

```bash
python tools/i18n_audit.py --baseline tools/structure-baseline.json --strict
```

6. 用仓库约定的身份提交：`git -c user.name=lnuxe -c user.email=lnuxe@users.noreply.github.com commit`。

## 单页翻译提示词模板

把下面整段复制给编码智能体，替换 `<英文源文件路径>` 即可。它假设智能体能看到本仓库。

```text
请把 <英文源文件路径> 翻译成简体中文，直接改写本仓库里的同一个文件。

动手之前先读这三份东西：
- tools/glossary.yml：术语表，里面的既定译法必须照抄，禁止使用 forbidden 里的写法。
- TRANSLATING.md：本文档，尤其是「绝对不能翻译的东西」和「结构保真」两节。
- introduction.md、primitives/choice.md、confidence.md：语气与译名的参照。

硬性要求：
1. 只翻译正文与标题。代码块、行内代码、标识符、API/SDK 名、函数名、URL 与锚点、
   front-matter 的键、MDX 组件名与 props、文件路径、CLI 参数、模型名一律原样保留。
   代码块内的散文注释可以翻译。
2. markdown 结构逐项保真：标题层级与顺序、围栏代码块（数量、语言标记、内容逐字节一致）、
   表格、链接目标、图片、Mermaid 块、{#anchor} 锚点。一个都不能少、不能多。
3. 术语按 tools/glossary.yml；首次出现可写「中文（English）」，之后只用中文。
4. 简体中文技术文档语气，直白，不堆「我们」，不逐字直译英文语序。
   不添加原文没有的内容，不加营销式措辞。
5. 翻译完成后运行：
       python tools/i18n_audit.py --baseline tools/structure-baseline.json
   要求这一页：混排残留为 0、没有结构回归、术语表违规为 0。
   如果报了错，改到干净为止，不要用改基线的方式绕过去。
6. 如果出现了术语表里没有、但反复用到的词，把它按现有格式补进 tools/glossary.yml，
   例句用你刚翻出来的那句话（必须真实存在于文件里）。

最后回报：改了哪个文件、审计器这一页的结果、以及你拿不准的地方。
```
