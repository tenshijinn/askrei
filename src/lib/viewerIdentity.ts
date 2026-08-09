/**
 * Identity of the currently signed-in Rei member, as held on the client after
 * X sign-in. Used to attribute campaign impressions/clicks to a member so
 * publishers can see who engaged. Guests send nothing and stay anonymous.
 */
export interface ViewerIdentity {
  viewerXUserId?: string;
  viewerWallet?: string;
}

export function getViewerIdentity(): ViewerIdentity {
  try {
    const raw = localStorage.getItem("rei_twitter_user");
    const xUserId = raw ? (JSON.parse(raw)?.x_user_id as string | undefined) : undefined;
    const wallet = localStorage.getItem("rei_wallet_address") || undefined;
    const out: ViewerIdentity = {};
    if (typeof xUserId === "string" && xUserId) out.viewerXUserId = xUserId;
    if (typeof wallet === "string" && wallet) out.viewerWallet = wallet;
    return out;
  } catch {
    return {};
  }
}
