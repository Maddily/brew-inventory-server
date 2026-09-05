module.exports = {
  globalSetup: "./tests/globalSetup.js",
  setupFiles: ["./tests/loadTestEnv.js"],
  setupFilesAfterEnv: ["./tests/setupPerFile.js"],
};
