const globals = require("globals");

module.exports = [
  {
    files: ["functions/**/*.js"],
    ignores: [
      "**/node_modules/**",
      "emulator-data/**",
      "functions/node_modules/**",
      "tools/**",
      "data/**",
      "import_catalog.js",
      "import_images_to_firestore.js",
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
    },
    rules: {
      "no-restricted-globals": ["error", "name", "length"],
      "prefer-arrow-callback": "error",
      "indent": ["error", 2, {SwitchCase: 1}],
      "comma-dangle": ["error", "always-multiline"],
      "max-len": ["error", {code: 80, ignoreUrls: true}],
    },
  },
  {
    files: ["**/*.spec.*"],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
    rules: {},
  },
];
