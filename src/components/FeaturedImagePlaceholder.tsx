interface FeaturedImagePlaceholderProps {
  title: string;
  compact?: boolean;
}

const FeaturedImagePlaceholder = ({ title, compact = false }: FeaturedImagePlaceholderProps) => (
  <div
    className={`relative flex w-full items-center justify-center overflow-hidden border border-dashed border-border bg-card ${
      compact ? "aspect-[16/7]" : "aspect-[16/6]"
    }`}
    aria-label={`Featured image placeholder for ${title}`}
  >
    <div className="absolute inset-3 border border-border/60" />
    <div className="relative flex flex-col items-center gap-2 px-6 text-center">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        Featured image
      </span>
      <span className="text-xs text-muted-foreground">Image coming soon</span>
    </div>
  </div>
);

export default FeaturedImagePlaceholder;
