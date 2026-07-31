import "./globals.css";

export const metadata = {
  title: "Rate My Unit",
  description: "Rate the unit. Rate the hospital. Staffing ratios, management, culture, and pay — reported by the staff who actually worked the floor.",
  metadataBase: new URL("https://ratemyunit.org"),
  openGraph: {
    title: "Rate My Unit",
    description: "Rate the unit. Rate the hospital. Staffing ratios, management, culture, and pay — reported by the staff who actually worked the floor.",
    url: "https://ratemyunit.org",
    siteName: "Rate My Unit",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rate My Unit",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rate My Unit",
    description: "Rate the unit. Rate the hospital.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
