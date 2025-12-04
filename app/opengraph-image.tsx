import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Chain Reaction - Social Domino Game";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #CCFFE0 0%, #BFE6EF 50%, #FFE2E3 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Dominoes */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
          {/* Domino 1 */}
          <div
            style={{
              width: "80px",
              height: "160px",
              background: "white",
              borderRadius: "12px",
              border: "2px solid #E0E0E0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-around",
              padding: "10px",
              transform: "rotate(-10deg)",
              boxShadow: "4px 8px 16px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
            </div>
            <div style={{ width: "60px", height: "2px", background: "#CCC" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              </div>
            </div>
          </div>

          {/* Domino 2 */}
          <div
            style={{
              width: "80px",
              height: "160px",
              background: "white",
              borderRadius: "12px",
              border: "2px solid #E0E0E0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-around",
              padding: "10px",
              boxShadow: "4px 8px 16px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              </div>
            </div>
            <div style={{ width: "60px", height: "2px", background: "#CCC" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              </div>
            </div>
          </div>

          {/* Power Domino (pink) */}
          <div
            style={{
              width: "80px",
              height: "160px",
              background: "linear-gradient(135deg, #FF6B8A 0%, #FF8FA3 100%)",
              borderRadius: "12px",
              border: "2px solid #FF4567",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              transform: "rotate(8deg)",
              boxShadow: "4px 8px 16px rgba(255,107,138,0.3)",
            }}
          >
            <span style={{ fontSize: "40px" }}>⚡</span>
            <span style={{ fontSize: "32px" }}>💥</span>
          </div>

          {/* Domino 4 */}
          <div
            style={{
              width: "80px",
              height: "160px",
              background: "white",
              borderRadius: "12px",
              border: "2px solid #E0E0E0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-around",
              padding: "10px",
              transform: "rotate(5deg)",
              boxShadow: "4px 8px 16px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
            </div>
            <div style={{ width: "60px", height: "2px", background: "#CCC" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ width: "16px", height: "16px", background: "#1a1a1a", borderRadius: "50%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "#1a1a1a",
            marginBottom: "16px",
          }}
        >
          ⛓️ Chain Reaction
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#555555",
            marginBottom: "24px",
          }}
        >
          Build the chain. Break it all. Win the pot.
        </div>

        {/* Brand */}
        <div
          style={{
            fontSize: "20px",
            color: "#888888",
          }}
        >
          chainintel.io
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

