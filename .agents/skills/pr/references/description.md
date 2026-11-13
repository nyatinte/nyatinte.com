# Summary visuals

Read this when the Summary needs more than a short paragraph: you are
choosing a diagram, tree, or diff-sketch, or the first draft still hides
what changed.

The approach is from [mattpocock/skills `pr`](https://github.com/mattpocock/skills/blob/main/skills/engineering/pr/SKILL.md)
(MIT), which adapts the visual menu from Dex Horthy's `show-me` skill.
See [CREDITS.md](../CREDITS.md).

## Choose the smallest view

Pick the one view that makes the key point clear. You may use more than
one; you will almost never need all of them. Place each visual next to the
short text it supports. Keep only the calls, files, props, states, and
boundaries a reviewer needs.

- Logic or an algorithm → pseudocode
- Runtime control flow → a call tree
- UI structure → a component tree, with the state and module boundaries
  that matter
- File responsibility or a broad refactor → a shallow file tree
- Interaction, control flow, or data flow → a short Mermaid diagram
- What changed, when the surrounding shape already exists → a `diff`
  of that same shape (component tree, file tree, call tree, or
  control flow)

Show a full code block only when most of it is new, when omitted context
would hide ownership or order, or when the reviewer needs a copyable
target shape.

## Examples

Pseudocode:

```text
on(save)
  if content is unchanged
    return cached result
  write new content
  return fresh result
```

Call tree:

```text
submitForm
  createSession
    persistPrompt
    launchAgent
  navigateToSession
```

File tree:

```text
src/
├── commands/       # parses user actions
├── sessions/       # owns session state
└── transport/      # sends API requests
```

A `diff` of an existing shape:

```diff
 on(save)
-  write content
+  if content is unchanged
+    return cached result
+  write new content
+  invalidate cache
```

## Evidence, in the body

Concrete evidence that the change works, as a before and after.

- Screenshots are first choice when the change is visual and the app can
  be run. Follow `references/screenshots.md`.
- Otherwise use execution evidence: the test or command that failed
  before and passes now, or the output a reviewer can compare.

## A quick check before you publish

Cover the title, the first line of Summary, and the first Evidence bullet.
If those three do not say what is now different, for whom, and how you
know, rewrite the Summary. Do not add length to fix a missing point.
