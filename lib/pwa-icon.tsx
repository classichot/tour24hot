import { ImageResponse } from "next/og";

/**
 * TOUR24 app mark: dark tile, "TOUR" over a yellow "24".
 * `pad` shrinks the mark into the maskable safe zone (inner 80%).
 */
export function pwaIcon(size: number, pad = 0) {
  const inner = size * (1 - pad * 2);
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
          background: "#141312",
          borderRadius: pad ? 0 : size * 0.18,
        }}
      >
        <div
          style={{
            fontSize: inner * 0.25,
            letterSpacing: inner * -0.004,
            lineHeight: 1,
            color: "#f3f2f2",
            WebkitTextStroke: `${inner * 0.012}px #f3f2f2`,
          }}
        >
          TOUR
        </div>
        <div
          style={{
            marginTop: inner * 0.02,
            fontSize: inner * 0.46,
            letterSpacing: inner * -0.02,
            lineHeight: 1,
            color: "#ffc61a",
            WebkitTextStroke: `${inner * 0.022}px #ffc61a`,
          }}
        >
          24
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
