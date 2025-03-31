// plugins/withLlmMediapipe.js
const { withAndroidManifest } = require("@expo/config-plugins");

function addNativeLibraries(androidManifest) {
  const { manifest } = androidManifest;

  // Ensure application node exists
  if (!Array.isArray(manifest.application)) {
    manifest.application = [];
  }

  // Add our native libraries
  const nativeLibraries = [
    { $: { "android:name": "libOpenCL.so", "android:required": "false" } },
    { $: { "android:name": "libOpenCL-car.so", "android:required": "false" } },
    {
      $: { "android:name": "libOpenCL-pixel.so", "android:required": "false" },
    },
  ];

  // Check if application section is empty
  if (manifest.application.length === 0) {
    manifest.application.push({ "uses-native-library": nativeLibraries });
  } else {
    // Get the first application
    const app = manifest.application[0];

    // Add or append to uses-native-library
    if (!app["uses-native-library"]) {
      app["uses-native-library"] = [];
    }

    // Add each library if it doesn't already exist
    for (const lib of nativeLibraries) {
      const libName = lib.$["android:name"];
      const exists = app["uses-native-library"].some(
        (existing) => existing.$?.["android:name"] === libName,
      );

      if (!exists) {
        app["uses-native-library"].push(lib);
      }
    }
  }

  return androidManifest;
}

module.exports = function withLlmMediapipe(config) {
  return withAndroidManifest(config, async (config) => {
    config.modResults = addNativeLibraries(config.modResults);
    return config;
  });
};
