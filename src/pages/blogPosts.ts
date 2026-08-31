export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  file: string;
  description: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "the-airdrop-that-held",
    title: "The Airdrop That Held — $ANSEM Case Study",
    date: "Aug 2026",
    category: "Onchain Research",
    excerpt:
      "Most airdrops bleed out the moment they land. $ANSEM held a ~$100M+ market cap while dropping tokens on repeat — by scoring wallets and rewarding the holders.",
    file: "/blog/ansem-case-study.html",
    description:
      "How $ANSEM used wallet scoring and staggered, recurring airdrops to hold a ~$100M+ market cap while still distributing tokens.",
  },
  {
    slug: "give-it-away-watch-it-leave",
    title: "Give It Away, Watch It Leave",
    date: "Aug 2026",
    category: "Onchain Research",
    excerpt:
      "Six DeFi projects, two ways to pay for growth. Token-funded airdrops bought an overnight holder base — then watched almost all of it sell and leave.",
    file: "/blog/holder-retention.html",
    description:
      "Six DeFi projects compared: token-funded airdrops versus cash-funded growth, and whether the original recipients actually stayed.",
  },
];

export const getPost = (slug?: string) => blogPosts.find((p) => p.slug === slug);
