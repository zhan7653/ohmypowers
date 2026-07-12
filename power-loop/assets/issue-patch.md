# 精简 Blueprint 引用 Patch

目标：`<托管 Issue URL/编号或本地合同路径>`

已审查 Issue 身份：`<来源、可用时的 host revision、精确完整正文 SHA-256>`

任务合同 digest：`sha256:<规范性任务合同的精确字节>`

Blueprint：`<持久化路径>@sha256:<精确 UTF-8 字节>`

仓库基线：`<source branch>@<完整 commit SHA>`

## 精确替换区块

```markdown
<!-- power-loop:execution-blueprint:start -->
# 执行蓝图（Execution Blueprint）

规划状态：`confirmed`

产物：`<持久化路径或稳定来源>`

产物 digest：`sha256:<精确 UTF-8 字节>`

任务合同 digest：`sha256:<规范性任务合同的精确字节>`

生成时间：`<带时区的 ISO-8601 时间>`

执行入口：`此持久化 Issue 是执行入口。实施前验证任务合同和 Blueprint digest。`
<!-- power-loop:execution-blueprint:end -->
```

确认后只应用此标记区块。保持任务合同和 `Curation status` 的精确字节不变，然后重新读取 Issue 并验证两个 digest。

确认请求：

```text
请确认用于 <target> 的 Blueprint 和精确引用 Patch。应用后，此 Issue 即可直接执行。
```
