import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Limar Homes — residential development in Athens and Greece";

/** Language-neutral social image: wordmark + schematic elevation line work. */
export default function OpengraphImage() {
  const floors = [0, 1, 2, 3];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F1ECE3", color: "#1B1A18", padding: 64, justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 44, letterSpacing: 18, fontWeight: 700 }}>LIMAR</div>
            <div style={{ fontSize: 18, letterSpacing: 8, color: "#57534C", marginTop: 8 }}>HOMES · ATHENS</div>
          </div>
          <div style={{ fontSize: 30, color: "#1E3A5C", maxWidth: 460 }}>Residential development in Athens and Greece</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 520, height: 500, background: "#FBFAF7", border: "2px solid #1B1A18", padding: 40, justifyContent: "flex-end" }}>
          {floors.map((f) => (
            <div key={f} style={{ display: "flex", height: 78, borderTop: "3px solid #1B1A18", borderLeft: "2px solid #1B1A18", borderRight: "2px solid #1B1A18", padding: "12px 10px", gap: 14 }}>
              {[0, 1, 2, 3, 4].map((w) => (
                <div key={w} style={{ flex: 1, border: "1.5px solid #1B1A18", background: f === 1 && w === 2 ? "#1E3A5C" : "transparent" }} />
              ))}
            </div>
          ))}
          <div style={{ display: "flex", height: 70, border: "2px solid #1B1A18", borderTop: "3px solid #1B1A18" }} />
          <div style={{ display: "flex", height: 3, background: "#1B1A18", marginLeft: -30, marginRight: -30 }} />
        </div>
      </div>
    ),
    size,
  );
}
