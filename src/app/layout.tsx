import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/components/chat-widget";
import { HashScroll } from "@/components/hash-scroll";
import { profile, siteUrl, socials } from "@/content/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const description =
  "Applied AI Engineer & AI Team Lead — production computer vision serving 2M+ retail outlets at ~99% accuracy, plus RAG, multi-agent, and real-time voice systems on GPU-optimized, self-hosted infrastructure.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.title}`,
    template: `%s — ${profile.name}`,
  },
  description,
  keywords: [
    "Applied AI Engineer", "Head of AI", "Computer Vision", "YOLO", "Retail Intelligence",
    "RAG", "LangGraph", "AI Agents", "MLOps", "GPU optimization", "FastAPI", "PyTorch",
    "Bangla TTS", "Bangla OCR", "MD Rakibul Hasan Naym", "HawkEyes", "Bangladesh AI",
  ],
  authors: [{ name: profile.name, url: socials.github.url }],
  creator: profile.name,
  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${profile.name} — ${profile.title}`,
    description,
    siteName: profile.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.title}`,
    description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.title,
  email: profile.email,
  telephone: profile.phone,
  url: siteUrl,
  address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
  worksFor: { "@type": "Organization", name: profile.company },
  sameAs: [socials.github.url, socials.huggingface.url, socials.huggingfaceOrg.url, socials.linkedin.url],
  knowsAbout: [
    "Computer Vision", "Deep Learning", "Retrieval-Augmented Generation",
    "AI Agents", "MLOps", "GPU Optimization", "Text-to-Speech", "OCR",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[--color-accent] focus:px-4 focus:py-2 focus:text-black"
        >
          Skip to content
        </a>
        <HashScroll />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
