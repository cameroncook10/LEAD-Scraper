import baseConfig from '../../frontend/tailwind.config.js';

export default {
  ...baseConfig,
  content: [
    "./index.html",
    "./contexts/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
    "./*.{js,jsx}",
    "../../frontend/src/**/*.{js,jsx,ts,tsx}",
  ],
};
