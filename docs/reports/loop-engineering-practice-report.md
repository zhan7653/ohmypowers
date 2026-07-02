# Loop Engineering 仓库改造实践报告

## 执行摘要

本仓库的改造重点，不是简单增加几个可调用的 `SKILL.md`，而是把 AI coding 的控制方式从“人不断补 prompt、agent 不断响应”改造成“任务先契约化，再边界化执行，最后由验证和证据判断是否可交付”的工程闭环。

这套闭环当前由三个核心 skill 承担主干职责：

```text
power-grill -> power-loop -> Codex /goal -> power-verifier -> PR evidence -> human review
```

其中：

- `power-grill` 负责把模糊或半明确的需求变成可执行 issue contract；
- `power-loop` 负责判断 contract 是否能进入自动执行，并生成 bounded `/goal`；
- `power-verifier` 负责在实现后只读验证合同、diff、验证输出和 PR evidence；
- GitHub issue、分支/worktree、PR、validation output 共同承担外部状态；
- `power-work-report` 当前是报告和记忆产物能力，能帮助沉淀工作结果，但还没有进入上述仓库 Loop Engineering 主循环的调度链路。

这份报告的重点，是说明前三个核心 skill 如何体现 Loop Engineering，以及两个实践案例如何验证这些理念：早期的 `examples/linear-regression-optimizer` 用一个小而可测的任务验证合同、边界、验证、阻塞和恢复；后续 `power-work-report` 的实现实践则验证了更复杂的合同演进、结构化输出、用户反馈和 evidence-driven PR。

最终，本仓库形成的经验是：Loop Engineering 的关键不在于让 agent 更自由，而在于把 agent 放进更明确的系统中。这个系统要明确任务来源、上下文载体、执行边界、验证标准、失败停止、证据交付和人工 gate。只有这些控制面都存在，AI coding 才能从单次会话能力变成可复用的工程流程。

## 背景：从 Prompt 驱动到 Loop 驱动

传统 AI coding 很容易停留在交互式协助模式：人描述需求，agent 修改代码，人发现偏差后补充说明，agent 再修改。这个模式短期有效，但在较长任务里会暴露稳定问题：

- 上下文容易腐烂：早期约束、用户反馈、失败尝试混在聊天记录里，后续 agent 容易抓住最近局部信息。
- 完成判断不可靠：agent 可能在未跑验证、未覆盖验收、甚至破坏非目标时总结“已完成”。
- 执行边界不清晰：需求稍复杂时，agent 会自然扩展范围，增加未要求的依赖、工具、抽象或 UI。
- 失败恢复依赖记忆：验证为什么失败、是否绕过、后来是否重跑，经常只存在于会话里。
- 并发容易污染文件：多个任务或 agent 共用一个目录时，合同草稿、实现代码、生成物和依赖目录会混在一起。

Loop Engineering 的价值，是把这些控制点从聊天窗口外移到工程系统中。参考理念文档把演进拆成 Prompt、Context、Harness、Loop 四层：Prompt 解决“说什么”，Context 解决“看什么”，Harness 解决“如何安全执行一次”，Loop 解决“如何持续推进、验证、记录和决定下一步”。

本仓库采用的是务实版本：先不做复杂调度器或长期自动化平台，而是把每个 coding task 包装成可执行、可验证、可停止、可审阅、可交接的 bounded loop。这个定义体现在 README 和 `power-loop/SKILL.md` 中，也是后续设计的主线。

## 核心设计：三段式 Loop Engineering 主链路

当前仓库真正承担 Loop Engineering 主链路的，是 `power-grill`、`power-loop` 和 `power-verifier`。三者不是平行工具，而是前后接续的控制面。

| 阶段 | 负责 skill | 输入 | 输出 | Loop Engineering 职责 |
|---|---|---|---|---|
| 合同化 | `power-grill` | 模糊任务、半明确想法、用户初始需求 | hosted issue 或 local brief | 把 prompt 变成外部化 contract |
| 边界化 | `power-loop` | agent-ready issue/local brief | readiness decision、risk decision、bounded `/goal` | 把 contract 变成可执行 loop |
| 验证化 | `power-verifier` | contract、diff、validation、PR evidence | `PASS` / `PASS_WITH_NOTES` / `BLOCKED` / `NEEDS_HUMAN` | 把“完成”变成证据判断 |

这条链路对应一个最小可用的工程闭环：

