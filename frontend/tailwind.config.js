export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0B1E3F", light: "#132A54" },
        accent: { DEFAULT: "#2563EB", light: "#3B82F6" },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        bg: "#F5F7FB"
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] }
    }
  },
  plugins: []
};