# 更新日志

> TypeSafe AI API 的 Python 客户端

<a id="changelog" />

<h2 id="v071-2026-09-21">
  v0.7.1 (2026-09-21)
</h2>

<h3 id="bug-fixes">
  问题修复
</h3>

* 提前校验 API 密钥，并让记录到日志的异常不包含密钥值

<h3 id="documentation">
  文档
</h3>

* 增加与 AI 网关配合使用的示例

<h2 id="v070-2026-09-18">
  v0.7.0 (2026-09-18)
</h2>

<h3 id="breaking-changes">
  破坏性变更
</h3>

* 序列化/反序列化库从 `msgspec` 改为 `pydantic`

<h3 id="bug-fixes_1">
  问题修复
</h3>

* `str` 子类现在会正确地序列化为字符串，而不是字符列表

<h3 id="features">
  新功能
</h3>

* `system_one` 方法新增 `response_model` 参数，可设为你需要的 `pydantic` 模型，以获得额外的*类型安全*

<h2 id="v060-2026-09-15">
  v0.6.0 (2026-09-15)
</h2>

<h3 id="breaking-changes_1">
  破坏性变更
</h3>

* `Score.criteria` 现在接受有序序列，而不再是以整数为键的字典

<h3 id="features_1">
  新功能
</h3>

* 改进 SDK 输入的类型标注，使其接受 `Mapping`、`Sequence` 这类抽象类型
* 改进错误信息，加入 http 详情和元数据

<h3 id="bug-fixes_2">
  问题修复
</h3>

* 处理 `RetryPolicy` 中的非法值
* 让异常和响应可以被 pickle

<h3 id="documentation_1">
  文档
</h3>

* 从主[文档](https://docs.typesafe.ai/)链接更多概念

<h2 id="v057-2026-09-14">
  v0.5.7 (2026-09-14)
</h2>

这是 TypeSafe Python SDK 的首个公开发布版本。更多内容见[文档](https://docs.typesafe.ai/sdk/python)。