```text
Task idea
  -> issue contract
  -> loop readiness
  -> bounded goal
  -> isolated implementation
  -> validation
  -> verifier gate
  -> draft PR evidence
  -> human review
```

这也是本仓库区别于普通 prompt 模板集合的地方。普通 prompt 模板主要改善一次请求的表达；本仓库的 skill 设计则把一个任务拆成可检查的状态迁移，每一步都有输入、输出、禁止事项和失败路径。

## `power-grill`：把需求变成可执行合同

`power-grill` 是整个 loop 的入口。它解决的问题是：agent 不能直接拿着模糊需求开工，因为模糊需求会在执行阶段放大成范围漂移、验收缺失和错误完成判断。

### 它具体怎么实现

`power-grill/SKILL.md` 把工作拆成五个关键阶段。

第一，先检查仓库再提问。它要求在问用户之前读取 README、`AGENTS.md`、包管理文件、docs、issue/PR 模板、测试命令和用户点名的模块。如果问题能从仓库里回答，就不把问题丢给用户，而是给出基于证据的假设。

这对应 Context Engineering：agent 不是只看用户一句话，而是先构造最小必要上下文，减少猜测。

第二，进行多轮 grill。它不是一次性问一个 intake form，而是要求持续追问，直到覆盖 objective、current problem、user-facing behavior、scope、non-goals、affected modules、implementation approach、data/control flow、error handling、test seam、dependencies、contract changes、security/privacy、validation、acceptance criteria、stop condition 和 pause-and-ask conditions。

这里最重要的是 coverage matrix。它把每个关键字段标成 unknown、assumed、confirmed 或 not applicable。只有字段真正有决定、仓库证据或明确不适用，才算覆盖。这个设计防止 agent 把“提到过”误认为“确认过”。

第三，要求实现设计轮。对于非平凡任务，`power-grill` 不能只问产品边界，还要确认代码层面的设计边界，例如改动应该落在哪里、复用什么接口、数据如何流动、错误如何处理、如何测试。它不写实现计划，但要把足以影响合同的工程选择提前暴露。

第四，生成 issue body。它读取 `power-grill/assets/issue-body.md`，把任务写成标准合同，包括 Problem、Goal、Scope、Non-goals、Dependencies、Current context、Relevant files、Proposed approach、Implementation notes、API/data contract、Constraints、Risks、Validation plan、Acceptance criteria、Stop condition、Pause-and-ask conditions 和 Change history。

第五，只有用户确认后才创建 hosted issue 或保存 local brief。`power-grill` 明确不默认创建 issue，也不生成 `/goal`，更不实现代码。它的最后动作是把合同交给 `power-loop`。

### 它如何体现 Loop Engineering

`power-grill` 体现了 Loop Engineering 的第一个核心思想：loop 的可靠性取决于输入协议。没有 contract，后续所有自动化都只是“更快地执行模糊需求”。

它把人的实时驾驶行为前移成系统化合同：

- 人不需要在实现中不断提醒“别扩 scope”，因为 non-goals 已写入 issue；
- 人不需要在最后临时判断“算不算完成”，因为 acceptance criteria 和 validation 已写入 issue；
- agent 不需要猜遇到什么情况要问人，因为 pause-and-ask conditions 已写入 issue；
- 后续 agent 不需要依赖聊天记忆，因为 issue URL 成为外部状态。

因此，`power-grill` 不是普通需求澄清工具，而是 Planning loop 的实现。它把一次性 prompt 改造成可被后续 loop 消费的 contract。

### 产出和收益

它的直接产出是 issue contract。更重要的产出，是把任务的“完成定义”提前固定下来。

在 issue #15 中，这种机制让本报告任务提前明确了：只交付 Markdown、路径是 `docs/reports/loop-engineering-practice-report.md`、不生成 HTML/PDF/Word/slide、不改代码、不扩展外部研究、日报实践要多于线性回归实践、必须解释 issue-vs-Markdown。这些内容如果不在合同阶段确认，写作阶段很容易变成泛泛方法论文章。

经验是：`power-grill` 的价值不是多问问题，而是把问题问到可以驱动执行。好的 grill 结果应该让 `power-loop` 能判断 readiness，而不是让实现 agent 继续猜。

## `power-loop`：把合同变成 bounded `/goal`

