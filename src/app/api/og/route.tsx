import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Autonomic Vitality & Neuro-Metabolic Resuscitation";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B0F19",
          padding: "36px",
          fontFamily: "serif",
        }}
      >
        {/* Outer Hairline Gold Border Card */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#121826",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            borderRadius: "20px",
            padding: "48px 56px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Radial Glow */}
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "360px",
              height: "360px",
              borderRadius: "100%",
              background:
                "radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(78,107,94,0.1) 50%, transparent 70%)",
            }}
          />

          {/* Top Category Badge */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                backgroundColor: "rgba(11, 15, 25, 0.85)",
                borderRadius: "9999px",
                padding: "8px 18px",
                width: "fit-content",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "9999px",
                  backgroundColor: "#D4AF37",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  letterSpacing: "0.2em",
                  color: "#D4AF37",
                  textTransform: "uppercase",
                  fontFamily: "sans-serif",
                  fontWeight: 600,
                }}
              >
                COGNITIVE WELLNESS CLINIC &bull; QUANTITATIVE NEUROSCIENCE
              </span>
            </div>
          </div>

          {/* Center Dynamic Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "16px 0" }}>
            <div
              style={{
                fontSize: "48px",
                lineHeight: "1.2",
                color: "#F6F7FB",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                maxWidth: "1020px",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: "19px",
                color: "#9FA7BC",
                letterSpacing: "0.04em",
                fontFamily: "sans-serif",
              }}
            >
              Discreet Concierge Neurology &amp; Stoichiometric Neuro-Metabolic Resuscitation
            </div>
          </div>

          {/* Bottom Metadata & Zero-ePHI Watermark */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(212, 175, 55, 0.2)",
              paddingTop: "22px",
              fontFamily: "sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "16px", color: "#F6F7FB", fontWeight: 600 }}>
                Dr. Andreas Runheim, MD
              </span>
              <span style={{ fontSize: "14px", color: "#9FA7BC" }}>
                &bull; Board-Certified Neurologist
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11px",
                letterSpacing: "0.15em",
                color: "#4E6B5E",
                textTransform: "uppercase",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            >
              <span>ZERO-ePHI QUARANTINE CERTIFIED</span>
              <span>&bull;</span>
              <span>HIPAA BAA SECURE</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
