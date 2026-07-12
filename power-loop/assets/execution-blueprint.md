<!-- power-loop:execution-blueprint:start -->
# 执行蓝图（Execution Blueprint）

规划状态：`<proposed | confirmed | stale>`

合同来源：`<托管 Issue URL/编号或本地合同路径>`

任务合同 digest：`sha256:<规范性任务合同的精确字节>`

来源基线：`<branch>@<完整 commit SHA>`

生成时间：`<带时区的 ISO-8601 时间>`

边界：`非规范性执行指导，不得增加任务合同要求。`

## 实施计划

| 路径或模块 | 最小必要修改 | 对应合同条款 | 聚焦验证 |
|---|---|---|---|
| `<path-or-module>` | `<修改>` | `<条款或 AC>` | `<检查>` |

实施顺序：`<存在依赖时填写简短顺序，否则按表格执行>`

## 重要接口、风险与假设

- `<只记录会影响实现或验证的事项，否则填“无”>`

## 工作隔离

- 实施分支：`<branch>`
- 工作树或当前工作区处理：`<路径、不需要，或保留无关修改>`

## 验证

- `V0 Focused`：`<任务相关检查>`
- `V1 Integration`：`<相关回归检查>`
- `V2 Final deterministic`：`<完整确定性检查>`
- `V3 External`：`<V2 后的外部检查或“不适用”>`
- `HIGH` 失败矩阵：`<重要失败场景或“不适用”>`

## 执行边界

- 顺序：`主 Agent 实施 -> V0 -> V1 -> 可选 HIGH 自查 -> 最多一次修复 -> 冻结 -> V2 -> 适用时 V3 -> Final Review Record -> verifier -> PR/MR 证据`
- 无进展停止条件：`<同一已诊断失败重复时停止，通常为两次>`
- 暂停条件：`<合同、权限、来源、仓库或验证发生漂移>`

## 失效条件

任务合同发生变化、来源基线使受影响路径/接口/检查失效，或实施过程中暴露新的需求级决定时，此 Blueprint 失效。

Reviewer 路由和等待策略只在最终树冻结后决定，并且只记录在 Final Review Record 中。
<!-- power-loop:execution-blueprint:end -->
