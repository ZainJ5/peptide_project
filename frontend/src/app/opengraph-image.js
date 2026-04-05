import { ImageResponse } from "next/og";

export const alt =
  "MyPeptideDosages – Free Peptide Dosage Calculator & Protocol Guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background:
              "linear-gradient(to right, #10b981, #14b8a6, #10b981)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              borderRadius: "24px",
              padding: "10px 24px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
              }}
            />
            <span
              style={{
                color: "#10b981",
                fontSize: "18px",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              Research Platform
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              lineHeight: 1.1,
              marginBottom: "20px",
              letterSpacing: "-0.02em",
            }}
          >
            MyPeptideDosages
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "28px",
              color: "#94a3b8",
              textAlign: "center",
              lineHeight: 1.4,
              maxWidth: "800px",
            }}
          >
            Free Peptide Dosage Calculator, Reconstitution Guides & Protocol
            Schedules for 100+ Peptides
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginTop: "44px",
            }}
          >
            {["Dosage Calculator", "Protocol Library", "Schedule Builder"].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    padding: "14px 28px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                    }}
                  />
                  <span
                    style={{
                      color: "#e2e8f0",
                      fontSize: "20px",
                      fontWeight: 500,
                    }}
                  >
                    {feature}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* URL at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "20px" }}>
            www.mypeptidedosages.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
