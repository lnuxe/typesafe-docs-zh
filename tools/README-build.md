# 文档站构建与部署（自托管）

这个目录里的 `build_site.mjs` 把本仓库的 Mintlify 格式文档（`docs.json` + Markdown/MDX）**编译成一个完全自持的静态站点**，不需要 Mintlify 云服务、不需要任何构建框架、不需要联网。

## 为什么要自己写一个

Mintlify 的官方托管是云服务，`docs.json` 只是给它读的配置。要让这套中文文档**能部署到自己的服务器**（本项目部署在腾讯云轻量应用服务器的 IIS 上），就必须有一个能读 `docs.json`、渲染 MDX 组件、输出纯静态 HTML 的生成器。这就是它。

## 构建

```bash
node tools/build_site.mjs                                   # 默认 --base / --out dist
node tools/build_site.mjs --base /typesafe/ --out dist       # 部署到子路径
```

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `--base` | `/` | 部署基路径。**部署在子目录时必须传**，否则站内绝对链接会指错。 |
| `--out` | `dist` | 输出目录（会被整体重建）。 |
| `--site-name` | 取自 `docs.json` | 站点名，用于标题栏与 `<title>`。 |

生成耗时约 0.5 秒，输出约 231 个文件 / 224 个 HTML。构建完会自检「无残留 MDX 标签 / 无残留占位符」。

## 输出结构

```
dist/
├── index.html                  首页
├── 404.html
├── assets/
│   ├── style.css               全站样式（含亮/暗主题）
│   ├── app.js                  侧边栏、主题、搜索、代码复制、Tabs/Accordion
│   └── mermaid.min.js          mermaid 运行时（只在含图表的页面懒加载）
├── search-index.json           客户端搜索索引（830 条）
├── <page>/index.html           每个导航页一个目录（干净 URL）
└── <page>.html                 同名直链跳转页（兼容旧的 .html 链接）
```

## 支持的 Markdown / MDX

- 标准 Markdown：标题、段落、列表、表格、引用、围栏代码、行内代码、链接、图片
- **17 种 Mintlify MDX 组件**：Note / Tip / Warning / Info / Card / CardGroup / Tabs / Tab / Accordion / AccordionGroup / Steps / Step / Expandable / Frame / Columns / CodeGroup / ResponseField / ParamField
- **12 个 mermaid 图表**（懒加载渲染，无 JS 时显示图表源码而不是空白）
- **自定义标题锚点 `{#custom-id}`**（Mintlify 官方语法）。中文标题 slug 化之后会和英文锚点对不上，译文用这个语法把原锚点固定下来，生成器会把 `{#id}` 解析成 `id="..."` 并**从标题文本里摘掉**，不会把字面量渲染出来。

## 部署到 IIS（本项目的实际做法）

服务器上没有 git，所以走 GitHub 打包含下载：

```powershell
# 1) 拉取源码
& curl.exe -sL -o C:\ts.tgz https://codeload.github.com/lnuxe/typesafe-docs-zh/tar.gz/refs/heads/main
Remove-Item -Recurse -Force C:\typesafe-src -EA 0
New-Item -ItemType Directory -Force C:\typesafe-src | Out-Null
& tar.exe -xzf C:\ts.tgz -C C:\typesafe-src --strip-components=1

# 2) 构建（服务器上已装 Node.js）
Set-Location C:\typesafe-src
node tools\build_site.mjs --base /typesafe/ --out C:\inetpub\typesafe
```

`/typesafe` 这个 IIS 应用挂在已有的 8090 站点上（`http://<服务器IP>:8090/typesafe/`），**不需要新开端口、不需要改轻量服务器防火墙**。

## 新增页面

1. 写 `<path>.md`（标题用第一个 `# 一级标题`，本仓库不用 front-matter）。
2. 把路径（不含 `.md`）加进 `docs.json` 对应的 group 里。
3. 重新构建。生成器会校验「`docs.json` 引用页面数 == 实际生成页数」，对不上会报错。

## 验证

```bash
# 全站锚点 / 站内链接自检（需要先构建）
python tools/verify_site.py
```

它扫描 `dist/` 下所有 HTML，检查三件事：每个 `href="#..."` 在同页有对应 `id`、每个站内链接与资源在磁盘上真实存在、没有残留的 `{#literal}` 字面量。

## 给 LLM 用的产物（llms.txt）

原站是 Mintlify 托管的，它会额外输出三样东西；我们的自托管构建也必须自己生成，否则不算复刻：

```bash
node tools/gen_llms.mjs --dist dist --base /typesafe/ --url http://<服务器>/typesafe
```

| 产物 | 说明 | 本站实测大小 |
| --- | --- | --- |
| `dist/llms.txt` | 全站索引：站名 + 一句话描述 + 每页的「标题 / 描述 / .md 链接」 | 25 KB / 111 页 |
| `dist/llms-full.txt` | 全站正文拼接成单个纯文本文件 | 1.15 MB |
| `dist/<path>.md` | 每个页面额外的原始 Markdown 副本（`llms.txt` 链的就是它） | 111 个 |

构建流水线里它排在 `build_site.mjs` **之后**：先出 HTML，再补 llms 产物。

`--url` 用来拼 `llms.txt` 里的绝对链接；不给就退化成带 `--base` 前缀的根相对路径。

> 写成 Node 而不是 Python，是因为**目标服务器上只装了 Node、没有 Python**（第一次部署时 `python` 直接报 `CommandNotFoundException`）。

> **IIS 注意**：IIS 默认不识别 `.md`，不加 MIME 映射会直接 404.3。服务器上已经加过：
> ```powershell
> Add-WebConfigurationProperty -Filter "system.webServer/staticContent" -Name "." `
>   -Value @{fileExtension='.md'; mimeType='text/markdown; charset=utf-8'}
> ```
