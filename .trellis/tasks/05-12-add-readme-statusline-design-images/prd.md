# Add README statusline design images

## Goal

Add the two user-provided Claude Code statusline design images to the project README preview area so readers can see the visual design in addition to the existing text-only terminal sample.

## What I already know

* The user provided two image files and asked to put them in the README.
* Source images:
  * `/Users/Akira/.claude/image-cache/c9382e7b-69e5-409a-b77d-9c527e36e23f/1.png`
  * `/Users/Akira/.claude/image-cache/c9382e7b-69e5-409a-b77d-9c527e36e23f/2.png`
* The repository has both `README.md` and `README.zh.md` with matching preview sections.
* No existing `assets`, `images`, or `docs` asset directory was found within max depth 3.

## Assumptions (temporary)

* Store README images in a new repo-local asset directory.
* Update both English and Chinese README files for consistency.
* Keep the existing text preview block and add the images around it rather than replacing documentation content.

## Open Questions

* None currently blocking; the request is direct and the bilingual README convention is clear from the repo.

## Requirements

* Copy both provided images into a stable repository path suitable for README references.
* Add both images to the Preview section of `README.md`.
* Add both images to the Preview section of `README.zh.md`.
* Keep alt text descriptive and language-appropriate.

## Acceptance Criteria

* [ ] Both images are present in the repository under a README asset path.
* [ ] `README.md` renders links to both images in the preview section.
* [ ] `README.zh.md` renders links to both images in the preview section.
* [ ] Markdown formatting is valid and readable.
* [ ] `git status` shows only intended task, README, and asset changes.

## Definition of Done

* Build/check commands are run where relevant for documentation-only changes.
* Docs are updated because this task is explicitly documentation-focused.
* Rollback is straightforward by removing the copied images and README references.

## Out of Scope

* Changing CLI rendering behavior.
* Redesigning the README structure beyond inserting the two images.
* Publishing a release unless separately requested after verification.

## Technical Notes

* Files inspected: `README.md`, `README.zh.md`.
* Existing preview sections are near the top of both README files.
* No external research needed; this is a local documentation asset update.
