import ExpoLlmMediapipe from "expo-llm-mediapipe";
import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  TextInput,
  View,
  Text
} from "react-native";
import Markdown from "react-native-markdown-display";

import { ModelContext } from "./ModelProvider";
import { styles, markdownStyles } from "./styles";
import useModelEvents from "./useModelEvent";

function TestScreen() {
  const {
    modelHandle,
    modelState,
    loadModel,
    releaseModel,
    loading,
    logs,
    setLogs,
  } = React.useContext(ModelContext);
  const [message, setMessage] = useState("Loading...");
  const [prompt, setPrompt] = useState(
    "Tell me a short story about a robot that learns to feel emotions.",
  );
  const [response, setResponse] = useState("");
  const [generating, setGenerating] = useState(false);
  const responseScrollViewRef = useRef<ScrollView>(null);

  // Set up streaming capabilities with our custom hook
  useModelEvents(modelHandle, (partialText) => {
    if (generating) {
      setResponse((prev) => {
        const newResponse = prev + partialText;
        // Scroll to the bottom after response updates
        setTimeout(() => {
          responseScrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
        return newResponse;
      });
    }
  });

  useEffect(() => {
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

  // Add function to generate a response
  const generateResponse = async () => {
    if (!modelHandle) return;

    try {
      setGenerating(true);
      setResponse("");

      const requestId = Math.floor(Math.random() * 10000);
      setLogs((prev) => [
        ...prev,
        `Generating response for request ${requestId}...`,
      ]);

      const result = await ExpoLlmMediapipe.generateResponseAsync(
        modelHandle,
        requestId,
        prompt,
      );

      setResponse(result);
      setLogs((prev) => [...prev, `Response generated successfully.`]);
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        `Error generating response: ${error.message}`,
      ]);
    } finally {
      setGenerating(false);
    }
  };

  // Add function for streaming generation
  const generateStreamingResponse = async () => {
    if (!modelHandle) return;

    try {
      setGenerating(true);
      setResponse("");

      const requestId = Math.floor(Math.random() * 10000);
      setLogs((prev) => [
        ...prev,
        `Starting streaming generation for request ${requestId}...`,
      ]);

      await ExpoLlmMediapipe.generateResponseAsync(
        modelHandle,
        requestId,
        prompt,
      );

      setLogs((prev) => [...prev, `Streaming generation completed.`]);
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        `Error in streaming generation: ${error.message}`,
      ]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView ref={responseScrollViewRef} showsVerticalScrollIndicator>
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
              <Markdown style={markdownStyles}>{response}</Markdown>
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
              logs.map((log, index) => (
                <Text key={index} style={styles.logEntry}>
                  • {log}
                </Text>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
export default TestScreen;
