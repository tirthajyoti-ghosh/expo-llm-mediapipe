import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import ExpoLlmMediapipe, { DownloadProgressEvent, NativeModuleSubscription, DownloadOptions } from 'expo-llm-mediapipe';

// Use a different model for this utility screen to avoid conflicts if user is testing other screens
const UTILITY_MODEL_URL = 'https://huggingface.co/t-ghosh/gemma-tflite/resolve/main/gemma3-1B-it-int4.task'; // Example: int8 version
const UTILITY_MODEL_NAME = 'gemma3-1B-it-int4.task';

const HooklessUtilityDemoScreen = () => {
  const [downloadedModels, setDownloadedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<string>('');
  const [modelToCheck, setModelToCheck] = useState<string>(UTILITY_MODEL_NAME);
  const [modelToDelete, setModelToDelete] = useState<string>(UTILITY_MODEL_NAME);

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadingUtilModel, setIsDownloadingUtilModel] = useState(false);

  const listenersRef = React.useRef<NativeModuleSubscription[]>([]);

  useEffect(() => {
    fetchDownloadedModels();

    const downloadProgressListener = ExpoLlmMediapipe.addListener(
      "downloadProgress",
      (event: DownloadProgressEvent) => {
        if (event.modelName === UTILITY_MODEL_NAME) { // Only listen for this screen's model
          if (event.status === "downloading") {
            setIsDownloadingUtilModel(true);
            setDownloadProgress(event.progress ?? 0);
          } else {
            setIsDownloadingUtilModel(false);
            if (event.status === "completed") {
              setLastMessage(`Model ${UTILITY_MODEL_NAME} downloaded successfully.`);
              setDownloadProgress(1);
              fetchDownloadedModels(); // Refresh list
            } else if (event.status === "error") {
              setLastMessage(`Error downloading ${UTILITY_MODEL_NAME}: ${event.error}`);
            } else if (event.status === "cancelled") {
              setLastMessage(`Download of ${UTILITY_MODEL_NAME} cancelled.`);
              setDownloadProgress(0);
            }
          }
        }
      }
    );
    listenersRef.current.push(downloadProgressListener);

    return () => {
        listenersRef.current.forEach(sub => sub.remove());
        listenersRef.current = [];
    };
  }, []);

  const fetchDownloadedModels = async () => {
    setIsLoading(true);
    setLastMessage('');
    try {
      const models = await ExpoLlmMediapipe.getDownloadedModels();
      setDownloadedModels(models);
      setLastMessage(`Found ${models.length} downloaded model(s).`);
    } catch (e: any) {
      setLastMessage(`Error fetching models: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIsModelDownloaded = async () => {
    if (!modelToCheck) {
      Alert.alert("Validation", "Please enter a model name to check.");
      return;
    }
    setIsLoading(true);
    setLastMessage('');
    try {
      const isDownloaded = await ExpoLlmMediapipe.isModelDownloaded(modelToCheck);
      setLastMessage(`Model "${modelToCheck}" is ${isDownloaded ? 'DOWNLOADED' : 'NOT DOWNLOADED'}.`);
    } catch (e: any) {
      setLastMessage(`Error checking model ${modelToCheck}: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDownloadedModel = async () => {
    if (!modelToDelete) {
      Alert.alert("Validation", "Please enter a model name to delete.");
      return;
    }
    setIsLoading(true);
    setLastMessage('');
    try {
      const success = await ExpoLlmMediapipe.deleteDownloadedModel(modelToDelete);
      setLastMessage(`Model "${modelToDelete}" ${success ? 'DELETED successfully' : 'DELETION FAILED (or not found)'}.`);
      if (success) {
        fetchDownloadedModels(); // Refresh list
      }
    } catch (e: any) {
      setLastMessage(`Error deleting model ${modelToDelete}: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadUtilityModel = async () => {
    setIsLoading(true); // General loading for button disable
    setIsDownloadingUtilModel(true);
    setDownloadProgress(0);
    setLastMessage(`Starting download for ${UTILITY_MODEL_NAME}...`);
    try {
      const options: DownloadOptions = { overwrite: false }; // Don't overwrite if exists by default for util
      await ExpoLlmMediapipe.downloadModel(UTILITY_MODEL_URL, UTILITY_MODEL_NAME, options);
      // Listener will handle success/error messages
    } catch (e: any) {
        console.log('====================================');
        console.log('Error initiating download:', e);
        console.log('====================================');
      setLastMessage(`Error initiating download for ${UTILITY_MODEL_NAME}: ${e.message}`);
      setIsDownloadingUtilModel(false);
    } finally {
      setIsLoading(false); // General loading for button disable
    }
  };
  
  const handleCancelUtilityDownload = async () => {
    if (!isDownloadingUtilModel) return;
    try {
      await ExpoLlmMediapipe.cancelDownload(UTILITY_MODEL_NAME);
      setLastMessage(`Attempting to cancel download for ${UTILITY_MODEL_NAME}.`);
    } catch (e: any) {
      setLastMessage(`Error cancelling download: ${e.message}`);
    }
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Hookless: Model Utilities</Text>

      {isLoading && <ActivityIndicator style={styles.loader} size="large" />}
      {lastMessage && <Text style={styles.messageText}>{lastMessage}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Utility Model: {UTILITY_MODEL_NAME}</Text>
        <Button
          title={`Download "${UTILITY_MODEL_NAME}"`}
          onPress={handleDownloadUtilityModel}
          disabled={isLoading || isDownloadingUtilModel}
        />
        {isDownloadingUtilModel && (
          <>
            <Text style={styles.progressText}>Download Progress: {(downloadProgress * 100).toFixed(2)}%</Text>
            <Button
              title={`Cancel Download`}
              onPress={handleCancelUtilityDownload}
              disabled={!isDownloadingUtilModel}
              color="orange"
            />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Check Model Status</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter model name to check"
          value={modelToCheck}
          onChangeText={setModelToCheck}
        />
        <Button title="Check if Downloaded" onPress={handleIsModelDownloaded} disabled={isLoading} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delete Downloaded Model</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter model name to delete"
          value={modelToDelete}
          onChangeText={setModelToDelete}
        />
        <Button title="Delete Model" onPress={handleDeleteDownloadedModel} disabled={isLoading} color="red" />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>List Downloaded Models</Text>
        <Button title="Refresh List" onPress={fetchDownloadedModels} disabled={isLoading} />
        {downloadedModels.length === 0 && !isLoading && (
          <Text style={styles.infoText}>No models found in the dedicated directory.</Text>
        )}
        {downloadedModels.length > 0 && (
            downloadedModels.map((model, index) => (
                <Text key={index} style={styles.listItem}>
                    {model}
                </Text>
            ))
        )}
      </View>
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
        backgroundColor: '#fff' 
    },
    loader: { 
        marginVertical: 20 
    },
    messageText: { 
        textAlign: 'center', 
        marginVertical: 10, 
        padding: 10, 
        backgroundColor: '#e0e0e0', 
        borderRadius: 5 
    },
    infoText: { 
        textAlign: 'center', 
        marginVertical: 10, 
        fontStyle: 'italic' 
    },
    listItem: { 
        paddingVertical: 8, 
        paddingHorizontal: 5, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee', 
        fontSize: 16 
    },
    progressText: { 
        textAlign: 'center', 
        marginVertical: 5, 
        fontSize: 14 
    },
});

export default HooklessUtilityDemoScreen;