import { ImageResponse } from "next/og";

/**
 * Icone d'ecran d'accueil iOS.
 *
 * Generee en PNG plutot que servie en SVG : la convention `apple-icon` de Next
 * n'accepte que des images matricielles, et un `apple-icon.svg` serait
 * silencieusement ignore. Elle reprend le meme dessin que `icon.svg` et que
 * `LogoMark` — une facture sur le degrade de marque.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #2563eb 48%, #1d4ed8 100%)",
        }}
      >
        <svg
          width="108"
          height="108"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2.5h9.2L20 7.2V21l-2.6-1.5-2.6 1.5-2.6-1.5L9.6 21 7 19.5 4 21V6a3.5 3.5 0 0 1 2-3.5Z" />
          <path d="M14.8 2.6V7.4H19.8" />
          <path d="M8.4 10.5h7.2M8.4 14.2h4.8" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
