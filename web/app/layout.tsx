import React from "react";
import "maplibre-gl/dist/maplibre-gl.css";

const metadataTitle = "S.H.I.O.K. Shelter Map";
const metadataDescription =
  "If you moved here, inspect covered-walkway ratio, exposed gaps, the night-lighting map layer, and the secondary locked SHIOK score on walks to transit.";

export const metadata = {
  title: metadataTitle,
  description: metadataDescription,
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: metadataTitle,
    description: metadataDescription,
    type: "website",
    url: "https://sgshiok.vercel.app/",
    siteName: "S.H.I.O.K. Shelter Map",
  },
  alternates: {
    canonical: "https://sgshiok.vercel.app/",
  },
  twitter: {
    card: "summary",
    title: metadataTitle,
    description: metadataDescription,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
