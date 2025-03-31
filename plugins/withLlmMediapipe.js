// plugins/withLlmMediapipe.js
const {
  withAndroidManifest,
  withGradleProperties,
} = require("@expo/config-plugins");

// Function for handling AndroidManifest.xml changes
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

// Function for handling gradle.properties changes
function addGradleMemorySettings(gradleProperties) {
  // Find the jvmargs property if it exists
  const jvmArgsProperty = gradleProperties.find(
    (prop) => prop.type === "property" && prop.key === "org.gradle.jvmargs",
  );

  // The JVM args we want to set
  const desiredJvmArgs = "-Xmx4096m -XX:MaxMetaspaceSize=4096m";

  if (jvmArgsProperty) {
    // Property exists, replace the Xmx and MaxMetaspaceSize values
    if (
      jvmArgsProperty.value.includes("-Xmx") ||
      jvmArgsProperty.value.includes("MaxMetaspaceSize")
    ) {
      // Replace existing memory settings
      const updatedValue = jvmArgsProperty.value
        .replace(/-Xmx\d+[mg]/, "-Xmx4096m")
        .replace(/-XX:MaxMetaspaceSize=\d+[mg]/, "-XX:MaxMetaspaceSize=4096m");
      jvmArgsProperty.value = updatedValue;
    } else {
      // No memory settings found, append our settings
      jvmArgsProperty.value += ` ${desiredJvmArgs}`;
    }
  } else {
    // Property doesn't exist, add it
    gradleProperties.push({
      type: "property",
      key: "org.gradle.jvmargs",
      value: desiredJvmArgs,
    });
  }

  return gradleProperties;
}

// Main plugin function that applies both modifications
module.exports = function withLlmMediapipe(config) {
  // First, modify the Android Manifest
  config = withAndroidManifest(config, async (config) => {
    config.modResults = addNativeLibraries(config.modResults);
    return config;
  });

  // Then, modify Gradle Properties to increase memory
  config = withGradleProperties(config, (config) => {
    config.modResults = addGradleMemorySettings(config.modResults);
    return config;
  });

  return config;
};
