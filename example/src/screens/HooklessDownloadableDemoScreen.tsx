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
  DownloadProgressEvent,
  NativeModuleSubscription,
  PartialResponseEventPayload,
  ErrorResponseEventPayload,
  DownloadOptions,
} from 'expo-llm-mediapipe';

const DOWNLOADABLE_MODEL_URL = 'https://huggingface.co/t-ghosh/gemma-tflite/resolve/main/gemma-1.1-2b-it-cpu-int4.bin';
const DOWNLOADABLE_MODEL_NAME = 'gemma-1.1-2b-it-cpu-int4.bin';

const HooklessDownloadableDemoScreen = () => {
  const [modelHandle, setModelHandle] = useState<number | undefined>();
  const [prompt, setPrompt] = useState<string>('Explain "Large Language Model" in one sentence.');
  const [response, setResponse] = useState<string>('');
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoadingAction, setIsLoadingAction] = useState<boolean>(false);

  const [downloadStatus, setDownloadStatus] = useState<
    "not_downloaded" | "downloading" | "downloaded" | "error" | "checking"
  >("checking");
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const nextRequestIdRef = useRef(0);
  const streamingListenersRef = useRef<NativeModuleSubscription[]>([]);
  const downloadProgressListenerRef = useRef<NativeModuleSubscription | null>(null);

  const clearStreamingListeners = () => {
    streamingListenersRef.current.forEach(sub => sub.remove());
    streamingListenersRef.current = [];
  };

  useEffect(() => {
    const checkInitialStatus = async () => {
      setIsLoadingAction(true);
      setDownloadStatus("checking");
      try {
        const isDownloaded = await ExpoLlmMediapipe.isModelDownloaded(DOWNLOADABLE_MODEL_NAME);
        setDownloadStatus(isDownloaded ? "downloaded" : "not_downloaded");
        if (isDownloaded) setDownloadProgress(1);
      } catch (e: any) {
        setError(`Error checking model status: ${e.message}`);
        setDownloadStatus("error");
        setDownloadError(e.message);
      } finally {
        setIsLoadingAction(false);
      }
    };
    checkInitialStatus();

    if (!downloadProgressListenerRef.current) {
      downloadProgressListenerRef.current = ExpoLlmMediapipe.addListener(
        "downloadProgress",
        (event: DownloadProgressEvent) => {
          if (event.modelName !== DOWNLOADABLE_MODEL_NAME) return;

          if (event.status === "downloading") {
            setDownloadStatus("downloading");
            setDownloadProgress(event.progress ?? 0);
            setDownloadError(null);
            // setIsLoadingAction is already true if download was user-initiated
          } else if (event.status === "completed") {
            setDownloadStatus("downloaded");
            setDownloadProgress(1);
            setDownloadError(null);
            Alert.alert("Download Complete", `${DOWNLOADABLE_MODEL_NAME} has been downloaded.`);
            setIsLoadingAction(false); // Stop loading indicator
          } else if (event.status === "error") {
            setDownloadStatus("error");
            setDownloadError(event.error || "Unknown download error");
            setError(`Download Error: ${event.error}`);
            setIsLoadingAction(false); // Stop loading indicator
          } else if (event.status === "cancelled") {
            setDownloadStatus("not_downloaded");
            setDownloadProgress(0);
            Alert.alert("Download Cancelled");
            setIsLoadingAction(false); // Stop loading indicator
          }
        }
      );
    }

    return () => {
      // Cleanup for component unmount
      clearStreamingListeners();
      downloadProgressListenerRef.current?.remove();
      downloadProgressListenerRef.current = null;
      // Model release is handled by the other useEffect dependent on modelHandle
    };
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount

 useEffect(() => {
    // Effect to release model when modelHandle changes (e.g., set to undefined) or on unmount
    const currentModelHandle = modelHandle;
    return () => {
      if (currentModelHandle !== undefined) {
        ExpoLlmMediapipe.releaseModel(currentModelHandle)
          .then(() => console.log(`[HooklessDownloadable] Model ${currentModelHandle} released.`))
          .catch(e => console.error(`[HooklessDownloadable] Error releasing model ${currentModelHandle}:`, e));
      }
    };
  }, [modelHandle]);


  const handleDownloadModel = async () => {
    if (downloadStatus === "downloading") return;
    setIsLoadingAction(true); // Start loading indicator
    setError('');
    setDownloadError(null);
    setDownloadStatus("downloading");
    setDownloadProgress(0);
    try {
      const options: DownloadOptions = { overwrite: true, timeout: 60000 }; // 60s timeout
      await ExpoLlmMediapipe.downloadModel(DOWNLOADABLE_MODEL_URL, DOWNLOADABLE_MODEL_NAME, options);
      // If downloadModel resolves, download has started. Listener will handle isLoadingAction=false.
    } catch (e: any) {
      setError(`Download initiation error: ${e.message}`);
      setDownloadStatus("error");
      setDownloadError(e.message);
      setIsLoadingAction(false); // Stop loading indicator if download initiation failed
    }
  };

  const handleCancelDownload = async () => {
    if (downloadStatus !== "downloading") return;
    try {
      await ExpoLlmMediapipe.cancelDownload(DOWNLOADABLE_MODEL_NAME);
      // Listener for "cancelled" status will set isLoadingAction to false.
    } catch (e: any) {
      setError(`Cancel download error: ${e.message}`);
      // If cancel itself fails, isLoadingAction might still be true from the download start.
      // The download might continue or error out, eventually triggering the listener.
    }
  };

  const handleLoadModel = async () => {
    if (modelHandle !== undefined) {
      Alert.alert("Model Already Loaded", `Handle: ${modelHandle}`);
      return;
    }
    if (downloadStatus !== "downloaded") {
      setError("Model is not downloaded yet.");
      return;
    }
    setIsLoadingAction(true);
    setError('');
    try {
      const handle = await ExpoLlmMediapipe.createModelFromDownloaded(
        DOWNLOADABLE_MODEL_NAME,
        1024, // maxTokens
        3,    // topK
        0.7,  // temperature
        Platform.OS === 'android' ? 123 : undefined // randomSeed
      );
      setModelHandle(handle);
      Alert.alert("Model Loaded", `Successfully loaded ${DOWNLOADABLE_MODEL_NAME}. Handle: ${handle}`);
    } catch (e: any) {
      setError(`Load Model Error: ${e.message}`);
      setModelHandle(undefined);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleReleaseModel = async () => {
    if (modelHandle === undefined) {
      Alert.alert("No Model Loaded", "There is no model to release.");
      return;
    }
    setIsLoadingAction(true);
    try {
      await ExpoLlmMediapipe.releaseModel(modelHandle);
      Alert.alert("Model Released", `Model with handle ${modelHandle} has been released.`);
      setModelHandle(undefined); // This will trigger the useEffect for model release
    } catch (e: any) {
      setError(`Release Model Error: ${e.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleGenerateResponse = async () => {
    if (modelHandle === undefined) {
      setError('Model is not loaded.');
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
    if (modelHandle === undefined) {
      setError('Model is not loaded.');
      return;
    }
    setIsLoadingAction(true);
    setResponse('');
    setStreamingResponse('');
    setError('');
    
    clearStreamingListeners(); // Clear only previous streaming listeners

    const currentRequestId = nextRequestIdRef.current++;
    let accumulatedResponse = "";

    const partialSub = ExpoLlmMediapipe.addListener("onPartialResponse", (ev: PartialResponseEventPayload) => {
      if (ev.handle === modelHandle && ev.requestId === currentRequestId) {
        accumulatedResponse += ev.response;
        setStreamingResponse(accumulatedResponse);
      }
    });
    streamingListenersRef.current.push(partialSub);

    const errorSub = ExpoLlmMediapipe.addListener("onErrorResponse", (ev: ErrorResponseEventPayload) => {
      if (ev.handle === modelHandle && ev.requestId === currentRequestId) {
        setError(`Streaming Error (Request ${ev.requestId}): ${ev.error}`);
        setIsLoadingAction(false);
        clearStreamingListeners(); 
      }
    });
    streamingListenersRef.current.push(errorSub);

    try {
      await ExpoLlmMediapipe.generateResponseAsync(modelHandle, currentRequestId, prompt);
      // If successful, promise resolves after all parts.
      // isLoadingAction will be set to false in the finally block.
    } catch (e: any) {
      setError(`Generate Streaming Error: ${e.message}`);
      setIsLoadingAction(false); 
      clearStreamingListeners();
    } finally {
      // This ensures isLoadingAction is false if the promise resolved without error event,
      // or if it was an error not caught by the listener but by the promise rejection.
      setIsLoadingAction(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Hookless: Downloadable Model</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model: {DOWNLOADABLE_MODEL_NAME}</Text>
        <Text>URL: {DOWNLOADABLE_MODEL_URL.substring(0,50)}...</Text>
        <Text>Status: {downloadStatus}</Text>
        {downloadStatus === 'downloading' && (
          <Text>Progress: {(downloadProgress * 100).toFixed(2)}%</Text>
        )}
        {downloadError && <Text style={styles.errorText}>Error: {downloadError}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            title="Download Model (Overwrite)"
            onPress={handleDownloadModel}
            disabled={isLoadingAction || downloadStatus === 'downloading' || downloadStatus === 'downloaded'}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel Download"
            onPress={handleCancelDownload}
            disabled={downloadStatus !== 'downloading' || isLoadingAction} // Also disable if another action is loading
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Load Downloaded Model"
            onPress={handleLoadModel}
            disabled={isLoadingAction || modelHandle !== undefined || downloadStatus !== 'downloaded'}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Release Model"
            onPress={handleReleaseModel}
            disabled={isLoadingAction || modelHandle === undefined}
          />
        </View>
        {modelHandle !== undefined && <Text style={styles.successText}>Model loaded! Handle: {modelHandle}</Text>}
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
            disabled={isLoadingAction || modelHandle === undefined}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Generate Streaming Response"
            onPress={handleGenerateStreamingResponse}
            disabled={isLoadingAction || modelHandle === undefined}
          />
        </View>
      </View>

      {isLoadingAction && <ActivityIndicator style={styles.loader} size="large" />}
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
  successText: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: 5,
  },
  loader: {
    marginVertical: 20,
  }
});

export default HooklessDownloadableDemoScreen;