# Release procedure

Releases use signed Git tags and npm staged publishing. The workflow stages an
exact package, but a maintainer must approve that package with two-factor
authentication (2FA) before npm makes it public.

Do not create or move a release tag manually. Do not run `npm publish` from a
workstation.

## Prepare the release

1. Land all release notes and other changes on `main`.
2. Wait for the ordinary `main` build to pass.
3. Confirm that `main` has not moved to a different commit.

## Stage the package

1. Open **Build & Prepare Release** in GitHub Actions.
2. Select **Run workflow** on `main`.
3. Choose `patch`, `minor`, or `major` from the consumer-visible change.
4. Wait for **Build & Prepare Release** to finish.
5. In the tag-bound **Stage npm Release** workflow, wait for the **Stage
   package on npm** job to finish. Leave the workflow running: its **Create
   immutable GitHub release** job waits for your npm approval.

## How the release works

- `build.yml` (**Build & Prepare Release**) runs the full test matrix, bumps the
  version, pushes a signed release commit and annotated tag, and starts
  `publish.yaml` at that tag.
- `publish.yaml` (**Stage npm Release**) validates the tag, packs and verifies
  the exact source tarball, and stages it with `npm stage publish`. npm trusts
  only this workflow file, by name, to stage the package, so renaming it means
  changing the package's trusted-publisher settings on npmjs.com.
- npm validates a staged package, which can take 10 to 30 minutes, then holds it
  until a maintainer approves it with 2FA.
- The **Create immutable GitHub release** job checks npm 10, 20, 35 and 55
  minutes after staging, then every 30 minutes, for up to 5 hours 25 minutes.
  Any npm error other than "not found" (E404) ends the job early. Once npm
  serves the version, it re-verifies the signed tag and creates the
  immutable GitHub release with generated notes. GitHub emails the release to
  the repository's watchers at that moment, so the email always announces a
  version they can install.

## Approve the npm stage

1. Open **Staged Packages** from the npm user menu.
2. Confirm the package name, version, file list, metadata, and provenance.
3. Confirm that the provenance identifies this repository, `publish.yaml`, the
   release tag, and the signed tag commit.
4. Approve the staged package with 2FA.
5. Confirm that npm lists the version publicly.
6. Wait for the **Create immutable GitHub release** job to finish, then confirm
   that the GitHub release exists and is immutable.

## Recover from a failed release

- If the pre-tag test fails, fix `main` and start a new release run.
- If the tag push succeeds but publisher dispatch fails, rerun only the
  dispatch job or start `publish.yaml` manually at the existing signed tag.
- If the tagged workflow is defective, fix `main` and release a new version.
  Never move the existing tag.
- If the staged contents are wrong, reject the stage and release a new version.
- If the **Create immutable GitHub release** job fails before it creates the
  release (its checks ran out before you approved the stage, or `npm view`
  failed with an error other than E404), approve the stage if you have not,
  then use **Re-run failed jobs** on that **Stage npm Release** run. GitHub
  allows re-runs for 30 days. Do not start a new release.
- If npm publishes a bad release, deprecate it or publish a corrected version.
  Never overwrite a published version.
