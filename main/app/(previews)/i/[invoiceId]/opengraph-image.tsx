import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#1a161e",
          color: "white",
          padding: 64,
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800 }}>Invoice</div>
        <div style={{ fontSize: 28, opacity: 0.9, marginTop: 12 }}>
          View and pay securely via BexForte
        </div>
        <div style={{ marginTop: 40, fontSize: 22, opacity: 0.8 }}>
          {siteConfig.url}/i/[id]
        </div>
      </div>
    ),
    { ...size }
  );
}


