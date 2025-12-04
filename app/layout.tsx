import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "@/minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  // Get the root URL - ensure it's absolute
  const rootUrl = 
    process.env.NEXT_PUBLIC_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "https://chain-reaction-mini.vercel.app";
  
  // Mini App embed for Farcaster
  const miniappEmbed = {
    version: "1",
    imageUrl: `${rootUrl}/minikit-hero.png`,
    button: {
      title: "🎲 Play Chain Reaction",
      action: {
        type: "launch_miniapp",
        url: rootUrl,
        name: "Chain Reaction",
        splashImageUrl: `${rootUrl}/splash.png`,
        splashBackgroundColor: "#BFE6EF",
      },
    },
  };
  
  console.log("[Metadata] fc:miniapp embed:", JSON.stringify(miniappEmbed, null, 2));

  return {
    title: "Chain Reaction",
    description: "A social domino game. Build the chain, break it all, win the pot.",
    openGraph: {
      title: "Chain Reaction – Social Domino Game",
      description: "Extend the chain or break it to claim the pot. A social game of risk and reward.",
      images: [
        {
          url: `${rootUrl}/minikit-hero.png`,
          width: 1200,
          height: 800,
          alt: "Chain Reaction",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Chain Reaction – Social Domino Game",
      description: "Extend the chain or break it to claim the pot. A social game of risk and reward.",
      images: [`${rootUrl}/minikit-hero.png`],
    },
    other: {
      "fc:miniapp": JSON.stringify(miniappEmbed),
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang="en">
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
