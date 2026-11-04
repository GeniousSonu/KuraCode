## Summary of Changes
<!-- Provide a concise description of the motivation and summary of changes -->

## Related Issues
<!-- Link relevant issue e.g. Fixes #123 -->

## Conventional Commit Type
<!-- Check one that applies -->
- [ ] `feat`: New user-facing feature (triggers minor version bump)
- [ ] `fix`: Bug fix (triggers patch version bump)
- [ ] `perf`: Performance enhancement (triggers patch version bump)
- [ ] `refactor`: Internal restructure without behavior change
- [ ] `test`: Adding or adjusting tests
- [ ] `docs`: Documentation updates
- [ ] `chore`: Build system, toolchain, or dependency updates
- [ ] `BREAKING CHANGE`: Breaking change (triggers major version bump)

## PR Quality Checklist
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm test` unit tests pass
- [ ] `pnpm build` creates valid bundles for Chrome and Firefox
- [ ] `pnpm brand:check` confirms all icon and asset dimensions
- [ ] No secrets, credentials, or `.env` files committed
- [ ] Store-relevant documentation updated if permissions or capabilities changed
- [ ] Screenshots or recordings attached for UI changes (popup, sidepanel, content script)
