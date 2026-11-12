# Stacked PRs with gh-stack

Read this before creating a stack, when submitting or merging one, or
when a `gh stack` command fails. Command flags here follow
[github/gh-stack](https://github.com/github/gh-stack) (MIT). See
[CREDITS.md](../CREDITS.md). `gh stack <command> --help` is
authoritative (`gh stack help <command>` is not — it prints top-level
help).

## Setup

Requires Git 2.36+, an authenticated GitHub CLI, and Stacked PRs enabled
on the repository (exit 9 means they are not).

```bash
gh extension install github/gh-stack
git config rerere.enabled true
git config remote.pushDefault origin   # required if the repo has more than one remote
```

A stack is an ordered chain of branches rooted on a trunk. Each branch
has one PR based on the branch below it, so a reviewer sees only that
layer's diff. `gh stack` prints trunk-first, left to right:

```
(main) <- auth <- api <- frontend
```

Left is the **bottom**, right is the **top**. `auth` merges first;
`frontend` merges last. Foundational work belongs at the bottom.

## Non-interactive flags

`gh stack` branches on whether stdout is a TTY. Under a PTY, many
commands open a prompt or a TUI and block. Always pass the flags below.

| Always run | Never run bare | Why |
|---|---|---|
| `gh stack view --json` | `gh stack view` | opens a TUI under a PTY |
| `gh stack submit --auto` | `gh stack submit` | prompts for a title per new PR |
| `gh stack merge <target> --yes` | `gh pr merge` | `gh pr merge` cannot merge a stack |
| `gh stack init <branch>...` | `gh stack init` | prompts for branch names |
| `gh stack add <branch>` | `gh stack add` | prompts for a name, and fails even when piped |
| `gh stack checkout <target>` | `gh stack checkout` | opens a selection menu |
| `gh stack up` / `down` / `top` / `bottom` | `gh stack switch` | `switch` is menu-only |
| — | `gh stack modify` | TUI-only, no non-interactive path |

`view --short` is safe but meant for humans. Parse `--json` instead.
Never run `push`, `submit`, `sync`, `rebase`, or `link` without
`--remote <name>` unless `remote.pushDefault` is set.

## Core loop

```bash
gh stack init auth
git add ... && git commit -m "Add auth middleware"
gh stack add api
git add ... && git commit -m "Add API routes"
gh stack submit --auto
gh stack view --json
```

Add `--open` to `submit` to create PRs ready for review instead of
drafts. Branch names are verbatim. Titles and bodies are auto-generated;
edit them afterwards with `gh pr edit` using this skill's template.

Stay in sync with `gh stack sync`. Add `--prune` to delete local
branches for merged PRs; pruning never happens without that flag when
non-interactive. If local and remote stacks have diverged, `sync` prints
both chains, changes nothing, and exits 0 with `Sync aborted` — success
here does not mean the sync happened.

## Editing a layer

Check out the layer that owns the change before editing. Never commit a
lower layer's concern on the current top branch.

```bash
gh stack down                   # or: gh stack checkout api
git add ... && git commit -m "Add get-user endpoint"
gh stack rebase --upstack
gh stack top
gh stack push
```

## Merging

```bash
gh stack merge 42 --yes --merge   # PR #42 and every unmerged PR below it
gh stack merge 7 --yes --merge    # every unmerged PR in stack #7
```

Pass `--merge`, `--squash`, `--rebase`, or `--merge-method` to match
`AGENTS.md`. If that file asks for merge commits, pass `--merge`. Without
a method flag, the last-used method is reused — so pass the flag
explicitly. The operation is all-or-nothing: if any PR in the set cannot
merge, none do. If the base branch uses a merge queue, the stack is
queued and the queue picks the method.

Never use `gh pr merge` on a stacked PR.

## Reading state

`gh stack view --json` writes JSON to stdout. Status messages go to
stderr — do not parse them; branch on exit codes.

Useful fields: `trunk`, `currentBranch`, and `branches[]` with `name`,
`head`, `base`, `isCurrent`, `isMerged`, `isQueued`, `needsRebase`, and
an optional `pr` (`number`, `url`, `state`). `needsRebase` is true when
the current parent tip is no longer an ancestor of the branch.

## Exit codes worth acting on

| Code | Meaning | Recovery |
|---|---|---|
| 2 | Not in a stack | `gh stack init`, or `gh stack checkout <target>` |
| 3 | Rebase conflict | After `rebase`: resolve, `git add`, `gh stack rebase --continue` (or `--abort` to restore the stack). After `sync`: the stack is already restored; run `gh stack rebase` to recreate the conflict, then continue as above. |
| 4 | GitHub API failure | Check `gh auth status`, retry |
| 6 | Branch is in several stacks | Check out a branch unique to the intended stack |
| 7 | Rebase already in progress | `gh stack rebase --continue` or `--abort` |
| 8 | Stack file locked | Another `gh stack` process is writing; retry after a few seconds |
| 9 | Stacked PRs unavailable | Not enabled on the repository; tell the user |
| 10 | Interrupted `modify` | `gh stack modify --abort` — do not launch the TUI |

Stacks are strictly linear: one parent, at most one child. Use separate
stacks for parallel work. There is no non-interactive reorder or removal;
restructure with `gh stack unstack` and then `gh stack init`.
