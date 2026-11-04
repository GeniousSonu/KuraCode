# Contributing to KuraCode

Thank you for your interest in contributing to KuraCode (SnipHub)! We welcome contributions from developers of all skill levels.

---

## 1. Code of Conduct
Please review and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, constructive, and collaborative.

---

## 2. Branching and Workflow (Trunk-Based)
We follow a strict **Trunk-Based Development** model:
- `main` is our source of truth and is always in a releasable state.
- Create short-lived feature branches: `git checkout -b feat/your-feature-name` or `fix/issue-description`.
- Keep changes scoped and concise. Submit a Pull Request targeting `main`.

---

## 3. Commit Message Conventions
All commit messages must adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature (triggers minor version bump in release-please)
- `fix:` A bug fix (triggers patch version bump)
- `perf:` Performance improvements (triggers patch bump)
- `docs:` Documentation changes only
- `refactor:` Code restructuring without functional changes
- `test:` Adding or updating tests
- `chore:` Routine build, toolchain, or dependency maintenance
- `feat!:` or `BREAKING CHANGE:` Major breaking changes

**Example:**
```bash
feat(cleaner): support kotlin language heuristics in snippet detection
fix(library): refresh snippet array immediately upon item deletion
```

---

## 4. Local Development Setup

Prerequisites:
- **Node.js**: >= 20.x (Node 22 LTS recommended)
- **pnpm**: 12.16.x or compatible

```bash
# Clone the repository
git clone https://github.com/kuracode/kuracode.git
cd kuracode

# Install dependencies (frozen lockfile)
pnpm install --frozen-lockfile

# Type check all packages
pnpm typecheck

# Lint codebase
pnpm lint

# Run unit tests
pnpm test

# Build extension (Chrome & Firefox) and web dashboard
pnpm build

# Verify brand assets
pnpm brand:check
```

---

## 5. Testing and Quality Gates
Before submitting a PR, make sure all quality gates pass:
```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm brand:check
```

Ensure no secrets or credentials are ever committed.
