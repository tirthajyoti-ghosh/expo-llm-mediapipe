import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import ExpoLlmMediapipe, {
  NativeModuleSubscription,
  PartialResponseEventPayload,
  ErrorResponseEventPayload,
} from 'expo-llm-mediapipe';

const ASSET_MODEL_NAME = 'gemma-1.1-2b-it-cpu-int4.bin'; // Ensure this model is in your assets

const HooklessAssetDemoScreen = () => {
  const [modelHandle, setModelHandle] = useState<number | undefined>();
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('What is the main benefit of using React Native?');
  const [response, setResponse] = useState<string>('');
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoadingAction, setIsLoadingAction] = useState<boolean>(false); // For specific actions like generate
  const [isInitializing, setIsInitializing] = useState<boolean>(false); // For loading/releasing model

  const nextRequestIdRef = useRef(0);
  const listenersRef = useRef<NativeModuleSubscription[]>([]);

  const clearListeners = () => {
    listenersRef.current.forEach(sub => sub.remove());
    listenersRef.current = [];
  };
  
  useEffect(() => {
    // Model is no longer loaded automatically on mount.
    // User must press the "Load Asset Model" button.

    // Cleanup function for when the component unmounts or modelHandle changes
    const currentModelHandle = modelHandle;
    return () => {
      clearListeners();
      if (currentModelHandle !== undefined) {
        ExpoLlmMediapipe.releaseModel(currentModelHandle)
          .then(() => console.log(`[HooklessAsset] Model ${currentModelHandle} released.`))
          .catch(e => console.error(`[HooklessAsset] Error releasing model ${currentModelHandle} on unmount/change:`, e));
      }
    };
  }, [modelHandle]); // Re-run if modelHandle changes to ensure previous model is released

  const handleLoadModel = async () => {
    if (modelHandle !== undefined || isInitializing) return;

    setIsInitializing(true);
    setError('');
    try {
      console.log(`[HooklessAsset] Attempting to load asset model: ${ASSET_MODEL_NAME}`);
      const handle = await ExpoLlmMediapipe.createModelFromAsset(
        ASSET_MODEL_NAME,
        1024, // maxTokens
        1,   // topK
        0.5, // temperature
        Platform.OS === 'android' ? 456 : 0 // randomSeed
      );
      setModelHandle(handle);
      setIsModelLoaded(true);
      Alert.alert("Asset Model Loaded", `Successfully loaded ${ASSET_MODEL_NAME}. Handle: ${handle}`);
      console.log(`[HooklessAsset] Model ${ASSET_MODEL_NAME} loaded with handle: ${handle}`);
    } catch (e: any) {
      setError(`Load Asset Model Error: ${e.message}`);
      console.error(`[HooklessAsset] Error loading asset model: ${e.message}`, e);
      setIsModelLoaded(false);
      setModelHandle(undefined);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleReleaseModel = async () => {
    if (modelHandle === undefined) {
      Alert.alert("No Model Loaded", "There is no asset model to release.");
      return;
    }
    setIsInitializing(true); // Use isInitializing for load/release visual feedback
    try {
      await ExpoLlmMediapipe.releaseModel(modelHandle);
      Alert.alert("Asset Model Released", `Model with handle ${modelHandle} has been released.`);
      setModelHandle(undefined); // This will trigger the useEffect cleanup for listeners
      setIsModelLoaded(false);
    } catch (e: any) {
      setError(`Release Asset Model Error: ${e.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleGenerateResponse = async () => {
    if (modelHandle === undefined || !isModelLoaded) {
      setError('Asset model is not loaded.');
      return;
    }
    setIsLoadingAction(true);
    setResponse('');
    setStreamingResponse('');
    setError('');
    const requestId = nextRequestIdRef.current++;
    try {
      const result = await ExpoLlmMediapipe.generateResponse(modelHandle, requestId, prompt);
      setResponse(result);
    } catch (e: any) {
      setError(`Generate Response Error: ${e.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleGenerateStreamingResponse = async () => {
    if (modelHandle === undefined || !isModelLoaded) {
      setError('Asset model is not loaded.');
      return;
    }
    setIsLoadingAction(true);
    setResponse('');
    setStreamingResponse('');
    setError('');
    
    // Clear only response/error listeners, not all listeners (e.g., if there were others)
    // For this screen, clearListeners() is fine as we only have response/error ones during generation.
    clearListeners(); 

    const currentRequestId = nextRequestIdRef.current++;
    let accumulatedResponse = "";

    const partialSub = ExpoLlmMediapipe.addListener("onPartialResponse", (ev: PartialResponseEventPayload) => {
      if (ev.handle === modelHandle && ev.requestId === currentRequestId) {
        accumulatedResponse += ev.response;
        setStreamingResponse(accumulatedResponse);
      }
    });
    listenersRef.current.push(partialSub);

    const errorSub = ExpoLlmMediapipe.addListener("onErrorResponse", (ev: ErrorResponseEventPayload) => {
      if (ev.handle === modelHandle && ev.requestId === currentRequestId) {
        setError(`Streaming Error (Request ${ev.requestId}): ${ev.error}`);
        setIsLoadingAction(false);
        clearListeners(); // Clean up these specific listeners
      }
    });
    listenersRef.current.push(errorSub);

    try {
      await ExpoLlmMediapipe.generateResponseAsync(modelHandle, currentRequestId, prompt);
      // Native side resolves when streaming is complete.
    } catch (e: any) {
      setError(`Generate Streaming Error: ${e.message}`);
      clearListeners(); // Clean up listeners on direct catch
    } finally {
      setIsLoadingAction(false); // Ensure loading is stopped
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Hookless: Asset Model</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model: {ASSET_MODEL_NAME}</Text>
        {isInitializing && (
          <View style={styles.initializingContainer}>
            <ActivityIndicator size="small" color="#888" style={styles.initializingIndicator} />
            {/* Check modelHandle to determine if we are loading or releasing for more accurate text */}
            <Text style={styles.initializingText}>{modelHandle === undefined && !isModelLoaded ? 'Loading asset model...' : 'Releasing model...'}</Text>
          </View>
        )}
        {!isInitializing && isModelLoaded && modelHandle !== undefined && (
          <Text style={styles.successText}>Asset model loaded! Handle: {modelHandle}</Text>
        )}
        {!isInitializing && !isModelLoaded && (
          <Text style={styles.errorText}>
            Asset model not loaded. {error ? `Error: ${error}` : 'Press "Load Asset Model" below.'}
          </Text>
        )}
         <View style={styles.buttonContainer}>
          <Button
            title={isModelLoaded ? "Release Model" : "Load Asset Model"}
            onPress={isModelLoaded ? handleReleaseModel : handleLoadModel}
            disabled={isInitializing || isLoadingAction} // Disable if initializing (load/release) or if an action (generate) is in progress
          />
        </View>
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
            disabled={isLoadingAction || !isModelLoaded || isInitializing}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Generate Streaming Response"
            onPress={handleGenerateStreamingResponse}
            disabled={isLoadingAction || !isModelLoaded || isInitializing}
          />
        </View>
      </View>

      {isLoadingAction && !isInitializing && <ActivityIndicator style={styles.loader} size="large" />}
      {error && !isInitializing && <Text style={[styles.errorText, styles.responseText]}>Error: {error}</Text>}
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
        backgroundColor: 'white' 
    },
    contentContainer: { 
        padding: 15 
    },
    title: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 20, 
        color: '#333' 
    },
    section: { 
        marginBottom: 20, 
        padding: 15, 
        backgroundColor: '#f9f9f9', 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: '#eee' 
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: '600', 
        marginBottom: 10, 
        color: '#444' 
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 5, 
        padding: 10, 
        marginBottom: 10, 
        backgroundColor: '#fff', 
        minHeight: 60, 
        textAlignVertical: 'top' 
    },
    buttonContainer: { 
        marginVertical: 5 
    },
    responseText: { 
        marginTop: 10, 
        padding: 10, 
        backgroundColor: '#e9e9e9', 
        borderRadius: 5, 
        color: '#333', 
        fontSize: 14 
    },
    errorText: { 
        color: 'red', 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginTop: 5 
    },
    successText: { 
        color: 'green', 
        fontWeight: 'bold', 
        marginTop: 5 
    },
    loader: { 
        marginVertical: 20 
    },
    initializingContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 5 
    },
    initializingIndicator: { 
        marginRight: 8 
    },
    initializingText: { 
        color: '#555', 
        fontSize: 14, 
        flexShrink: 1 
    },
});

export default HooklessAssetDemoScreen;