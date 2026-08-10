import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Collapsible card used on the Account page. Header styling matches the
 *  'Bounty Promotions' section title. */
export const AccountAccordionCard = ({ title, subtitle, open, onToggle, children }: Props) => (
  <div className="rei-surface" style={{ padding: '24px' }}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex items-start justify-between gap-4 w-full"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
    >
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#f0ede8', margin: 0, letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        {subtitle && <p style={{ fontSize: '12px', color: '#5c5a57', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      <ChevronDown
        className="h-4 w-4 flex-shrink-0"
        style={{ color: '#a09e9a', transition: 'transform 200ms ease', transform: open ? 'rotate(180deg)' : 'none', marginTop: 4 }}
      />
    </button>
    {open && <div style={{ marginTop: 18 }}>{children}</div>}
  </div>
);

export default AccountAccordionCard;