`power-loop` 是主链路的编排层。它不实现代码，甚至明确禁止创建分支或 worktree；它只判断合同是否适合进入自动执行，并在适合时生成 bounded `/goal`。

### 它具体怎么实现

`power-loop/SKILL.md` 的核心实现分为六块。

第一，读取合同并把合同视为唯一事实来源。如果 hosted issue 不能读取，就要求用户提供 issue body 或 local brief。它还规定：如果合同和仓库事实矛盾，不能自行调和，必须返回 `NEEDS_HUMAN`。

第二，做 loop readiness check。它读取 `assets/loop-readiness-checklist.md`，检查必需字段：

- Objective
- Background or current problem
- Scope
- Non-goals
- Affected files or modules
- Constraints
- Validation plan
- Acceptance criteria
- Stop condition
- Pause-and-ask conditions

缺字段或验证信号太弱，就返回 `NEEDS_GRILL`，不生成 `/goal`。这一步体现了一个很关键的原则：不是所有 issue 都应该自动执行，只有 contract 完整、验证可运行、风险可控的任务才进入 loop。

第三，做风险分级和执行决策。`power-loop` 把风险分成 `LOW`、`MEDIUM`、`HIGH`，并对应三种决策：

- `ALLOW_GOAL`
- `GOAL_WITH_STRICT_GATE`
- `HUMAN_ONLY`

这使 loop 不会因为“能自动做”就默认自动做。涉及 auth、权限、安全、数据库迁移、生产配置、支付、破坏性数据变更等高风险任务，应该进入 human decision，而不是生成执行 goal。

第四，定义 work isolation。当前仓库规则已经改为仓库内 `.worktrees/agent-<issue-id>-<short-name>`，并要求 `.worktrees/` 被 Git 忽略。使用 worktree 的条件包括：当前 worktree 有无关改动、多 agent 并行、任务跨多个中等风险区域，或用户要求强隔离。

这对应 Loop Engineering 的 Worktree 组件：文件隔离不是实现细节，而是 loop 能并行、可回滚、可 review 的基础。

第五，生成 checkpoints、validation loop 和 budget。默认 checkpoints 包括：读合同和相关代码、复述最小实现方案、实现最小改动、跑 targeted validation、修复失败、跑 full validation、跑 verifier gate、准备 draft PR evidence、输出 loop decision。默认预算包括最多 5 次实现迭代、同一失败最多重试 3 次、连续 3 次无进展停止。

这里体现的是 Stop condition over infinite retry。agent 不能无限“再试试”，必须在预算内推进；重复失败要 blocked 或 needs-human。

第六，定义 verifier gate 和 PR evidence。`power-loop` 不只要求测试通过，还要求在最终 PR/MR 前运行只读 verifier，检查 diff、validation、AC evidence、scope、non-goals、风险和 code review 结果。PR evidence 必须包含 summary、rationale、changed files、tests run、AC table、verifier result、risks、out-of-scope 和 reviewer checklist。

### 它如何体现 Loop Engineering

`power-loop` 是 Loop Engineering 中 Goal Loop 的实现。它把“做这个 issue”变成可执行协议：

```text
contract -> readiness -> risk -> isolation -> checkpoints -> validation -> verifier -> PR evidence
```

它的价值不在于替 agent 写更详细 prompt，而在于明确控制状态迁移：

- 合同不完整时回到 `power-grill`；
- 风险过高时进入 `NEEDS_HUMAN`；
- 可以执行时才生成 bounded goal；
- 执行必须有 isolation；
- 验证失败不能忽略；
- verifier 不通过不能 claim completion；
- 最终只能 draft PR，不能 merge。

这就是 Loop Engineering 中“系统持续驱动 agent”的部分。系统不是让 agent 自由发挥，而是把 agent 每一步放在显式协议里。

### 产出和收益

`power-loop` 的直接产出是 bounded `/goal`。它不是普通 prompt，而是一份执行合同的运行时版本。

在 issue #15 中，`power-loop` 识别当前主 worktree 有未跟踪 `.codex/`，因此要求使用 dedicated worktree。最初本地安装的旧 skill 仍输出同级目录 worktree，后来同步本地 skill 后，规则修正为仓库内 `.worktrees/agent-...`。这个过程本身也说明了 Loop Engineering 的一个实践经验：skill 是 workflow 源码，安装态和仓库态必须同步，否则系统会按旧协议运行。

