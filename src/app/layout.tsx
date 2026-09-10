import type { Metadata, Viewport } from "next";
import { EB_Garamond, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { MedicalSchema } from "@/components/MedicalSchema";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cognitiveedgeclinic.com"),
  manifest: "/manifest.json",
  title: {
    default: "Cognitive Wellness Clinic — Autonomic Vitality & Neuro-Metabolic Resuscitation",
    template: "%s | Cognitive Wellness Clinic",
  },
  description:
    "Discreet concierge neurology and stoichiometric neuro-metabolic longevity practice under Dr. David Andreas Runheim, MD. Architecting personalized pathways to optimize neural performance and eliminate biological friction.",
  keywords: [
    "Neurology",
    "Concierge Medicine",
    "Neuro-Metabolic Resuscitation",
    "Cognitive Longevity",
    "Dr. David Andreas Runheim",
    "Autonomic Vitality",
    "Stoichiometric Analysis",
    "Zero-ePHI",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cognitive Edge Clinic",
  },
  openGraph: {
    title: "Cognitive Wellness Clinic — Discreet Concierge Neurology",
    description:
      "Specialized neuro-metabolic resuscitation and cognitive longevity protocols directed by Dr. David Andreas Runheim, MD. Private, zero-friction medical concierge.",
    url: "https://cognitiveedgeclinic.com",
    siteName: "Cognitive Wellness Clinic",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og?title=Autonomic%20Vitality%20%26%20Neuro-Metabolic%20Resuscitation",
        width: 1200,
        height: 630,
        alt: "Cognitive Wellness Clinic — Autonomic Vitality & Neuro-Metabolic Resuscitation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognitive Wellness Clinic | Dr. David Andreas Runheim, MD",
    description:
      "Discreet concierge medicine, neuro-metabolic resuscitation, and cognitive longevity. Zero-ePHI compliant clinical architecture.",
    images: ["/api/og?title=Autonomic%20Vitality%20%26%20Neuro-Metabolic%20Resuscitation"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-canvas-obsidian text-text-surface selection:bg-champagne-gold selection:text-text-on-gold">
        <MedicalSchema />
        {children}
      </body>
    </html>
  );
}
