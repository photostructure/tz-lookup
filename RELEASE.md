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
5. Wait for the tag-bound **Stage npm Release** workflow to finish.

The first workflow runs the full test matrix, creates a signed release commit
and tag, and starts the second workflow at that tag. The second workflow
validates the tag, packs and verifies the exact source tarball, stages it on
npm, and creates the GitHub release.

## Approve the npm stage

1. Open **Staged Packages** from the npm user menu.
2. Confirm the package name, version, file list, metadata, and provenance.
3. Confirm that the provenance identifies this repository, `publish.yaml`, the
   release tag, and the signed tag commit.
4. Approve the staged package with 2FA.
5. Confirm that npm lists the version publicly.
6. Confirm that the GitHub release exists and is immutable.

## Recover from a failed release

- If the pre-tag test fails, fix `main` and start a new release run.
- If the tag push succeeds but publisher dispatch fails, rerun only the
  dispatch job or start `publish.yaml` manually at the existing signed tag.
- If the tagged workflow is defective, fix `main` and release a new version.
  Never move the existing tag.
- If the staged contents are wrong, reject the stage and release a new version.
- If npm publishes a bad release, deprecate it or publish a corrected version.
  Never overwrite a published version.