经验是：`power-loop` 应该成为“是否允许 agent 自动执行”的门，而不是“把任何 issue 包成 goal”的模板工具。它越严格，后续执行越稳定。

## `power-verifier`：把完成判断变成只读证据审计

`power-verifier` 是主链路的检查端。它解决的问题是：实现 agent 最容易合理化自己的结果，尤其在验证不完整、scope 漂移或 PR evidence 不充分时，仍然给出“完成”结论。

### 它具体怎么实现

`power-verifier/SKILL.md` 规定它必须保持 read-only。它不能编辑文件、不能写 patch、不能创建分支、不能改 issue 或 PR、不能 approve 或 merge。它只能读取 contract、diff、validation evidence、AC evidence、PR/MR evidence、code review output、risks 和 assumptions。

它的验证输入按优先级包括：

1. Contract source；
2. Implementation source；
3. Validation evidence；
4. Acceptance-criteria evidence；
5. PR/MR evidence package；
6. Code-review output 或 skipped reason；
7. Risks、assumptions、out-of-scope notes 和 loop decision。

它还定义了三种 independence mode：

- `fresh-context verifier agent`
- `external code review plus verifier`
- `self-review degraded mode`

当无法使用 fresh-context verifier 或外部 code review 时，可以 self-review，但必须披露 degraded mode reason。这一点非常重要：降级不是失败，但不能隐藏。

它的 checklist 要求逐项检查：

- 合同是否重新读取；
- 合同和仓库事实是否矛盾；
- diff 是否映射到 scope；
- objective 是否满足；
- non-goals 是否保留；
- 每个 AC 是否有证据；
- validation 是否相关、可信、覆盖 AC；
- code review 是否执行或有合理 skipped reason；
- 是否触碰 forbidden paths；
- 生成物是否按合同处理；
- 风险和假设是否披露；
- PR evidence 是否足够；
- loop decision 是否由证据支持。

最后只能输出四种结果：

- `PASS`
- `PASS_WITH_NOTES`
- `BLOCKED`
- `NEEDS_HUMAN`

如果结果是 `BLOCKED` 或 `NEEDS_HUMAN`，实现 agent 不能宣称完成。

### 它如何体现 Loop Engineering

`power-verifier` 对应 Verification loop 和 maker/checker 分离。它把“测试通过了吗”扩展成“合同是否被满足”。

这比普通测试更强，因为测试通常只能证明某些行为；verifier 还要证明：

- 是否做了不该做的事；
- 是否漏了 acceptance criteria；
- PR evidence 是否足够 reviewer 接手；
- 是否把风险写清楚；
- code review 是否有 unresolved blocker；
- loop decision 是否合理。

也就是说，`power-verifier` 不替代测试，而是把测试、diff、合同和 PR evidence 合在一起审计。

### 产出和收益

`power-verifier` 的直接产出是 verifier result。它的实际收益是改变完成判断的权力结构：实现 agent 不能单方面宣布完成，必须通过只读检查。

在线性回归实践中，代码在 workaround 环境下可运行，但合同指定的 `python3 -m venv .venv` 没通过，因此 verifier gate 返回 `BLOCKED`。这避免了把“局部可用”误判成“合同完成”。

在 PR #14 中，最终 verifier result 是 `PASS_WITH_NOTES`，并披露 self-review degraded mode。这说明报告证据可以接受，但 reviewer 应知道独立性限制。这个披露本身就是 Loop Engineering 的一部分：系统不假装完美，而是把验证强度作为 evidence 的一部分呈现。

经验是：如果没有 `power-verifier`，loop 容易变成“agent 自己设题、自己答题、自己判分”。有了 verifier，完成判断变成合同和证据驱动。

## `power-work-report` 的当前定位：报告产物，不是主循环调度器

需要明确的是，`power-work-report` 当前还没有进入仓库 Loop Engineering 的主循环。它不负责发现 issue，不负责生成 bounded goal，不负责调度 agent，不负责验证 PR，也不负责推动下一轮实现。

它当前的定位更准确地说是：基于 Codex session history 的本地报告和记忆产物工具。

它读取 `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`，生成 draft `report.json`、`report.md`、`report.html` 和 `memory-update.proposed.json`。用户确认后，才会 finalize 报告并合并 memory。它的边界也很明确：Codex-only、local-only、不读 `state_*.sqlite`、不支持 Claude/Cursor/Copilot、不安装调度器、不使用 root、不在用户确认前更新 memory。

