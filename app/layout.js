import "./globals.css";

export const metadata = {
  title: "Rate My Unit",
  description: "Hospital and unit reviews for healthcare workers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
