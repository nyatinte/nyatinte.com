# Screenshots and attachments

Read this before capturing or attaching as-is / to-be images. Capture
rules here are adapted from [getsentry/skills
`pr-screenshots`](https://github.com/getsentry/skills/tree/main/skills/pr-screenshots)
(Apache-2.0). See [CREDITS.md](../CREDITS.md).

## What to capture

List every place the diff reaches: each page, drawer, modal, or widget,
plus the states the change affects (loading, error, empty, hover,
selected, open menu, narrow viewport, theme). One row per location and
state. Do not group several surfaces into one row.

Capture the running app on the PR branch for to-be and on the base branch
for as-is. Do not screenshot a story, mock, or harness built for the PR,
unless the change is to that story. Do not inject CSS or alter the DOM to
imitate the change. Stubbing API responses is fine; the frontend code must
be the real code.

If a state needs data no account has, seed it locally before declaring
the shot impossible. Then say exactly what failed.

## Framing

- Default viewports: **1440×900** (desktop) and **390×844** (mobile),
  unless the repo documents breakpoints. Capture both widths for each
  location. Emulate a fixed viewport; do not resize a random window.
- Frame both sides of a pair at the same dimensions, even when one state
  is taller.
- Keep the heading or label that names the thing, nearby controls, and a
  little padding. For hover, focus, or an open menu, keep the trigger and
  the overlay in one frame.
- Crop browser chrome, app navigation, and regions the change does not
  touch. For full-width layouts, shrink the viewport instead of leaving a
  wide empty band.

## Redact

Blur only private values: emails, usernames, customer or organization
names and slugs, IDs, and internal hostnames. Keep keys, labels, and
non-sensitive values readable. Paint over each region before blurring it
so the blur cannot be reversed. Do not use solid black boxes, and do not
blur whole tables.

Read every image before upload and remove credentials: tokens, auth
headers, cookies, signed URLs, secret keys, and webhook endpoints.

## Tables in the body

| Change | Shape |
|--------|--------|
| Visual change to existing UI | An **As-is / To-be** table. If a location the diff reaches looks the same, put it in an **Unchanged** table with one image, not a pair. |
| New page or feature | No as-is. A few to-be screenshots, each introduced by a short sentence — or a `Location \| Screenshot` table when the new UI appears in several places. |
| No visible difference | One line under Evidence that the UI is unchanged. Do not attach screenshots, and do not stay silent (silence looks like a missed shot). |

Give each image alt text that names the row, side, and width, such as
`Log list, as-is, desktop`. Use Markdown tables so `gh --attach` can
rewrite the image references. Switch to an HTML table only when a cell
must span rows; `<img src="./x.png">` is not rewritten automatically
(attach first, copy the uploaded URLs into the tags, then write the
final body).

## Upload with gh

`gh pr create`, `gh pr edit`, `gh pr comment`, and the matching `gh
issue` commands accept `--attach '<path>#<alt text>'` from **gh 2.99.0**
onwards. Images and videos up to **10MB**. If `gh` rejects the flag, ask
for an upgrade. Do not push an assets branch, commit the images, or
upload through the browser comment box.

Write the body with relative Markdown image references, then pass the
same paths to `--attach`. gh uploads each file and rewrites the matching
reference to the uploaded URL:

```bash
gh pr edit 123 --body-file pr-body.md \
  --attach './shots/list-as-is-desktop.png#Log list, as-is, desktop' \
  --attach './shots/list-to-be-desktop.png#Log list, to-be, desktop' \
  --attach './shots/list-as-is-mobile.png#Log list, as-is, mobile' \
  --attach './shots/list-to-be-mobile.png#Log list, to-be, mobile'
```

- Paths resolve against the current directory and must match the body's
  references exactly.
- Unreferenced attachments are appended at the end of the body as
  `![alt](url)`.
- `gh pr edit --attach` without a body flag keeps the existing body and
  appends the images.
- Fetch the current body again before writing over a body the user may
  have edited. Keep their wording; swap in only your rows and URLs.
- Removing an image from the body does not delete the uploaded file.
- When a later commit changes what a screenshot shows, retake the
  affected pairs and update the body.

## If you cannot attach

`--attach` works only with **user** auth. A GitHub App installation token
(`ghs_…`) fails with `unsupported authentication type`. Do not work
around this with a different upload path.

Hand off a short note that includes:

1. The PR number and the body file path
2. Each image path, alt text, and viewport
3. The exact `gh pr edit … --body-file … --attach …` command to run
4. Where the files live, or how to obtain them

Then stop and wait for someone with user auth to attach them.
