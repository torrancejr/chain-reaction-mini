const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  "https://chain-reaction-mini.vercel.app";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjE1NTQ4NzAsInR5cGUiOiJhdXRoIiwia2V5IjoiMHg2RkM2YUZkM2M2Mjc3ODJCRGFENzUzOTQ1YTYxMjVFMWJlZWVFZjQ5In0",
    payload: "eyJkb21haW4iOiJjaGFpbi1yZWFjdGlvbi1taW5pLnZlcmNlbC5hcHAifQ",
    signature: "3c7UBK/ESox7jQLGtEwJUmMgPf/TQVXFweuZI/813zR37otMGgXepRkc7RNbv87QgUOja6WxwYgOgRhlBFQ+gBs=",
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
    tagline: "Build the chain. Win the pot.",
    ogTitle: "Chain Reaction",
    ogDescription: "Extend the chain or break it to claim the pot. A social game of risk and reward.",
    ogImageUrl: `${ROOT_URL}/minikit-hero.png`,
  },
} as const;