因此，不能把它写成“仓库 loop 已经自动用日报驱动下一轮任务”。目前更准确的表述是：

- 它是 Loop Engineering 产出的观测和沉淀能力；
- 它可以帮助人或未来的 loop 恢复上下文；
- 它还没有被 `power-grill`、`power-loop` 或 `power-verifier` 自动消费；
- 它的实现过程本身是一次 Loop Engineering 实践，但工具本身还不是主链路的一环。

这个区分很关键。否则会夸大当前系统成熟度。当前系统的主循环仍然是 issue contract -> bounded goal -> implementation -> verifier -> PR evidence -> human review。`power-work-report` 是旁路的 reporting/memory artifact，未来可以接入，但现在不能写成已经接入。

## 为什么用 issue 维持任务上下文，而不是全部用 Markdown

本仓库大量使用 Markdown：`SKILL.md`、README、tutorial、报告都是 Markdown。问题不是 Markdown 不够好，而是任务合同和长期文档的职责不同。

Issue 更适合作为单次任务上下文，原因有五点。

第一，issue 有天然任务语义。它有编号、标题、URL、状态、评论、标签、关联 PR 和关闭关系。`power-loop` 可以把 issue 作为 contract source 读取，而不是从一堆文档里猜哪个段落是当前任务。

第二，issue 更适合承载合同变更。Loop Engineering 中合同不是静态文本。用户反馈、验收口径变化、实现中的阻塞和非目标确认都可能发生。Issue/PR 可以把这些变化和实现证据关联起来。

第三，issue 是跨会话外部状态。聊天会压缩、断开或换模型；issue URL 仍然可被新的 agent、reviewer 或工具读取。这符合理念文档中的 State/Memory 原则：不要相信模型记得，要把状态写到外部系统。

第四，issue 可以连接 PR evidence。Markdown 文档可以沉淀知识，但不能天然表达“这个 PR 是否关闭这个任务、哪些 AC 已通过、哪些风险仍保留”。Issue + PR 的关系正好提供 handoff 结构。

第五，issue 支持状态协议。`power-loop/assets/status-transitions.md` 中的 `agent-ready`、`agent-loop-ready`、`agent-running`、`agent-pr-ready`、`agent-done` 更适合出现在 issue/PR 状态中，而不是散在本地文档里。

因此，本仓库采用分层状态：

- 稳定流程和方法写在 Markdown，例如 `SKILL.md`、README、报告；
- 单次任务合同放在 issue；
- 实现证据放在 PR；
- 执行日志、验证输出、报告草稿和 memory proposal 作为辅助 evidence；
- 被验证过的长期经验再回写到文档。

这不是 issue 和 Markdown 二选一，而是按状态生命周期分工。

## 实践一：线性回归优化器如何验证早期 Loop

`examples/linear-regression-optimizer` 是早期低风险实践。它的价值不在于机器学习实现本身，而在于用一个可测问题验证主链路能否工作。

### 对应的 Loop Engineering 理念

这个实践主要验证四个理念：

- Contract over intuition：小任务也先写清楚验收标准；
- Validation over confidence：用数值和测试证明完成，而不是相信 agent 总结；
- Stop condition over infinite retry：环境不满足时停止，不绕过合同；
- Evidence over narrative：PR body 要能把每个 AC 映射到证据。

### 每一块是怎么写的

合同层面，任务被写成 issue #3，而不是一句“写个线性回归例子”。合同明确了文件位置、依赖、非目标、收敛阈值、参数误差、固定 seed、unsafe learning rate、PNG 处理、验证命令和 pause 条件。

实现层面，代码保持最小：`README.md` 说明目的和验证方式，`optimizer.py` 生成数据、训练参数、检测发散并输出图像，`test_optimizer.py` 验证收敛、复现、非成功状态和 PNG 生成。实现没有扩展成通用 ML 框架，这体现了 scope control。

验证层面，测试不是笼统“能跑”，而是对合同中的可观察结果逐项断言：loss 降低至少 95%，`w` 和 `b` 接近目标值，固定 seed 可复现，unsafe learning rate 不报告成功，图像文件存在且是 PNG。

执行层面，worktree 隔离避免了当前工作区的 `.codex/` 状态污染实现 diff。环境缺少 `python3.12-venv` 时，loop 没有把 workaround 结果当成合同完成，而是进入 blocked；环境恢复后重新运行合同验证。

