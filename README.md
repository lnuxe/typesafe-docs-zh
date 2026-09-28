# TypeSafe AI 中文文档

[docs.typesafe.ai](https://docs.typesafe.ai) 的非官方中文翻译站点，111 个页面全量覆盖，一比一复刻原站结构与设计。

**词数覆盖率 97.7%+** · 术语表约束 · 结构保真校验 · CI 自动审计

## 内容

| 分区 | 页面数 | 说明 |
| --- | --- | --- |
| 开始使用 | 4 | 简介、快速开始、编码智能体指南、用例地图 |
| 核心概念 | 9 | System One、状态、三种原语（Choice / Score / Noul）、置信度、构建指南、AI 入门 |
| 模式 | 5 | 推测性扇出、置信度路由、复合评分、意图路由 |
| Cookbooks | 18 | 自一致性、重排、语义查找、护栏、层级分类等实战配方 |
| 参考 | 6 | 模型、HTTP API、智能体技能、法律条款、模型缺陷说明 |
| SDK 参考 | 65+ | Python / JavaScript SDK 全部类、接口、类型别名与函数 |
| 演示 | 2 | 智能家居助手 |

## 本地预览

```sh
npm install
npx mintlify dev
# 打开 http://localhost:3333
```

或使用仓库自带的自托管构建器（不依赖 Mintlify 账号，见 `tools/README-build.md`）：

```sh
node tools/build_site.mjs    # 构建到 dist/
python3 tools/verify_site.py # 校验构建产物与链接
```

## 翻译质量保障

- `tools/i18n_audit.py` —— 中文化审计：覆盖率、术语合规、混排残留、导航死链
- `tools/structure_selfcheck.py` —— 结构保真：标题/代码块/表格与原文逐项比对
- `tools/verify_site.py` —— 构建产物完整性校验
- `tools/glossary.yml` —— 65 条术语表（如 primitive → 原语、confidence → 置信度），禁用译法自动检查

运行审计：

```sh
python3 tools/i18n_audit.py
```

## 目录结构

```
├── docs.json              # Mintlify 配置（中文导航、主题、品牌色）
├── *.md                   # 111 个文档页面（与 URL 路径一致）
├── concepts/ primitives/ patterns/
├── cookbooks/ demos/ model-jaggedness/
├── sdk/                   # Python & JavaScript SDK 参考
└── tools/                 # 审计、构建、校验工具链
```

## 声明

本仓库为社区翻译，版权归原作者 [TypeSafe AI](https://typesafe.ai) 所有。英文原版见 [docs.typesafe.ai](https://docs.typesafe.ai)，内容以原站为准。若原站更新，欢迎提 PR 同步。
