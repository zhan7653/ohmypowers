# Test Capability Selection

Read this reference only when a delivery needs validation and the repository's existing ability to prove the required behavior is uncertain or insufficient. Select from the claim outward; library names below are non-exhaustive examples, not defaults.

## Match The Capability To The Claim

| Claim boundary | Evidence that can support it | Example capabilities | Common invalid substitute |
| --- | --- | --- | --- |
| Pure logic, public module API, or async application flow | Execute inputs through the relevant public seam and assert results, errors, and state transitions | Existing ecosystem runner and, when needed, its async support | A linter result or assertions copied from implementation constants |
| Browser-rendered UI and interaction | Drive a real supported browser, observe user-visible state, and control owned network responses | Playwright with the repository's runner integration or an equivalent browser runner | Reading HTML, JavaScript, or CSS and matching selectors, function names, or wording |
| Static correctness and maintainability | Analyze the actual source with rules appropriate to the repository | Ruff, mypy, or Pyright for Python; ESLint or the TypeScript compiler for JavaScript/TypeScript; ecosystem equivalents | Treating formatting, lint, or type success as runtime behavior evidence |
| HTTP or wire behavior | Exercise serialization, transport handling, and the owned endpoint at the narrowest real boundary the claim requires | HTTPX ASGI or mock transports; respx; a local service | Claiming real networking, proxy, TLS, retry, or server behavior from an in-process stub |
| Database constraints, transactions, or concurrency | Use the supported database engine or a deliberately controlled interleaving that matches the exact application-layer claim | Repository-managed integration service; Testcontainers or an equivalent isolated environment | An in-memory database or synchronous mock that omits the engine semantics being claimed |
| Broad input invariants | Generate and shrink inputs while asserting a stable invariant | Hypothesis or the ecosystem's property/fuzz runner | A few hand-picked examples presented as exhaustive coverage |
| Filesystem, subprocess, or platform behavior | Execute against temporary real resources and, when material, the supported target platform | Native temp/process facilities; target-platform CI | A mock that bypasses encoding, permissions, path, shell, or process semantics |
| Prompt, model, or agent behavior | Run representative scenarios through the target model or a validated evaluation harness and judge observable outcomes | Repository eval runner; isolated model-backed forward evaluation | Checking that prompt, rubric, skill, or documentation text contains expected phrases |

Static analysis complements tests; it never upgrades evidence beyond the rules it actually evaluates. Mocks, fakes, emulators, and in-process transports are useful only for claims whose material semantics they model.

## Admit A New Capability

1. Name the behavior or risk that current evidence cannot falsify, then inventory the repository's runner, dependencies, scripts, CI, and supported environments.
2. Reuse an adequate existing capability. Do not add a fashionable tool, duplicate an equivalent runner, or replace a focused native facility merely to standardize names.
3. If a gap remains, choose the smallest maintained capability compatible with the repository's language, package manager, runtime, and CI. Put test-only tools in the repository's dev/test dependency group; do not add a production dependency solely for validation.
4. Before launch authorization, disclose the proposed dependency or environment, the claim it enables, why current tools are insufficient, affected manifests and lockfiles, browser or service downloads, CI/runtime effects, permissions, external state, and material cost.
5. After authorization, use the repository's package manager to install and lock the approved capability, then run the smallest smoke test that proves the tool or environment actually works. Do this before business implementation so an unusable test stack does not strand an unverified change.
6. If installation needs permission or host support the agent lacks, report the exact blocker and smallest user action. Do not silently switch to lower-fidelity evidence, install globally when a project-local dependency is appropriate, or claim validation that did not run.

Do not pin versions or copy generic installation commands into this reference. Resolve current compatible versions and commands from the target repository and authoritative tool documentation when the dependency is actually selected.
