import { Helmet } from "react-helmet-async";
import BountyDefiCard from "@/components/earn/BountyDefiCard";

export default function Earn() {
  return (
    <>
      <h1 className="sr-only">Bounty earnings compounded into Solana DeFi</h1>
      <BountyDefiCard />
    </>
  );
}
