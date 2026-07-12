<!-- power-loop:final-review-record:start -->
# 最终评审记录（Final Review Record）

生成时间：`<带时区的 ISO-8601 时间>`

- 合同来源与任务合同 digest：`<source>@sha256:<digest>`
- 冻结 Git tree digest：`<tree digest>`
- V2/V3 证据：`<来源或摘要>`
- 路由来源：`<selected supported fields | inherited from parent>`
- Spawn 能力证据：`<可见 schema 或等价证据>`
- 无法满足的精确任务合同要求：`<无或具体 NEEDS_HUMAN 阻塞项>`

边界：`补充证据，不得增加任务合同要求。`

## Reviewer 分工与结果

始终包含独立的合同符合性评审和代码评审。仅在最终 diff 存在独立风险时增加风险范围。合并兼容的风险范围并使用最大可用并发；如果两个基础评审无法同时运行，则随后启动剩余的独立新上下文评审。

| Reviewer | 能力与不重叠范围 | 配置来源 | 结果与发现 |
|---|---|---|---|
| `<ID>` | `<contract-conformance | code-review | risk scope>` | `<受支持的选定字段或 inherited；无写入边界>` | `<PASS、备注或阻塞项>` |

所有 reviewer 检查上方同一冻结树。运行时支持时使用 `fork_turns: none`，保持与实施过程独立；其他树的结果只记录为过期证据。

## 等待策略与指标

- 等待前先完成主 Agent 能做的证据整理。
- 至少给予 180 秒宽限期，并使用 180 秒或交互策略允许的最长等待间隔。
- 连续两次无信息超时后继续等待；第三次后只检查一次状态，仅在看不到具体进展时中断。
- 每个 reviewer 最多发送一次合并后的澄清或完成请求，不发送纯状态轮询。

指标：

- 启动 reviewer 数：`<count>`
- `wait_agent` 调用数：`<count>`
- 最大连续无信息超时数：`<count>`
- 累计等待时长：`<duration>`

## 结论

- 结果：`<PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN>`
- 阻塞项或备注：`<事项或“无”>`
- 最小下一步：`<操作或“无”>`

修改 Git tree 后，此记录立即失效。允许一次修复和重新认证；第二次最终评审仍阻塞时停止并重新规划。
<!-- power-loop:final-review-record:end -->
