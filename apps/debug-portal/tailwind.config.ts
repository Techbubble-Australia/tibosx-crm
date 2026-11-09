import type { Config } from "tailwindcss";

const config: Config = {
  // lib/ holds class names too (status / type colour maps), so it must be scanned.
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
