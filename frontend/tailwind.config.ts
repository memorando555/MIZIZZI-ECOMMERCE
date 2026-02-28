import type { Config } from "tailwindcss"

// all in fixtures is set to tailwind v3 as interims solutions

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        background: "#F5F7FA", // soft warm gray for ecommerce
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        lux: {
          50: "#FFF7E6",
          100: "#FFEDCC",
          200: "#FFD699",
          300: "#FFBF66",
          400: "#FFA733",
          500: "#FF8A00",
          600: "#DB7600",
          700: "#B76200",
          800: "#934E00",
          900: "#5E3000",
        },
        cherry: {
          50: "#FDE8F0",
          100: "#FCD1E1",
          200: "#FAA3C3",
          300: "#F875A5",
          400: "#F64787",
          500: "#C23050",
          600: "#A61E3C",
          700: "#8B1538",
          800: "#700C34",
          900: "#550930",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "jumia-reveal": {
          "0%": { opacity: "0", transform: "translateY(30px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "jumia-badge-pop": {
          "0%": { opacity: "0", transform: "scale(0.5) rotate(-12deg)" },
          "60%": { transform: "scale(1.15) rotate(2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        "jumia-price-flash": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7", transform: "scale(1.03)" },
        },
        "jumia-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "jumia-slide-up": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "jumia-heart-beat": {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.2)" },
          "50%": { transform: "scale(0.95)" },
          "75%": { transform: "scale(1.1)" },
        },
        "jumia-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "jumia-count-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(139, 21, 56, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(139, 21, 56, 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "jumia-reveal": "jumia-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "jumia-badge-pop": "jumia-badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "jumia-price-flash": "jumia-price-flash 2s ease-in-out infinite",
        "jumia-shimmer": "jumia-shimmer 2s infinite",
        "jumia-slide-up": "jumia-slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "jumia-heart-beat": "jumia-heart-beat 0.4s ease-in-out",
        "jumia-float": "jumia-float 3s ease-in-out infinite",
        "jumia-count-pulse": "jumia-count-pulse 1.5s ease-in-out infinite",
        "glass-float": "glass-float 3s ease-in-out infinite",
        "glass-glow": "glass-glow 2s ease-in-out infinite",
        adminGlass: {
          light: "rgba(255, 255, 255, 0.08)",
          lighter: "rgba(255, 255, 255, 0.12)",
          "extra-light": "rgba(255, 255, 255, 0.05)",
        },
        glassOrange: "#FF8A00",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "12px",
        lg: "20px",
        xl: "40px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
