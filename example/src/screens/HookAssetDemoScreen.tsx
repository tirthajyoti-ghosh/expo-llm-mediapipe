import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLLM, UseLLMProps } from 'expo-llm-mediapipe';

// --- Configuration ---
const ASSET_MODEL_NAME = 'gemma-1.1-2b-it-cpu-int4.bin';

const HookAssetDemoScreen = () => {
  const [prompt, setPrompt] = useState<string>('What is the capital of France?');
  const [response, setResponse] = useState<string>('');
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoadingAction, setIsLoadingAction] = useState<boolean>(false);
  // const [isInitializing, setIsInitializing] = useState<boolean>(true); // Removed

  const llmProps: UseLLMProps = {
    storageType: 'asset',
    modelName: ASSET_MODEL_NAME,
    maxTokens: 128,
    temperature: 0.5,
    topK: 1,
    randomSeed: Platform.OS === 'android' ? 456 : undefined,
  };

  const llm = useLLM(llmProps);

  // useEffect for timer-based initialization removed.
  // The llm.isLoaded state from the hook will now directly drive the UI.

  const handleGenerateResponse = async () => {
    if (!llm.isLoaded) {
      setError('Asset model is not loaded. Check console for errors during auto-load.');
      return;
    }
    setIsLoadingAction(true);
    setResponse('');
    setStreamingResponse('');
    setError('');
    try {
      const result = await llm.generateResponse(prompt);
      setResponse(result);
    } catch (e: any) {
        setError(`Generate Response Error: ${e.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleGenerateStreamingResponse = async () => {
    if (!llm.isLoaded) {
      setError('Asset model is not loaded. Check console for errors during auto-load.');
      return;
    }
    setIsLoadingAction(true);
    setResponse('');
    setStreamingResponse('');
    setError('');
    try {
      await llm.generateStreamingResponse(
        prompt,
        (partial) => setStreamingResponse((prev) => prev + partial),
        (message) => {
          setError(`Streaming Error: ${message}`);
          setIsLoadingAction(false);
        }
      );
    } catch (e: any) {
      setError(`Generate Streaming Error: ${e.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Hook: Asset Model</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model Info</Text>
        <Text>Asset Name: {ASSET_MODEL_NAME}</Text>
        {!llm.isLoaded ? (
          <View style={styles.initializingContainer}>
            <ActivityIndicator size="small" color="#888" style={styles.initializingIndicator} />
            <Text style={styles.initializingText}>
              Initializing asset model... If this persists, please check the console for errors.
            </Text>
          </View>
        ) : (
          <Text style={styles.successText}>Asset model loaded automatically!</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inference</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your prompt"
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        <View style={styles.buttonContainer}>
          <Button
            title="Generate Response (One-Shot)"
            onPress={handleGenerateResponse}
            disabled={isLoadingAction || !llm.isLoaded}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Generate Streaming Response"
            onPress={handleGenerateStreamingResponse}
            disabled={isLoadingAction || !llm.isLoaded}
          />
        </View>
      </View>

      {isLoadingAction && <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />}
      {error && <Text style={[styles.errorText, styles.responseText]}>Error: {error}</Text>}
      {response && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full Response:</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      )}
      {streamingResponse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaming Response:</Text>
          <Text style={styles.responseText}>{streamingResponse}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    padding: 15,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginVertical: 5,
  },
  responseText: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e9e9e9',
    borderRadius: 5,
    color: '#333',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#eee',
    padding: 2,
    borderRadius: 3,
  },
  successText: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: 5,
  },
  loader: {
    marginVertical: 20,
  },
  initializingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  initializingIndicator: {
    marginRight: 8,
  },
  initializingText: {
    color: '#555', // Neutral color
    fontSize: 14,
    flexShrink: 1, // Allows text to wrap if needed
  }
});

export default HookAssetDemoScreen;
