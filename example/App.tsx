import ExpoLlmMediapipe from "expo-llm-mediapipe";
import React, { useEffect } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  View,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";

// Create a simple event listener setup for streaming
function useModelEvents(
  modelHandle: number | null,
  onPartialResponse?: (text: string) => void,
) {
  useEffect(() => {
    if (!modelHandle) return;

    // Listen for partial responses during generation
    const partialSubscription = ExpoLlmMediapipe.addListener(
      "onPartialResponse",
      (event: { handle: number; requestId: number; response: string }) => {
        if (event.handle === modelHandle && onPartialResponse) {
          onPartialResponse(event.response);
        }
      },
    );

    return () => {
      partialSubscription.remove();
    };
  }, [modelHandle, onPartialResponse]);
}

export default function App() {
  const [message, setMessage] = React.useState("Loading...");
  const [logs, setLogs] = React.useState<string[]>([]);
  const [modelHandle, setModelHandle] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [modelState, setModelState] = React.useState<
    "not_loaded" | "loading" | "loaded" | "error"
  >("not_loaded");

  // Add states for text generation
  const [prompt, setPrompt] = React.useState(
    "Tell me a short story about a robot that learns to feel emotions.",
  );
  const [response, setResponse] = React.useState("");
  const [generating, setGenerating] = React.useState(false);

  // Set up streaming capabilities with our custom hook
  useModelEvents(modelHandle, (partialText) => {
    if (generating) {
      setResponse((prev) => prev + partialText);
    }
  });

  React.useEffect(() => {
    try {
      // Just test if the module is accessible
      const greeting =
        ExpoLlmMediapipe.hello?.() ||
        "Module loaded but hello method not found";
      setMessage(greeting);
    } catch (e) {
      setMessage(`Error loading module: ${e.message}`);
    }
  }, []);

  const MODEL_NAME = "gemma3-1B-it-int4.task";

  // Function to load the model
  const loadModel = async () => {
    try {
      setLoading(true);
      setModelState("loading");
      setLogs((prev) => [...prev, `Starting to load model: ${MODEL_NAME}`]);

      // Parameters for the model
      const maxTokens = 1024;
      const topK = 40;
      const temperature = 0.7;
      const randomSeed = 42;

      // Create the model from an asset
      const handle = await ExpoLlmMediapipe.createModelFromAsset(
        MODEL_NAME,
        maxTokens,
        topK,
        temperature,
        randomSeed,
      );

      setModelHandle(handle);
      setModelState("loaded");
      setLogs((prev) => [
        ...prev,
        `Model loaded successfully. Handle: ${handle}`,
      ]);
    } catch (e) {
      setModelState("error");
      setLogs((prev) => [...prev, `Error loading model: ${e.message}`]);
    } finally {
      setLoading(false);
    }
  };

  // Function to release the model
  const releaseModel = async () => {
    if (modelHandle === null) {
      setLogs((prev) => [...prev, "No model to release"]);
      return;
    }

    try {
      setLoading(true);
      setLogs((prev) => [
        ...prev,
        `Releasing model with handle: ${modelHandle}`,
      ]);

      const result = await ExpoLlmMediapipe.releaseModel(modelHandle);

      if (result) {
        setModelHandle(null);
        setModelState("not_loaded");
        setLogs((prev) => [...prev, "Model released successfully"]);
      } else {
        setLogs((prev) => [...prev, "Failed to release model"]);
      }
    } catch (e) {
      setLogs((prev) => [...prev, `Error releasing model: ${e.message}`]);
    } finally {
      setLoading(false);
    }
  };

  // Add function to generate a response
  const generateResponse = async () => {
    if (modelHandle === null) {
      setLogs((prev) => [
        ...prev,
        "No model loaded. Please load the model first.",
      ]);
      return;
    }

    try {
      setGenerating(true);
      setResponse("");
      setLogs((prev) => [
        ...prev,
        `Generating response for prompt: "${prompt.substring(0, 30)}..."`,
      ]);

      const requestId = Math.floor(Math.random() * 10000);
      const result = await ExpoLlmMediapipe.generateResponse(
        modelHandle,
        requestId,
        prompt,
      );

      setResponse(result);
      setLogs((prev) => [...prev, "Response generated successfully!"]);
    } catch (e) {
      setLogs((prev) => [...prev, `Error generating response: ${e.message}`]);
    } finally {
      setGenerating(false);
    }
  };

  // Add function for streaming generation
  const generateStreamingResponse = async () => {
    if (modelHandle === null) {
      setLogs((prev) => [
        ...prev,
        "No model loaded. Please load the model first.",
      ]);
      return;
    }

    try {
      setGenerating(true);
      setResponse(""); // Clear previous response
      setLogs((prev) => [
        ...prev,
        `Generating streaming response for prompt: "${prompt.substring(0, 30)}..."`,
      ]);

      const requestId = Math.floor(Math.random() * 10000);

      // This will trigger streaming through events
      // Our useModelEvents hook will capture these events and update the UI
      await ExpoLlmMediapipe.generateResponseAsync(
        modelHandle,
        requestId,
        prompt,
      );

      setLogs((prev) => [...prev, "Streaming response completed!"]);
    } catch (e) {
      setLogs((prev) => [
        ...prev,
        `Error generating streaming response: ${e.message}`,
      ]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>LLM MediaPipe Test</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.modelStatus}>
          <Text>Model Status: </Text>
          <Text
            style={{
              fontWeight: "bold",
              color:
                modelState === "loaded"
                  ? "green"
                  : modelState === "error"
                    ? "red"
                    : modelState === "loading"
                      ? "orange"
                      : "gray",
            }}
          >
            {modelState === "not_loaded"
              ? "Not Loaded"
              : modelState === "loading"
                ? "Loading..."
                : modelState === "loaded"
                  ? "Loaded ✓"
                  : "Error Loading"}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={modelHandle === null ? "Load Model" : "Reload Model"}
            onPress={loadModel}
            disabled={loading || generating}
          />
          {modelHandle !== null && (
            <Button
              title="Release Model"
              onPress={releaseModel}
              disabled={loading || generating}
              color="red"
            />
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {/* Add text generation UI */}
        {modelHandle !== null && (
          <View style={styles.promptContainer}>
            <Text style={styles.promptLabel}>Enter your prompt:</Text>
            <TextInput
              style={styles.promptInput}
              multiline
              numberOfLines={4}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Type your prompt here..."
              editable={!generating}
            />
            <View style={styles.generateButtonsContainer}>
              <Button
                title={generating ? "Generating..." : "Generate Response"}
                onPress={generateResponse}
                disabled={generating || prompt.trim().length === 0}
              />
              <Button
                title="Stream Response"
                onPress={generateStreamingResponse}
                disabled={generating || prompt.trim().length === 0}
                color="#4CAF50"
              />
            </View>
          </View>
        )}

        {/* Response section */}
        {response.length > 0 && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>Response:</Text>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        )}

        {generating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.loadingText}>Generating text...</Text>
          </View>
        )}

        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Logs:</Text>
          {logs.length === 0 ? (
            <Text style={styles.noLogs}>No logs yet.</Text>
          ) : (
            <ScrollView style={styles.logScroll}>
              {logs.map((log, index) => (
                <Text key={index} style={styles.logEntry}>
                  • {log}
                </Text>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
  modelStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  promptContainer: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    backgroundColor: "#fff",
    fontSize: 16,
    marginBottom: 15,
  },
  generateButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  responseContainer: {
    backgroundColor: "#f0f7ff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#cce0ff",
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#0055cc",
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  logsContainer: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  logScroll: {
    maxHeight: 250,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  logEntry: {
    fontSize: 14,
    marginBottom: 5,
  },
  noLogs: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
  },
});
