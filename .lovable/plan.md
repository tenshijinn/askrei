# Replace section 4 image on `/` and `/joinrei`

Section 4 on both pages is the "cross-platform exposure / earn points" panel, which renders `src/assets/joinrei/rei-cross-platform.png` on the left half of the screen.

## Change

- Overwrite `src/assets/joinrei/rei-cross-platform.png` with the uploaded photo (neon "Building Open Finance Rails" rooftop shot).

Because both `HomeValueProp` (used on `/`) and `JoinReiValueProp` (used on `/joinrei`) import the same asset, a single file swap updates both pages. No component or code edits needed.

## Notes

- Image keeps `object-cover` full-height treatment — composition will be center-cropped on tall viewports.
- Alt text remains "Rei cross-platform exposure"; let me know if you want it updated to reflect the new image.
