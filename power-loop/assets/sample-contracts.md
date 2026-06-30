# Sample Contracts

Use these examples to dry-run `power-loop` behavior.

## Sample 1: LOOP_READY

### Contract

Objective: Add a README section documenting how to install a new skill directory.

Background: Users currently copy existing skill install commands manually, but the new skill is missing from documentation.

Scope:

- Update `README.md` with one install command.
- Update repository layout text.

Non-goals:

- Do not change any skill behavior.
- Do not add scripts or dependencies.

Affected files or modules:

- `README.md`

Constraints:

- Documentation-only change.
- No runtime dependencies.

Validation plan:

- Run `sed -n '1,220p' README.md`.
- Confirm the new skill appears in install and layout sections.

Acceptance criteria:

- AC-1: Given README installation instructions, when reviewed, then the new skill appears beside existing skill copy commands.
- AC-2: Given README repository layout, when reviewed, then the new skill directory appears with `SKILL.md`.

Stop condition: README documents the new skill in install instructions and repository layout.

Pause-and-ask conditions:

- README structure conflicts with the requested wording.

### Expected power-loop result

- Readiness result: `LOOP_READY`
- Risk level: `LOW`
- Execution decision: `ALLOW_GOAL`
- Bounded `/goal`: generated

## Sample 2: NEEDS_GRILL

### Contract

Objective: Improve the agent loop.

Scope:

- Make it better.

Validation plan:

- Make sure it works.

### Expected power-loop result

- Readiness result: `NEEDS_GRILL`
- Missing or weak fields:
  - background/current problem
  - non-goals
  - affected files or modules
  - constraints
  - concrete validation plan
  - acceptance criteria
  - stop condition
  - pause-and-ask conditions
- Execution decision: none
- Bounded `/goal`: not generated

## Sample 3: NEEDS_HUMAN

### Contract

Objective: Replace the production authentication flow and migrate user permission records.

Background: The current auth system is hard to maintain.

Scope:

- Change login behavior.
- Migrate permission data.
- Update production configuration.

Non-goals:

- None.

Affected files or modules:

- Auth middleware
- Database migrations
- Production deployment configuration

Constraints:

- Must not break existing users.

Validation plan:

- Run auth tests.

Acceptance criteria:

- AC-1: Given an existing user, when they log in after migration, then permissions are preserved.

Stop condition: Production auth works after migration.

Pause-and-ask conditions:

- None stated.

### Expected power-loop result

- Readiness result: `NEEDS_HUMAN`
- Risk level: `HIGH`
- Execution decision: `HUMAN_ONLY`
- Blocking reasons:
  - authentication boundary change
  - database migration
  - production configuration
  - insufficient rollback and pause conditions
- Bounded `/goal`: not generated

