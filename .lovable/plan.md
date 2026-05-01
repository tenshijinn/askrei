## Goal

The `clear` button in the Rei chatbot looks like it works but doesn't actually reset the conversation context. The next message often behaves as if prior turns are still in play (e.g. answering "find bounties" with a points/profile reply that belongs to an earlier turn).

## Root cause

Three bugs compound:

1. **RLS blocks the delete.** `chat_messages` has only `SELECT` and `INSERT` policies — no DELETE policy for end users. The client-side `supabase.from("chat_messages").delete()...` call in `handleClearChat` silently no-ops. The rows stay in the database.
2. **The `chat_conversations` row is never cleared.** Even when `setConversationId(null)` clears local state, the server-side conversation row still exists and is re-attached on the next reload.
3. **`loadConversation()` re-hydrates everything on mount.** On reload it looks up the conversation by `wallet_address`, finds the old row, and pulls back any messages that survived (which, per #1, is all of them). The "cleared" chat returns.

Net effect: the backend keeps loading the last 3 messages of the old conversation, and the model anchors on stale context (the prior `get_my_profile` / points discussion).

## Plan

### 1. Add a server-authoritative reset path (edge function)

Create a small new edge function `clear-chat-conversation` (verify_jwt validated in code, wallet read from JWT claims):

- Look up the user's `chat_conversations` row by `wallet_address`.
- Delete all `chat_messages` for that conversation.
- Delete the `chat_conversations` row itself.
- Return `{ ok: true }`.

Using a service-role function avoids needing a new RLS DELETE policy on `chat_messages` and guarantees the wipe completes regardless of client RLS. The wallet is taken from the validated JWT, not the request body, so a user can only clear their own conversation.

### 2. Update `handleClearChat` in `src/components/ReiChatbot.tsx`

- Replace the direct `supabase.from("chat_messages").delete()` with `supabase.functions.invoke("clear-chat-conversation")`.
- On success: `setMessages([])`, `setConversationId(null)`, clear both `localStorage` keys (already done), and also clear `displayedContent` state so the typewriter cache doesn't replay old text.
- On failure: show the existing error toast and do NOT clear local state (so the UI stays consistent with the DB).

### 3. Make `loadConversation()` defensive

If a conversation row is found but it has zero messages, treat it as cleared: don't restore it, and clear the localStorage keys. This prevents a stale empty conversation from being silently re-attached.

### 4. Backend already correct after this

`rei-chat` reads the last 3 messages from `chat_messages` filtered by `conversation_id`. Once #1 and #2 wipe the conversation row, the next user message creates a brand-new conversation (existing code path at lines ~309-336), so there is no stale history to bias the model.

## Files to change

- `supabase/functions/clear-chat-conversation/index.ts` — new edge function (service role, JWT-validated wallet).
- `src/components/ReiChatbot.tsx` — update `handleClearChat` to call the new function; make `loadConversation` ignore empty conversations and clear stale localStorage.

## Out of scope / safety

- No RLS changes (we route through service role instead — safer than opening DELETE on `chat_messages`).
- No changes to `rei-chat`, intent classification, prompts, or any UI other than the clear flow.
- No schema changes.
- The only state mutation is deleting the user's own conversation + messages, gated by their authenticated wallet.
