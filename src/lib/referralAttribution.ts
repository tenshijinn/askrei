/**
 * Referral attribution held on the client after a visitor lands on /r/:code.
 * The stored code/session is what links a later signup, package purchase or
 * booking click back to the promoter who sent them.
 */
export interface ReferralAttribution {
  referralCode?: string;
  referralSessionId?: string;
}

const CODE_KEY = "referral_code";
const SESSION_KEY = "referral_session_id";

export function getReferralAttribution(): ReferralAttribution {
  try {
    const code = localStorage.getItem(CODE_KEY) || undefined;
    const session = localStorage.getItem(SESSION_KEY) || undefined;
    const out: ReferralAttribution = {};
    if (code) out.referralCode = code;
    if (session) out.referralSessionId = session;
    return out;
  } catch {
    return {};
  }
}

/**
 * Stores attribution from a /r/:code landing. The first referral wins — a later
 * visit through a different link does not overwrite an existing attribution.
 */
export function setReferralAttribution(code: string, sessionId: string) {
  try {
    if (!localStorage.getItem(CODE_KEY)) {
      localStorage.setItem(CODE_KEY, code);
      localStorage.setItem(SESSION_KEY, sessionId);
    }
  } catch {
    /* ignore */
  }
}

export function hasReferralAttribution(): boolean {
  return !!getReferralAttribution().referralCode;
}

/** Flat string map for passing attribution through Stripe checkout metadata. */
export function referralMetadata(): Record<string, string> {
  const { referralCode, referralSessionId } = getReferralAttribution();
  if (!referralCode) return {};
  return {
    referral_code: referralCode,
    ...(referralSessionId ? { referral_session_id: referralSessionId } : {}),
  };
}
