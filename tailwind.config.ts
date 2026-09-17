import type { Config } from "tailwindcss";

// Mesma paleta do wireframe (documentacao/portal_181_wireframe.html).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0b3b67",
        brand: {
          blue: "#0d6efd",
          red: "#e31b23",
          green: "#24a148",
        },
        muted: "#6b7c8f",
        border: "#d9e2ec",
        surface: "#f4f7fb",
        ink: "#183044",
      },
      boxShadow: {
        card: "0 8px 28px rgba(18,49,77,.08)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
