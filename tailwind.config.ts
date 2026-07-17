import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // @heroui/theme may be hoisted to the top level OR nested under
    // @heroui/react depending on the install. Match both so component styles
    // are always generated.
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Hiragino Kaku Gothic ProN",
          "Meiryo",
          "sans-serif",
        ],
      },
    },
  },
  darkMode: "class",
  // heroui() bundles its own Tailwind types which differ slightly from the
  // root install; cast to satisfy the plugins array.
  plugins: [
    heroui({
      layout: {
        radius: { small: "8px", medium: "12px", large: "18px" },
      },
      themes: {
        light: {
          colors: {
            background: "#ffffff",
            primary: {
              50: "#f5f3ff",
              100: "#ede9fe",
              200: "#ddd6fe",
              300: "#c4b5fd",
              400: "#a78bfa",
              500: "#8b5cf6",
              600: "#7c3aed",
              700: "#6d28d9",
              800: "#5b21b6",
              900: "#4c1d95",
              DEFAULT: "#7c3aed",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#ec4899",
              foreground: "#ffffff",
            },
            focus: "#7c3aed",
          },
        },
      },
    }) as unknown as NonNullable<Config["plugins"]>[number],
  ],
};

export default config;
