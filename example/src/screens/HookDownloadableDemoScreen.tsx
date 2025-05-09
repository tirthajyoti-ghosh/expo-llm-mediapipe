import React, { useState } from 'react';
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

const DOWNLOADABLE_MODEL_URL = 'https://huggingface.co/t-ghosh/gemma-tflite/resolve/main/gemma-1.1-2b-it-cpu-int4.bin';
const DOWNLOADABLE_MODEL_NAME = 'gemma-1.1-2b-it-cpu-int4.bin';

const HookDownloadableDemoScreen = () => {
  const [prompt, setPrompt] = useState<string>('Explain "React Native" in one sentence.');
  const [response, setResponse] = useState<string>('');
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoadingAction, setIsLoadingAction] = useState<boolean>(false);

  const llmProps: UseLLMProps = {
    modelUrl: DOWNLOADABLE_MODEL_URL,
    modelName: DOWNLOADABLE_MODEL_NAME,
    maxTokens: 1024,
    temperature: 0.7,
    topK: 3,
    randomSeed: Platform.OS === 'android' ? 123 : undefined,
  };

  const llm = useLLM(llmProps);

  const handleGenerateResponse = async () => {
    if (!llm.isLoaded) {
      setError('Model is not loaded.');
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
      setError('Model is not loaded.');
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

  const handleDownloadModel = async () => {
    if (!llm.downloadModel) return;
    setIsLoadingAction(true);
    setError('');
    try {
      await llm.downloadModel({ overwrite: true });
    } catch (e: any) {
      setError(`Download Error: ${e.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleLoadModel = async () => {
    if (!llm.loadModel) return;
    if (llm.isLoaded) {
      setError('Model already loaded.');
      return;
    }
    if (llm.downloadStatus !== 'downloaded') {
      setError('Model not downloaded yet.');
      return;
    }
    setIsLoadingAction(true);
    setError('');
    try {
      await llm.loadModel();
    } catch (e: any) {
      setError(`Load Model Error: ${e.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Hook: Downloadable Model</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model Controls</Text>
        <Text>URL: {DOWNLOADABLE_MODEL_URL.substring(0,50)}...</Text>
        <Text>Name: {DOWNLOADABLE_MODEL_NAME}</Text>
        <Text>Status: {llm.isCheckingStatus ? 'Checking...' : llm.downloadStatus}</Text>
        {llm.downloadStatus === 'downloading' && (
          <Text>Progress: {(llm.downloadProgress * 100).toFixed(2)}%</Text>
        )}
        {llm.downloadError && <Text style={styles.errorText}>Download Error: {llm.downloadError}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            title="Download Model"
            onPress={handleDownloadModel}
            disabled={isLoadingAction || llm.downloadStatus === 'downloading' || llm.downloadStatus === 'downloaded'}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Load Model"
            onPress={handleLoadModel}
            disabled={isLoadingAction || llm.isLoaded || llm.downloadStatus !== 'downloaded'}
          />
        </View>
        {llm.isLoaded && <Text style={styles.successText}>Model loaded!</Text>}
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
// Add styles similar to the previous App.tsx or define new ones
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
  }
});

export default HookDownloadableDemoScreen;