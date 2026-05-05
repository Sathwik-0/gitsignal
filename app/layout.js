import "./globals.css";

export const metadata = {
  title: "GitSignal — See what your GitHub actually says about you",
  description:
    "AI-powered GitHub repository analyzer. Get a brutally honest score, tutorial detection, commit quality analysis, and recruiter POV on any public repo.",
  openGraph: {
    title: "GitSignal — See what your GitHub actually says about you",
    description:
      "AI-powered GitHub repository analyzer with real scoring and honest feedback.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
