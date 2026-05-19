import type { ReactNode } from 'react';

/**
 * Single source of truth for walkthrough card copy that is shared
 * between the registration tour (signup screen) and the logged-in
 * tour (after registration / edit profile).
 *
 * Update copy here and both flows stay in sync.
 */
export interface WalkthroughCopy {
  title: string;
  body: ReactNode;
}

const strong = (s: string) => <strong style={{ color: '#f0ede8' }}>{s}</strong>;

export const walkthroughCopy: Record<string, WalkthroughCopy> = {
  voiceIntro: {
    title: 'Record your voice intro',
    body: (
      <p style={{ margin: 0 }}>
        Tap the mic and talk for up to {strong('60 seconds')}. Tell Rei who you are,
        what you build, and what kind of work you're looking for. Rei listens and
        uses your voice to find the best bounties for you.
      </p>
    ),
  },
  portfolio: {
    title: 'Add a portfolio link',
    body: (
      <p style={{ margin: 0 }}>
        Drop a link to your {strong('GitHub')}, {strong('site')}, or any page that
        shows your work. This is optional, but it helps Rei match you to better paid work.
      </p>
    ),
  },
  roleTags: {
    title: 'Pick your role tags',
    body: (
      <p style={{ margin: 0 }}>
        Tap the tags that match what you do — like {strong('Developer')},{' '}
        {strong('Design')}, or {strong('Community')}. Pick as many as fit. Rei uses
        these to filter bounties so you only see jobs you can actually do.
      </p>
    ),
  },
  wallet: {
    title: 'Connect your wallet',
    body: (
      <p style={{ margin: 0 }}>
        Connect a {strong('Solana wallet')} so Rei can pay you when you complete
        bounties. Your wallet stays linked to your X account, so you only do this once.
      </p>
    ),
  },
  submit: {
    title: 'Submit your details',
    body: (
      <p style={{ margin: 0 }}>
        When all the steps are done, hit {strong('Register')}. Rei will analyze
        your intro, your wallet, and your roles, then build a profile so it can
        start matching you to live work.
      </p>
    ),
  },
  reanalyze: {
    title: 'Re-analyze your profile',
    body: (
      <p style={{ margin: 0 }}>
        Already recorded an intro? Tick {strong('Use existing introduction')} and
        Rei will re-run the AI analysis with your updated wallet and tags — no
        need to record again.
      </p>
    ),
  },
  editProfile: {
    title: 'Edit your profile',
    body: (
      <p style={{ margin: 0 }}>
        Click {strong('Edit Profile')} to record a new voice intro, change your
        role tags, add a portfolio link, or update your wallet. You can also tap{' '}
        {strong('Re-analyze')} to have Rei look at your profile again — no need
        to record again.
      </p>
    ),
  },
};
