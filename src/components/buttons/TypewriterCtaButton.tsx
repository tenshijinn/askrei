import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';

interface Props {
  /** Text that types out on hover (e.g. "Sign up with") */
  prefix: string;
  /** Trailing typed text after the badge (e.g. "Twitter") */
  suffix?: string;
  /** Icon rendered before prefix (e.g. <Twitter />) */
  icon?: ReactNode;
  /** Small inline node between prefix and suffix (e.g. verified badge) */
  badge?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** ms each char takes to type on hover */
  speed?: number;
  /** ms the "> running…" state is shown before onClick fires */
  runningMs?: number;
}

/**
 * btn-manga style button that retypes its label on hover (pure-JS typewriter)
 * and shows "> running…▍" on click before invoking onClick.
 * Once clicked the label stays in running state — the page usually navigates
 * away before it ever reverts. If no navigation happens, it falls back after
 * runningMs so the user isn't stuck.
 * Preserves an optional icon + inline badge between prefix and suffix.
 */
export const TypewriterCtaButton = ({
  prefix,
  suffix,
  icon,
  badge,
  onClick,
  disabled,
  className = 'btn-manga btn-manga-primary',
  style,
  speed = 28,
  runningMs = 1200,
}: Props) => {
  const [prefixText, setPrefixText] = useState(prefix);
  const [suffixText, setSuffixText] = useState(suffix ?? '');
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => clear(), []);

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const typeBoth = () => {
    clear();
    setPrefixText('');
    setSuffixText('');
    [...prefix].forEach((_, i) => {
      timers.current.push(setTimeout(() => setPrefixText(prefix.slice(0, i + 1)), i * speed));
    });
    const offset = prefix.length * speed + 60;
    if (suffix) {
      [...suffix].forEach((_, i) => {
        timers.current.push(setTimeout(() => setSuffixText(suffix.slice(0, i + 1)), offset + i * speed));
      });
    }
  };

  const handleEnter = () => {
    if (running || disabled || reduced) return;
    typeBoth();
  };
  const handleLeave = () => {
    if (running) return;
    clear();
    setPrefixText(prefix);
    setSuffixText(suffix ?? '');
  };
  const handleClick = () => {
    if (running || disabled) return;
    setRunning(true);
    clear();
    // Fire the action after a brief flash. We do NOT revert running state
    // beforehand — if the action navigates away the component unmounts.
    // If it doesn't navigate, runningMs is the safety fallback.
    setTimeout(() => {
      onClick?.();
      // Safety reset for non-navigating actions (e.g. a modal open)
      setTimeout(() => {
        setRunning(false);
        setPrefixText(prefix);
        setSuffixText(suffix ?? '');
      }, 400);
    }, runningMs);
  };

  if (running) {
    return (
      <button
        className={className}
        disabled={disabled}
        style={style}
        onClick={(e) => e.preventDefault()}
      >
        <span className="animate-pulse" style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}>
          {'> running…'}
          <span className="inline-block w-[1ch] animate-pulse">▍</span>
        </span>
      </button>
    );
  }

  return (
    <button
      className={className}
      disabled={disabled}
      style={style}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onClick={handleClick}
    >
      {icon}
      <span>{prefixText}</span>
      {badge}
      {suffix !== undefined && <span>{suffixText}</span>}
    </button>
  );
};