### 最终产出

最终产出包括：

- `examples/linear-regression-optimizer/README.md`
- `examples/linear-regression-optimizer/optimizer.py`
- `examples/linear-regression-optimizer/test_optimizer.py`
- `examples/linear-regression-optimizer/requirements.txt`
- draft PR #4 的 AC evidence 和 verifier result

验证证据显示 loss 从 `7.101261` 降到 `0.001838`，降幅 `99.97%`，`w = 3.020774`，`b = 1.995173`，unsafe learning rate 返回 `diverged`，图像输出为有效 PNG。

### 经验和收益

这个实践证明：即使任务简单，Loop Engineering 也能让完成判断更可靠。它还证明 blocked 不是失败，而是正确状态。当外部环境无法满足合同验证时，停止比绕过更安全。

它也暴露了早期不足：当时重点还在单任务实现 loop，长期记忆和工作复盘能力还没有形成系统能力。

## 实践二：工作日报升级如何验证复杂合同执行

`power-work-report` 实践不是“工作日报已经成为主 loop”，而是“用 Loop Engineering 方法实现并改造一个报告工具”。这个实践比线性回归复杂，因为它涉及 skill 说明、CLI、schema、renderer、测试、真实生成和用户反馈。

### 对应的 Loop Engineering 理念

这个实践主要验证六个理念：

- Contract first：先用 issue #13 明确目标、scope、non-goals 和验收；
- Context structure：用 schema v2 组织日报内容，而不是靠自由文本；
- Harness boundary：保持 Codex-only、local-only、manual review-first；
- Verification gate：用测试、静态检查、真实生成和 PR evidence 验证；
- Human feedback loop：用户反馈可以修正合同中的验收重点；
- Scope discipline：不因为报告工具就扩成 scheduler、database、web app 或截图平台。

### 每一块是怎么写的

合同层面，issue #13 把问题定义为：旧 HTML 只是简单 Markdown 转换页，无法承载参考日报的信息架构和组件化样式。它要求更新 `power-work-report/SKILL.md`、`codex-draft.js`、`render.js`、测试 fixture 和 CLI 测试，并保持产物文件名不变。

非目标层面，合同明确排除了调度器、systemd、cron、数据库、远程同步、多 agent 日志、Web app、前端构建链、`node_modules/`、旧草稿兼容和长期视觉回归平台。这些非目标很重要，因为报告工具天然容易扩张。

数据结构层面，PR #14 把 `report.json` 升级到 schema v2，让 Markdown、HTML 和 memory proposal 从同一份结构化数据生成。结构包括 metadata、overview、outcomes、decisions、tasks、projectSections、riskGroups、ideas 和 appendix。这个设计体现 Context Engineering：先把模型输出组织成稳定结构，再渲染不同视图。

渲染层面，Markdown 保持 review-first，HTML 保持单文件组件化报告。Markdown 的顺序是今日概览、关键成果、关键决策、明日优先、后续待办、项目进展、风险与阻塞、想法与灵感、附录。HTML 组件用于提升阅读路径，但不是引入前端应用。

安全和边界层面，renderer 需要 escape 用户内容，skill 继续提醒报告可能包含本地路径、会话内容、命令、todo 和 idea，分享前必须审阅。finalize 仍需用户确认。

验证层面，PR #14 不只跑 fixture 测试，还跑真实日期生成：

```text
npm run check
npm test
node bin/power-work-report.js run --date 2026-07-01 --lang zh-CN
```

用户反馈层面，最初合同包含 Playwright/Chromium 截图验证；后续用户明确说不需要保存截图，并指出长文本区域不应该横向并栏。最终实现移除了 screenshot command、Playwright dependency 和截图输出，并把 decisions、tasks、risks 等长文本内容改成纵向单列。这体现了 Human feedback loop：loop 不是僵硬执行初始想法，而是把新的验收判断写进实现和 PR evidence。

### 最终产出

最终产出不是“自动化日报 loop”，而是一个更可靠的本地日报生成工具：

- `power-work-report/SKILL.md` 说明 draft、review、finalize、privacy 和输出路径；
- `tools/power-work-report/lib/codex-draft.js` 提示 Codex 输出 schema v2；
- `tools/power-work-report/lib/render.js` 从 schema v2 生成 Markdown、HTML 和 memory proposal；
- 测试覆盖 schema、Markdown 顺序、组件 markers、HTML escaping、memory extraction 和长文本不窄列；
- 真实生成产物包括 `report.json`、`report.md`、`report.html` 和 `memory-update.proposed.json`；
- PR #14 记录 AC evidence、用户反馈导致的 AC 变化、verifier result 和 reviewer checklist。

