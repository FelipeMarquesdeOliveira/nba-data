---
name: commit
description: Stage and commit changes using Conventional Commits format
disable-model-invocation: true
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git status *) Bash(git diff *) Bash(git log *)
---

Create a git commit following these strict rules:

## Commit Format
Use Conventional Commits: `<type>(<scope>): <description>`

**Types allowed:** feat, fix, docs, style, refactor, perf, test, chore, ci, build

## Rules
1. Language: ALWAYS write commit messages in English
2. Author: Use only the project's configured git author — NEVER add "Co-authored-by" lines
3. No AI attribution: Do not mention Claude, AI, or any tool in the commit message
4. Subject line: lowercase, imperative mood, no period at end (max 72 chars)
5. Body (optional): explain *why*, not *what*, wrapped at 72 chars

## Steps
1. Run `git status` to see what changed
2. Run `git diff` to understand the changes
3. **Invoke the `tests` skill** — run `/tests` and wait for the result
   - If any test fails: stop immediately, report which tests failed, and DO NOT proceed with the commit
   - Only continue if ALL tests pass
4. Stage all relevant files with `git add`
5. Write a commit message following the format above
6. Run `git commit -m "type(scope): description"`

## Examples
- `feat(auth): add OAuth2 login support`
- `fix(api): handle null response from payment gateway`
- `docs(readme): update installation instructions`
- `refactor(cart): extract discount calculation logic`
- `chore(deps): upgrade react to v19`
