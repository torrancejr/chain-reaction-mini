const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  baseBuilder: {
    ownerAddress: "0x6cEF30c2546ce5E9a6D160B34112Fbb080BEDeb6",
  },
  miniapp: {
    version: "1",
    name: "Chain Reaction",
    subtitle: "Social Domino Game",
    description: "A single global chain of dominoes. Extend the chain to grow the pot, or break it to claim the prize. Risk vs reward – who blinks first?",
    screenshotUrls: [],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#BFE6EF",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["game", "social", "strategy", "domino"],
    heroImageUrl: `${ROOT_URL}/minikit-hero.png`,
    tagline: "Build the chain. Risk the pot. Break it all.",
    ogTitle: "Chain Reaction – Social Domino Game",
    ogDescription: "Extend the chain or break it to claim the pot. A social game of risk and reward.",
    ogImageUrl: `${ROOT_URL}/minikit-hero.png`,
  },
} as const;
