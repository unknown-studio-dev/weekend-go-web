/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#34C759",
          dark: "#22C55E",
          light: "#4ADE80",
        },
        "text-primary": "#1F2937",
        "text-secondary": "#374151",
        "text-tertiary": "#6B7280",
        "bg-secondary": "#F9FAFB",
        "border-default": "#E5E7EB",
        "footer-bg": "#1F2937",
      },
      borderRadius: {
        button: "999px",
        card: "16px",
      },
    },
  },
  plugins: [],
};
