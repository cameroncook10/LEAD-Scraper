import baseConfig from '../../frontend/tailwind.config.js';

export default {
  ...baseConfig,
  content: [
    "./index.html",
    "./contexts/**/*.{js,jsx}",
    "./*.{js,jsx}",
    "../../frontend/src/**/*.{js,jsx,ts,tsx}",
  ],
};
