---
name: pr
description: >
  Open, describe, update, split, attach screenshots to, or merge pull
  requests. Use when writing a PR title or body, showing as-is/to-be
  diffs as images, deciding whether to split work into stacked PRs,
  or submitting or merging a stack with gh-stack.
license: MIT
compatibility: >
  Authenticated GitHub CLI (gh). Image attach needs gh 2.99.0+ and
  user auth (not a GitHub App token). Stacks need the github/gh-stack
  extension.
metadata:
  version: "1.0.0"
---

# PR

Work through a pull request as a reviewer will see it: a short description,
evidence that it works, and a merge path that matches the repo.

Read `AGENTS.md` (or `CLAUDE.md` if that is the repo's agent guide) for
language, merge method, and review conventions. Repo-specific rules belong
there, not in this skill. If the file is silent on language, write in the
language already used in the repo's PRs. If it is silent on merge method,
follow the repository's GitHub settings; do not invent one.

## 1. Decide: one PR or a stack

Use a **single PR** when the change is one reviewable concern — it can be
described in one sentence, and a reviewer can judge it as a whole.

Use a **stack** (GitHub Stacked PRs via `github/gh-stack`) when the work has
two or more dependent layers that should be reviewed on their own, as one
coherent story. Put foundational work at the bottom. A layer that cannot be
described in one sentence is usually two layers. Unrelated work belongs in a
separate stack, not a later layer.

If you are stacking, or a `gh stack` command fails, read
`references/stack.md` before going further.

Create the stack before writing files when you already know the layers. Do
not implement everything on the trunk and split it afterwards.

## 2. Write the description

Skip preambles. Keep prose brief. The body is a cover note for reviewers,
not a changelog or a file-by-file summary. Lead with what changed and why
(the effect a person will notice, then the mechanism if it helps).

Use this template, dropping a section that has nothing to say (except
Summary):

```markdown
## Summary

<What changed and why. Prefer the smallest diagram, diff-sketch, or tree
that makes the point clear. One short paragraph is enough when a visual
would not help.>

## Evidence

- **As-is (Before):** <screenshot, output, or failing test>
- **To-be (After):** <screenshot, output, or passing test>
- **How verified:** <commands run and what they showed, or the manual
  steps you took>

## Merge Danger

**Door:** <one-way or two-way>
**Blast Radius:** <one-word or short phrase>
<optional: what happens if this lands, and how hard it is to undo>
```

A two-way door is cheap to roll back. A one-way door is a destructive or
hard-to-reverse decision (a data migration, a secret rotation, a public API
break).

If the change has no user-visible UI, say so under Evidence and do not
attach screenshots. Mention breaking changes and `Fixes #N` only when they
apply.

For the menu of summary visuals and how to choose one, read
`references/description.md`.

When a body already exists, edit it in place. Keep screenshots, links,
checkboxes, and notes a person added, unless the change makes them wrong.

## 3. Attach as-is / to-be images

Attach screenshots when a person can see a difference in the product (UI,
layout, or empty / error / loading states). Capture the real app on the
base branch (as-is) and the PR branch (to-be), at **desktop and mobile**
widths. Default viewports are 1440×900 and 390×844 unless the repo
documents others. Frame both sides of a pair identically.

Do not commit images to the branch or upload them through the comment box.
Write the body with relative Markdown image references, then attach with
`gh` 2.99.0+:

```bash
gh pr edit <n> --body-file pr-body.md \
  --attach './shots/as-is-desktop.png#As-is, desktop' \
  --attach './shots/to-be-desktop.png#To-be, desktop'
```

`--attach` needs **user authentication**. It fails with GitHub App `ghs_`
tokens (`unsupported authentication type`). If you cannot attach, do not
invent another upload path. Hand the capture steps, viewport sizes, and
file paths to someone who has user auth.

Read `references/screenshots.md` before capturing or attaching.

## 4. Open, update, merge

Requires authenticated `gh`. Write the body to a file and pass
`--body-file` so wording and attachments stay intact.

```bash
gh pr create --title '<title>' --body-file pr-body.md
# or, for a stack:
gh stack submit --auto
# then edit each PR body with gh pr edit
```

`gh stack submit` auto-generates titles and bodies — always follow it with
`gh pr edit`. Add `--open` if the repo wants PRs ready for review rather
than drafts. Follow the repo's draft-vs-ready convention from `AGENTS.md`.

To merge a stack, use `gh stack merge`, never `gh pr merge`. If `AGENTS.md`
asks for merge commits, pass `--merge`:

```bash
gh stack merge <pr-or-stack> --yes --merge
```

For a single PR, use the same method (`gh pr merge --merge` when merge
commits are required). Confirm before merging unless the user already asked
to merge.

## Gotchas

- `gh stack` opens a TUI or prompt when stdout is a TTY. Always use the
  non-interactive flags in `references/stack.md` (`view --json`,
  `submit --auto`, `merge --yes`, and explicit names for `init` / `add` /
  `checkout`).
- Set `remote.pushDefault` if the repo has more than one remote, before
  `push` / `submit` / `sync` / `rebase`.
- Fetch an existing PR body again before overwriting it; `gh pr edit
  --body` replaces the whole body.
- Removing an image from the body does not delete the uploaded file.
- Do not merge unless asked, and do not force-push or rewrite history
  without confirmation.

## Credits

Sources and licenses are listed in [CREDITS.md](CREDITS.md).
