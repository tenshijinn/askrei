# Explain the TanStack Start upgrade

## Scope
- Provide instructions only; do not modify the project or start a migration.
- Clarify that the upgrade is not automatic in the backend and requires an explicit action and confirmation.

## Steps for the user
1. Open this project in Lovable.
2. Start the upgrade from one of these entry points:
   - Type `/` in the chat and choose **Migrate to TanStack Start**.
   - Open **Project settings → Project actions → Migrate to TanStack Start**.
   - Ask Lovable: **“Migrate this project to TanStack Start.”**
3. Review and confirm the upgrade card when shown.
4. Let Lovable run the preflight, migration, build checks, and route verification.
5. Test the preview, then publish only when satisfied.

## What to expect
- The app’s pages, auth/admin guards, metadata, analytics, styling, and app-used backend code are migrated where supported.
- Externally called backend endpoints such as payment webhooks and scheduled jobs retain their existing addresses.
- The current live site remains unchanged until the upgraded version is published.
- The migration uses credits, may take several minutes, and can be continued if it pauses.
- If needed, revert the migration message from chat history.

## Current project note
- This project is eligible as a Classic Vite + React Router project, but no migration should be started because the user requested instructions only.
- The captured dynamic-module preview error is separate from the upgrade question and should not be changed as part of this instructions-only response.
