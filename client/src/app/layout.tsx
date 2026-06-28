import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import './globals.css';
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

// 🔥 NAYA: PWA Viewport Settings (Phone ki upar wali patti black karne ke liye)
export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "YAP - Anonymous Video Chat & Random Stranger Texting App",
  description:
    "YAP is a free anonymous video chat platform to talk with strangers instantly. Connect via random video, voice, or text chat. Meet new people, make friends, and enjoy safe, private conversations online.",
  
  manifest: "/manifest.json", // 🔥 NAYA: PWA Manifest link add kiya yahan

  keywords: [
    "anonymous video chat",
    "random video chat",
    "talk to strangers online",
    "chat with strangers",
    "video chat app",
    "omegle alternative",
    "anonymous texting app",
    "random chat website",
    "make friends online",
    "stranger chat app",
  ],

  authors: [{ name: "YAP Team" }],
  creator: "YAP",
  metadataBase: new URL("https://yourdomain.com"), // Vercel pe deploy karne ke baad isko update kar lena

  openGraph: {
    title: "YAP - Anonymous Video Chat & Stranger Chat Platform",
    description:
      "Instantly connect with strangers via video, voice, or text chat. Safe, anonymous, and fun conversations await on YAP.",
    url: "https://yourdomain.com",
    siteName: "YAP",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YAP - Anonymous Video Chat",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "YAP - Anonymous Video Chat & Stranger Chat",
    description:
      "Talk to strangers instantly with video, voice, or text chat. Try YAP now!",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}