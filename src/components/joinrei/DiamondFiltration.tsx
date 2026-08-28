/**
 * Embeds the self-contained anime.js filtration animation
 * (public/diamond-filtration.html) in an isolated iframe so its
 * styles/scripts never collide with the rest of the app.
 */
interface DiamondFiltrationProps {
  className?: string;
  height?: string | number;
}

export const DiamondFiltration = ({ className = '', height = 320 }: DiamondFiltrationProps) => (
  <iframe
    src="/diamond-filtration.html"
    title="Diamond Filtration"
    loading="lazy"
    scrolling="no"
    className={`block border-0 bg-transparent ${className}`}
    style={{ height }}
  />
);

export default DiamondFiltration;
