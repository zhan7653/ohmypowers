# Verifier 结果

结果：`<PASS | PASS_WITH_NOTES | BLOCKED | NEEDS_HUMAN>`

## 身份与新鲜度

- 规范 Issue 与任务合同：`<来源、执行正文 digest、任务合同 digest、匹配/不匹配>`
- Execution Blueprint：`<来源/digest/匹配；未使用时注明>`
- 最终快照：`<repository/ref、可用时的 commit、Git tree digest、dirty/generated 边界、捕获时间>`
- 证据新鲜度：`<fresh | tree-equivalent | stale | insufficient>`

## 合同异常

已检查且通过的条款数：`<count>`

| 条款 | 不符合项、缺失证据、歧义或过期证据 |
|---|---|
| `<条款或“无”>` | `<发现>` |

## 评审与验证异常

- Final Review Record：`<来源、digest、结果、冻结树是否匹配>`
- 必需的独立能力：`<已具备或缺失项>`
- 不受支持的路由或隔离声明：`<无或具体事项>`
- V2/V3 或 replay 异常：`<无或具体事项>`

## 备注与下一步

- 非阻塞备注：`<无或具体事项>`
- 最小下一步：`<无或操作>`
