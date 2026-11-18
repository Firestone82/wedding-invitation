import localFont from "next/font/local";

export const scriptFont = localFont({
  src: "../fonts/great-vibes.woff2",
  variable: "--font-script",
  display: "swap",
});

export const serifFont = localFont({
  src: [
    {
      path: "../fonts/cormorant.woff2",
      weight: "300 700",
      style: "normal",
    },
    {
      path: "../fonts/cormorant-italic.woff2",
      weight: "300 700",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const handFont = localFont({
  src: "../fonts/caveat.woff2",
  weight: "400 700",
  variable: "--font-hand",
  display: "swap",
  preload: false,
});

export const fontVariables = [scriptFont.variable, serifFont.variable, handFont.variable].join(" ");
