import { useEffect, useRef } from "react";
import { walletKey } from "./model";

function randomFor(key: string) {
  let hash = 2166136261;
  for (const char of key) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return () => { hash ^= hash << 13; hash ^= hash >>> 17; hash ^= hash << 5; return (hash >>> 0) % 10000 / 10000; };
}

export function PixelAvatar({ address, className = "" }: { address: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const tokens = getComputedStyle(canvas);
    const backgrounds = ["--diamond-avatar-mint", "--diamond-avatar-ice", "--diamond-avatar-peach"];
    const foregrounds = ["--diamond-avatar-ink", "--diamond-avatar-rose", "--diamond-avatar-teal"];
    const random = randomFor(`${walletKey(address)}pfp`);
    ctx.fillStyle = tokens.getPropertyValue(backgrounds[Math.floor(random() * backgrounds.length)]).trim();
    ctx.fillRect(0, 0, 10, 10);
    const first = tokens.getPropertyValue(foregrounds[Math.floor(random() * foregrounds.length)]).trim();
    const second = tokens.getPropertyValue(foregrounds[Math.floor(random() * foregrounds.length)]).trim();
    for (let y = 2; y < 8; y++) for (let x = 2; x < 5; x++) {
      const value = random();
      if (value < 0.55) {
        ctx.fillStyle = value < 0.15 ? second : first;
        ctx.fillRect(x, y, 1, 1);
        ctx.fillRect(9 - x, y, 1, 1);
      }
    }
  }, [address]);
  return <canvas ref={ref} width={10} height={10} aria-hidden="true" className={`diamond-pixel ${className}`} />;
}