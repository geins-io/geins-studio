---
name: geins-release
description: "Run a Geins Studio release end to end: backup tags, version bump + CHANGELOG on next, next→main squash PR with @claude review, deploy verification on geins.studio (Vercel) and litium.studio (Azure), GitHub release, then reset next to main, retarget feature branches and move released Linear issues from Ready for QA testing to Done. Also the hotfix flow (H0–H8): ship a fix from main without next's unreleased work, then merge main back into next instead of the reset. Use whenever cutting, shipping or publishing a release or hotfix. Trigger on: release, cut a release, ship vX.Y.Z, release next to main, bump version, changelog for release, gh release, reset next, retarget branches after release, hotfix, ship from main, patch release without next, merge main into next."
metadata:
  short-description: Geins Studio release flow (next → main) + hotfix (main only)
---

# Geins Studio — Release Flow

Releases squash `next` into `main` as one commit, so `next` diverges from `main` afterwards and is reset to it (step 7).

A fix that can't wait for `next`'s unreleased work ships as a **hotfix** from `main` — see [Hotfix](#hotfix--ship-from-main-without-next) (steps H0–H8). It reuses steps 2 and 4–6.

There is no release workflow — releases are run by hand with this skill, and the `vX.Y.Z` tag comes from `gh release create` (step 6).

## Ground rules

- **Every outward step needs the releasing developer's go-ahead**: the release commit + push, opening the PR, the merge, the GitHub release, and resetting `next`. Present what will happen, wait for a clear yes. One "yes, release" up front can cover the whole run if they say so.
- **Never `gh pr merge --delete-branch`** on the release PR — its head is `next`.
- **Never force-push `main`.** The only force-push to `next` is the step 7 reset, with `--force-with-lease`.
- Use Node 24 (`export PATH="$(ls -d ~/.nvm/versions/node/v24*/bin | tail -1):$PATH"`) before any `pnpm` command.

## 0. Pick the version

```bash
git fetch origin --prune
git log --oneline origin/main..origin/next
gh pr list --base next --state merged --limit 50 --json number,title,mergedAt
```

No `--tags`: a stale local tag fails the whole fetch (`would clobber existing tag`), and nothing here needs tags.

Semver from what's in `origin/main..origin/next`: any `feat` → minor, only `fix`/`chore`/`refactor` → patch. The developer decides — features can ship as a patch. Confirm `X.Y.Z` before starting.

## 1. Backup tags

```bash
git tag backup/main-pre-vX.Y.Z origin/main
git tag backup/next-pre-vX.Y.Z origin/next
git push origin backup/main-pre-vX.Y.Z backup/next-pre-vX.Y.Z
```

If a feature branch is in flight and its local and remote tips differ, push a backup branch of each tip too.

## 2. Bump version + CHANGELOG on `next`

```bash
git checkout next && git pull --ff-only
```

- `package.json` → `"version": "X.Y.Z"`. It feeds the `app-version` meta tag (`nuxt.config.ts`), so it must be bumped.
- Prepend a section to `CHANGELOG.md` right under `# Changelog`, matching the existing format:

```markdown
## vX.Y.Z - YYYY-MM-DD

### 🚀 Enhancements

- Area — what users can now do ([#NNN](https://github.com/geins-io/geins-studio/pull/NNN))

### 🐛 Bug Fixes

- Area — what no longer goes wrong ([#NNN](https://github.com/geins-io/geins-studio/pull/NNN))

### ❤️ Contributors

- Name ([@handle](https://github.com/handle))
```

Use only the headings that have entries, in this order:

| Heading | For |
| --- | --- |
| `### 🚀 Enhancements` | new features and capabilities (`feat`) |
| `### 🐛 Bug Fixes` | fixes users would notice (`fix`) |
| `### 🔄 Refactor` | notable restructures with a user-facing effect, e.g. performance (`refactor`) |
| `### 📖 Documentation` | docs that ship with the app or affect how it's used (`docs`) |
| `### 🏡 Chore` | noteworthy maintenance — dependency/runtime upgrades, build or deploy changes (`chore`, `ci`, `build`) |
| `### ❤️ Contributors` | always last |

Write it by hand from the merged PRs:

- **Important, user-noticeable changes only.** No cosmetic tweaks, no test-only work, no routine tooling churn. Fold several PRs on one feature into one bullet.
- Plain user language, sentence case, lead with the area ("Assets library — …").
- **Security fixes: impact only.** Say what is now protected, in user terms, under `Security — …`. Never the exploit, the affected endpoint or how it could be abused. E.g. "Security — server logs no longer include request payloads or authentication tokens".
- Contributors = authors of the included PRs (`gh pr view N --json author`).

Show the developer the section before committing. Then:

```bash
pnpm lint:check && pnpm typecheck && pnpm build
git add package.json CHANGELOG.md
git commit -m "chore: release vX.Y.Z" -m "Co-Authored-By: <model attribution from the session>"
git push origin next
```

## 3. Release PR `next` → `main`

```bash
gh pr create --base main --head next --title "<type>: <summary> - vX.Y.Z" --body "<the CHANGELOG section>"
gh pr comment <n> --body "@claude review"
```

Title is the release's squash commit on `main`, e.g. `fix: assets library bug fixes - v0.6.1`. The body ends with the PR attribution line.

Wait for the review without polling: watch the `claude.yml` run in the background (`gh run watch <run-id>` with `run_in_background`, or a Monitor), then read the review comment. Triage **every** finding — fix on `next` (new commit, push; the PR updates) or skip with a one-line reason in a PR reply. Release-blocking findings stop the release until fixed.

Wait for checks to go green: `gh pr checks <n> --watch`.

## 4. Squash-merge

```bash
gh pr merge <n> --squash          # NO --delete-branch: head is next
git fetch origin
MAIN_SHA=$(git rev-parse origin/main)
```

## 5. Watch the deploys

The merge to `main` triggers two production deploys:

| Host | How | Expected `app-version` |
| --- | --- | --- |
| geins.studio | Vercel Git integration | `X.Y.Z+dev` (Vercel builds have no `GIT_SHA`) |
| litium.studio | `.github/workflows/deploy.yml` (Build & Push → staging slot → swap) | `X.Y.Z+<MAIN_SHA>` |

```bash
gh run list --workflow deploy.yml --branch main --limit 1
gh run watch <run-id>             # in the background; prod / prod-swap environments may wait for approval
curl -s https://geins.studio/ | grep -o '<meta name="app-version"[^>]*>'
curl -s https://litium.studio/ | grep -o '<meta name="app-version"[^>]*>'
curl -s https://studio-prod-app.azurewebsites.net/ | grep -o '<meta name="app-version"[^>]*>'
curl -s https://studio-prod-app-staging.azurewebsites.net/ | grep -o '<meta name="app-version"[^>]*>'
```

Both hosts must show the new version before moving on. Check both Azure slots too: after the swap the production slot shows `X.Y.Z+<MAIN_SHA>` and the staging slot the previous release. Anything else means the staging slot didn't pull the new image, so the swap made an older build live. If any check fails, stop and report it before creating the GitHub release. For a lagging geins.studio, check the Vercel side with `vercel ls geins-studio --prod` and `vercel inspect <deployment-url> --logs`.

## 6. GitHub release

`gh release create` also creates the `vX.Y.Z` tag on `MAIN_SHA`.

```bash
awk '/^## vX\.Y\.Z /{f=1;next} /^## v/{f=0} f' CHANGELOG.md > "$TMPDIR/notes.md"
gh release create vX.Y.Z --target "$MAIN_SHA" --title vX.Y.Z --notes-file "$TMPDIR/notes.md" --latest
```

Check the notes rendered (`gh release view vX.Y.Z`).

## 7. Reset `next` to `main`

The squash leaves `next` holding the pre-squash commits, so it is reset to `main`. This is the one sanctioned force-push to `next` (see `CLAUDE.md` Hard Blocks) — only here, only with `--force-with-lease`, only after the release PR is merged.

Check nothing landed on `next` after the merge — the reset would drop it:

```bash
git fetch origin
git diff --stat origin/main origin/next   # must be empty: next's tree == the squash commit
gh pr list --base next --state open       # these stay open; their branches get step 8
```

If the diff isn't empty, stop and ask the developer — those changes must be merged to `main` or re-applied on the new `next` first. Then:

```bash
NEXT_SHA=$(git rev-parse origin/next)
git push --force-with-lease=next:"$NEXT_SHA" origin origin/main:refs/heads/next
git checkout next && git reset --hard origin/main
```

The lease refuses the push if anyone pushed to `next` since the fetch. Open PRs into `next` stay open (unlike deleting the branch, which closes them); their diffs look noisy until step 8. Other checkouts and worktrees on `next` need `git fetch && git reset --hard origin/next`.

## 8. Retarget feature branches

For each in-flight feature branch:

```bash
git checkout <branch>
git merge next                    # merge, NOT rebase
git push
```

Rebase replays every `chore: wip` commit against the squashed history and conflicts repeatedly; a 3-way merge collapses the duplicates in one pass. The feature PR is squash-merged later, so the merge commit never lands on `next`. Once merged, the open PR's diff against `next` shows only the feature's own changes again.

## 9. Close out

- **Linear: move released issues from Ready for QA testing to Done.** A release is what makes an issue Done — QA doesn't move issues by hand, so this step is the only way they get there. List the column (`list_issues`, `state: "Ready for QA testing"`) and set each issue whose work is now on `main` to `Done` (`save_issue`, `state: "Done"`). The release squash commit lists the squashed commits, so it holds most of the ids:

  ```bash
  git log -1 "$MAIN_SHA" --format=%B | grep -oE 'STU-[0-9]+' | sort -u
  ```

  For an issue not in that list, `git log origin/main --grep=STU-NNN` (or its PR) decides. Issues whose work isn't on `main` yet — merged to `next` after the release PR — stay in QA.
- Report back: version, release URL, `app-version` on both hosts, the issues moved to Done (and any left in QA), PR review triage, and any follow-ups.

## Hotfix — ship from `main` without `next`

For a fix that can't wait until `next`'s unreleased work is ready (v0.6.2 scrubbed secrets from server logs this way). The fix ships from `main` alone, and `next` gets it afterwards through a merge instead of the step 7 reset. The ground rules above apply unchanged.

- **Approval:** the releasing developer approves each outward step, and the hotfix PR always gets the `@claude review`, even for a one-line diff. A hotfix skips `next`'s QA cycle, so the review is its second look.
- **A hotfix runs `main`'s tooling, not `next`'s**: `.github/workflows/`, `package.json` scripts, `vitest.config.ts`. A fix that only exists on `next` doesn't apply (H2, H3).

### H0. Pick the version

Patch bump from `main`'s version: `git show origin/main:package.json | grep '"version"'`.

### H1. Backup tag

```bash
git fetch origin --prune             # no --tags, see step 0
git tag backup/main-pre-vX.Y.Z origin/main
git push origin backup/main-pre-vX.Y.Z
```

`next` only gets a merge (H6), so it needs no backup.

### H2. Branch from `main`, check its deploy workflow

Branch from `origin/main` (in a worktree if the main checkout is busy with other sessions), then compare `main`'s workflows with `next`'s:

```bash
git checkout -b fix/{issue}-hotfix-{desc} origin/main
git diff origin/main origin/next -- .github/workflows/
```

`main`'s `deploy.yml` is what deploys this hotfix. If a deploy fix exists only on `next`, add the same change to the hotfix, limited to the workflow file. v0.6.2 missed this: `main`'s `deploy.yml` deployed the mutable `:main` image tag, the staging slot never pulled the new image, and the swap put 0.6.0 live on litium.studio until a follow-up fix to `main`.

Make the fix. On the same branch, bump `package.json` to `X.Y.Z` and prepend the `CHANGELOG.md` section (format and security wording: step 2).

### H3. Preflight

```bash
pnpm lint:check && pnpm typecheck && pnpm build
pnpm test:changed                    # if main's package.json lacks it: pnpm test --run
```

Run `pnpm build` locally whatever `main`'s CI gate does — it may not build. Vitest excludes `**/.claude/**`, so in a `.claude/worktrees/` checkout it finds no tests; the PR's CI quality gate is then the only test run (H4).

### H4. PR → `main`, review, preview check

```bash
git push -u origin fix/{issue}-hotfix-{desc}
gh pr create --base main --title "fix: <summary> - vX.Y.Z" --body "<what/why, Verification, the CHANGELOG section>"
gh pr comment <n> --body "@claude review"
```

Triage the review as in step 3, and wait for checks to go green (`gh pr checks <n> --watch`, in the background).

**Preview check before merge**, when the fix is visible in the app (UI or API behaviour): test it on the PR's Vercel preview. **The preview hits the production Management API**, so it works on real merchant data. Check read-only where you can; if the check has to write, use data made for the test and remove it after. Fixes a preview can't show (server logs, CI) skip the check, and the PR's Verification section says why.

### H5. Merge, deploys, GitHub release

Steps 4–6, with the hotfix PR in place of the release PR. Its head is the hotfix branch, not `next`, so delete it after the merge (`git push origin --delete fix/{issue}-hotfix-{desc}`). Both hosts must show `X.Y.Z` and the Azure slots must pass step 5's check before the GitHub release.

### H6. Merge `main` into `next` — never reset

`next` holds unreleased work, so step 7's reset would drop it. Bring `main` in with a merge PR instead:

```bash
git fetch origin --prune
git checkout -b chore/sync-main-vX.Y.Z origin/next
git merge origin/main
git push -u origin chore/sync-main-vX.Y.Z
gh pr create --base next --title "chore: merge main (vX.Y.Z hotfix) into next" --body "<why + the merge-commit note below>"
gh pr merge <n> --merge --auto       # merge commit, NOT squash
```

- **Merge, not cherry-pick**, so the version bump and the `CHANGELOG.md` section come along. Otherwise the next release's squash conflicts at the top of `CHANGELOG.md`.
- **`--merge`, not `--squash`** — the one PR into `next` that isn't squashed. It keeps `main`'s hotfix commit an ancestor of `next`, so the next release squashes cleanly and step 7's `git diff origin/main origin/next` check works as usual.
- The PR's diff should be exactly the hotfix: the fix, `package.json` and the CHANGELOG section. On a conflict, keep both `next`'s work and the hotfix's change.

### H7. The next regular release

Runs the normal flow from step 0. Its version bumps from the hotfix version, its CHANGELOG section goes above the hotfix's, and the step 7 reset works because `next` now contains `main`.

### H8. Linear + report

The hotfix issue goes straight to **Done** once H5's checks pass: it's released, and its QA was the preview check (H4). It never sits in Ready for QA testing. Report back as in step 9: version, release URL, `app-version` on both hosts and both slots, the review triage, and the sync PR.

### Workflow-only hotfix

A fix to `main`'s CI or deploy workflows alone, with no app change: skip H0 and leave out the version bump, the CHANGELOG section and the GitHub release. The deploys still run, so litium.studio and the production slot should show the current version with the new merge SHA. Skip H6 only when `next` already has the identical change — a 3-way merge of identical edits is clean, so the next release isn't affected.