### 经验和收益

这个实践的收益不是“多了一个漂亮 HTML 页面”，而是验证了复杂合同如何被 loop 控制。

第一，schema 让上下文稳定。日报内容不再依赖模型生成一段自由文本，而是被拆成成果、决策、任务、项目、风险、想法和证据。

第二，review-first 防止自动污染 memory。报告可以自动生成，但 finalize 和 memory merge 必须由用户确认。

第三，用户反馈被纳入合同演进。截图从必需变成不需要，双栏布局从可接受变成问题，这些变化都反映到实现和 PR evidence。

第四，非目标保护了工具边界。没有因为“日报”就引入 scheduler、database、web app 或 Playwright 依赖。

第五，它为未来 memory loop 提供了材料，但当前还没有被主链路自动消费。未来如果要让 `power-loop` 读取日报 memory，需要新合同、新权限边界和新验证策略，不能在当前报告里假设已经实现。

## 理念到仓库机制的映射

| Loop Engineering 理念 | 仓库中的实现 | 体现方式 | 当前成熟度 |
|---|---|---|---|
| Prompt -> Contract | `power-grill` + issue body template | 多轮 grill、coverage matrix、issue contract、用户确认后创建 issue | 已作为入口主链路 |
| Context Engineering | issue、README、SKILL.md、PR evidence、schema v2 | 稳定知识放文档，任务状态放 issue，报告内容用 schema 结构化 | 已形成基本分层 |
| Harness Boundary | skill hard boundaries、权限禁区、local-only 规则 | 禁止默认 merge、禁止高风险自动执行、报告只读 Codex JSONL | 已落实到 skill 文档 |
| Goal Loop | `power-loop` bounded `/goal` | readiness、risk、worktree、checkpoints、budget、validation、loop decision | 已作为执行入口 |
| Worktree Isolation | `.worktrees/agent-...` | 避免当前工作区和多任务互相污染 | 已修正为仓库内 worktree |
| Verification Loop | `power-verifier` | 只读审计 contract、diff、validation、AC evidence、PR evidence | 已作为 PR-ready gate |
| Maker/Checker 分离 | verifier independence modes | fresh-context 优先，降级必须披露 | 机制已定义，独立性仍需加强 |
| Human Gate | issue 确认、draft PR、finalize 确认 | agent 不创建最终完成，不自动 merge，不自动写 memory | 已落实 |
| State/Memory | issue、PR、reports、memory proposal | 任务状态外部化，报告沉淀 session 结果 | report 是产物，尚未接入主调度 loop |
| Stop/Blocked | budget、same failure limit、pause conditions | 环境阻塞时 blocked，不无限重试 | 已在早期实践验证 |

这张表比单纯讲理念更重要，因为它说明每个理念在仓库里对应哪个文件、哪个 skill、哪个执行规则。

## 实践效果

### 1. 需求阶段的质量提升

`power-grill` 让需求在实现前就被迫回答：目标是什么，改哪里，不改哪里，如何验证，什么算完成，什么情况必须停。这样生成的 issue 可以直接成为执行合同。

收益是减少执行中的临时判断。实现 agent 不需要在遇到模糊点时随意扩展，也不需要最后自己发明验收标准。

### 2. 执行阶段的失控风险降低

`power-loop` 把执行变成 bounded goal。它通过 readiness、risk、worktree、checkpoints、budget 和 pause conditions 降低失控风险。

收益是 agent 的“自主”被放在边界内：能修就修，验证失败就诊断，重复失败就停止，高风险就交给人。

### 3. 验收阶段的证据质量提高

`power-verifier` 要求每个 AC 都有 evidence，要求 validation 相关且可信，要求 PR evidence 足够 reviewer 接手。

收益是完成判断从“相信总结”变成“检查证据”。这对 AI coding 尤其重要，因为 agent 的叙述能力通常强于自我纠错能力。

### 4. 状态外部化更清楚

Issue 承载合同，PR 承载实现和 evidence，worktree 承载隔离执行，报告承载工作结果。不同状态放在不同载体里，减少了聊天上下文丢失带来的风险。

收益是后续 agent、人类 reviewer 或未来自动化都可以从外部状态恢复，而不是依赖某个会话是否完整。

### 5. 对工具边界更敏感

工作日报实践展示了一个重要经验：复杂工具很容易扩张，但合同和非目标可以把它压回当前真实需求。截图被取消、双栏被修正、Playwright 被移除，说明 loop 最终服务验收，不服务技术惯性。

## 局限与风险

### 1. 前置成本更高

写 issue contract、生成 bounded goal、准备 PR evidence 都有成本。对一次性、小范围、无需协作的任务，直接 prompt 可能更快。因此 Loop Engineering 应用于值得被合同化和验证的任务，而不是所有小动作。

### 2. 验证信号决定 loop 上限

如果 validation plan 弱，loop 也会弱。线性回归有数值指标和测试，日报有结构、渲染、HTML escaping 和真实生成。但没有可验证信号的创意或战略任务，不能被伪装成自动完成。

### 3. Verifier 独立性还要继续加强

`power-verifier` 已定义 fresh-context verifier 和 degraded mode，但实际运行中仍可能退化到 self-review。未来需要更稳定地使用独立 verifier agent 或外部 code review。

### 4. `power-work-report` 尚未接入主循环

日报工具能产出 memory proposal，但当前 `power-grill`、`power-loop`、`power-verifier` 还不会自动读取日报来驱动下一轮任务。要接入，需要额外设计权限、检索、冲突处理和验证策略。

### 5. 安装态和仓库态要同步

这次实践中，本地 Codex 安装的 `power-loop` 一度仍使用旧的同级 worktree 路径，而仓库已经改成 `.worktrees/`。这说明 skill 作为 workflow 源码，也存在发布和安装同步问题。后续需要把“重装/校验本地 skill”作为更新流程的一部分。

## 经验总结

第一，Loop Engineering 的起点是 contract，不是执行。没有合同，自动执行只是扩大模糊性。

第二，`power-grill` 的核心价值是把用户和仓库上下文压缩成可执行 issue，而不是简单问问题。

第三，`power-loop` 的核心价值是拒绝不合格任务进入自动执行，而不是把每个 issue 都包装成 `/goal`。

第四，`power-verifier` 的核心价值是让“完成”接受只读审计，而不是由实现 agent 自我宣告。

第五，issue、PR、worktree、validation output 和 report 是不同生命周期的外部状态，不应该混用。

第六，`power-work-report` 当前应被看作观测和记忆产物。它有助于未来 loop，但目前不能写成已经驱动 loop。

第七，实践报告应该围绕理念如何落地、每一块怎么设计、产出什么、带来什么经验，而不是把执行过程写成流水账。

## 下一步

后续可以沿三条线继续推进。

第一，强化主链路。继续完善 `power-grill` 的合同质量、`power-loop` 的 readiness/risk 判断、`power-verifier` 的独立性和 PR evidence 标准。

第二，完善 skill 安装和版本同步。既然 skill 是 workflow 源码，就需要稳定的本地重装、版本检查和差异检测，避免 Codex 使用旧版规则。

第三，谨慎探索 `power-work-report` 和主 loop 的连接。可以先让日报产物服务人工复盘，再考虑是否让 `power-grill` 或 `power-loop` 在明确授权下读取 memory。这个方向必须有新的合同和隐私边界，不能默认自动接入。

## 结论

本仓库的 Loop Engineering 改造，核心不是“写了多个 skill”，而是建立了一套任务控制系统：`power-grill` 负责合同，`power-loop` 负责边界化执行，`power-verifier` 负责只读验收，issue/PR/worktree/validation output 负责外部状态。

线性回归实践验证了早期主链路的可行性：小任务也可以通过合同、验证、blocked/recovery 和 PR evidence 被可靠交付。工作日报实践验证了复杂合同执行的能力：schema、渲染、测试、用户反馈和非目标控制都能纳入 evidence-driven PR。

当前需要保持准确边界：`power-work-report` 是报告和记忆产物工具，还不是仓库 Loop Engineering 主循环的调度环节。真正的主循环仍然是 contract -> bounded goal -> isolated implementation -> verifier -> PR evidence -> human review。

这套方法的最终收益，是把 AI coding 从“会话内协助”推进到“工程化闭环”：任务有合同，执行有边界，失败有停止，完成有证据，结果能交接。
