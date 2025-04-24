import { Ionicons } from "@expo/vector-icons";
import ExpoLlmMediapipe, { modelManager, ModelInfo } from "expo-llm-mediapipe";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import * as Progress from "react-native-progress";

import { ModelContext } from "./ModelProvider";
import { styles } from "./styles";

// Available models for download
const AVAILABLE_MODELS = [
  {
    name: "gemma-1.1-2b-it-cpu-int4.bin",
    displayName: "Gemma 2B (Integer 4)",
    description: "Small, efficient instruction-tuned model (quantized)",
    size: 1200000000, // ~1.2GB
    url: "https://huggingface.co/t-ghosh/gemma-tflite/resolve/main/gemma-1.1-2b-it-cpu-int4.bin", // Replace with actual URL
  },
  // {
  //   name: "gemma2-7b-it-cpu-int8.task",
  //   displayName: "Gemma 7B (Integer 8)",
  //   description: "Larger capacity instruction-tuned model (quantized)",
  //   size: 3800000000, // ~3.8GB
  //   url: "https://your-storage-url/models/gemma2-7b-it-cpu-int8.task", // Replace with actual URL
  // },
];

// Downloads Screen Component
export default function DownloadsScreen() {
  const {
    modelHandle,
    modelState,
    loadModel,
    loadDownloadedModel,
    releaseModel,
    loading,
    logs,
    setLogs,
    downloadedModels,
    refreshDownloadedModels,
    currentModelName,
  } = React.useContext(ModelContext);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize model manager
  useEffect(() => {
    // Register available models
    AVAILABLE_MODELS.forEach((model) => {
      modelManager.registerModel(model.name, model.url);
    });

    // Listen for model status changes
    const unsubscribe = modelManager.addListener((modelMap) => {
      setModels(Array.from(modelMap.values()));
    });

    // Initial state
    setModels(modelManager.getAllModels());

    // Check downloaded models
    handleRefreshModels();

    // Set up event listener for download progress
    const subscription = ExpoLlmMediapipe.addListener(
      "downloadProgress",
      (event) => {
        console.log("Download progress:", event);
        if (event.status === "error") {
          setLogs((prev) => [
            ...prev,
            `Download error: ${event.modelName} - ${event.error}`,
          ]);
        }
      },
    );

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  // Handle refreshing of models
  const handleRefreshModels = async () => {
    setRefreshing(true);
    try {
      // Refresh downloaded models from native module
      const downloadedModelsList = await refreshDownloadedModels();

      // We cannot call private checkModelStatus directly, so we'll re-register models
      // which will trigger the status check internally
      const registeredModels = modelManager.getAllModels();
      for (const model of registeredModels) {
        modelManager.registerModel(model.name, model.url);
      }

      setLogs((prev) => [...prev, "Models refreshed"]);
    } catch (error) {
      console.error("Error refreshing models:", error);
      setLogs((prev) => [...prev, `Error refreshing models: ${error.message}`]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = async (model: ModelInfo) => {
    try {
      setLogs((prev) => [...prev, `Starting download of ${model.name}...`]);
      await modelManager.downloadModel(model.name, {
        overwrite: false,
        timeout: 60000, // 1 minute timeout
        headers: {
          // Add any headers needed for your download
        },
      });
    } catch (error) {
      console.error(`Error downloading model ${model.name}:`, error);
      setLogs((prev) => [...prev, `Download error: ${error.message}`]);
      Alert.alert(
        "Download Error",
        `Failed to download model: ${error.message}`,
      );
    }
  };

  const handleCancelDownload = async (model: ModelInfo) => {
    try {
      await modelManager.cancelDownload(model.name);
      setLogs((prev) => [...prev, `Cancelled download of ${model.name}`]);
    } catch (error) {
      console.error(`Error cancelling download for ${model.name}:`, error);
      setLogs((prev) => [...prev, `Cancel error: ${error.message}`]);
    }
  };

  const handleDeleteModel = async (model: ModelInfo) => {
    // If this model is currently loaded, release it first
    if (modelHandle !== null && currentModelName === model.name) {
      await releaseModel();
    }

    try {
      const result = await modelManager.deleteModel(model.name);
      if (result) {
        setLogs((prev) => [...prev, `Deleted model ${model.name}`]);
        // Refresh downloaded models list after deletion
        await refreshDownloadedModels();
      } else {
        setLogs((prev) => [...prev, `Failed to delete model ${model.name}`]);
      }
    } catch (error) {
      console.error(`Error deleting model ${model.name}:`, error);
      setLogs((prev) => [...prev, `Delete error: ${error.message}`]);
      Alert.alert("Delete Error", `Failed to delete model: ${error.message}`);
    }
  };

  const handleLoadModel = async (model: ModelInfo) => {
    if (loading) {
      setLogs((prev) => [...prev, "Already loading a model, please wait..."]);
      return;
    }

    try {
      setLogs((prev) => [...prev, `Loading downloaded model ${model.name}...`]);
      await loadDownloadedModel(model.name);
    } catch (error) {
      console.error(`Error loading model ${model.name}:`, error);
      setLogs((prev) => [...prev, `Load error: ${error.message}`]);
      Alert.alert("Load Error", `Failed to load model: ${error.message}`);
    }
  };

  // Helper to get model display info from our catalog
  const getModelMetadata = (name: string) => {
    return (
      AVAILABLE_MODELS.find((m) => m.name === name) || {
        displayName: name,
        description: "Custom model",
        size: 0,
      }
    );
  };

  // Format file size for display
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  // Render a model item
  const renderModelItem = ({ item }: { item: ModelInfo }) => {
    const metadata = getModelMetadata(item.name);
    const isCurrentlyLoaded =
      modelHandle !== null && currentModelName === item.name;

    // Check if the model is in our downloadedModels list from context
    const isDownloadedInContext = downloadedModels.includes(item.name);

    // Compute the effective status to show in UI, without modifying the model object directly
    // since we can't access the private updateModelStatus method
    const displayStatus = isDownloadedInContext && item.status !== "downloading"
      ? "downloaded"
      : item.status;

    return (
      <View style={styles.modelCard}>
        <View style={styles.modelHeader}>
          <Text style={styles.modelName}>{metadata.displayName}</Text>
          {isCurrentlyLoaded && (
            <View style={styles.loadedBadge}>
              <Text style={styles.loadedBadgeText}>Active</Text>
            </View>
          )}
        </View>

        <Text style={styles.modelDescription}>{metadata.description}</Text>
        <Text style={styles.modelSize}>Size: {formatSize(metadata.size)}</Text>

        {/* Status indicator - use displayStatus instead of item.status */}
        <View style={styles.modelStatusContainer}>
          <Text style={styles.modelStatusLabel}>Status: </Text>
          <Text
            style={[
              styles.modelStatusValue,
              displayStatus === "downloaded"
                ? styles.statusDownloaded
                : displayStatus === "downloading"
                  ? styles.statusDownloading
                  : displayStatus === "error"
                    ? styles.statusError
                    : styles.statusNotDownloaded,
            ]}
          >
            {displayStatus === "downloaded"
              ? "Downloaded"
              : displayStatus === "downloading"
                ? "Downloading..."
                : displayStatus === "error"
                  ? "Error"
                  : "Not Downloaded"}
          </Text>
        </View>

        {/* Show progress bar for downloading models */}
        {displayStatus === "downloading" && (
          <View style={styles.progressContainer}>
            <Progress.Bar
              progress={item.progress || 0}
              width={null}
              color="#4CAF50"
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {Math.round((item.progress || 0) * 100)}%
            </Text>
          </View>
        )}

        {/* Show error message if applicable */}
        {displayStatus === "error" && (
          <Text style={styles.errorText}>Error: {item.error}</Text>
        )}

        <View style={styles.modelActions}>
          {/* Different buttons depending on status - use displayStatus */}
          {displayStatus === "not_downloaded" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownload(item)}
              disabled={loading}
            >
              <Ionicons name="cloud-download-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Download</Text>
            </TouchableOpacity>
          )}

          {displayStatus === "downloading" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelDownload(item)}
            >
              <Ionicons name="close-circle-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}

          {displayStatus === "downloaded" && (
            <View style={styles.downloadedActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.loadButton,
                  (isCurrentlyLoaded || loading) && styles.disabledButton,
                ]}
                onPress={() => handleLoadModel(item)}
                disabled={isCurrentlyLoaded || loading}
              >
                <Ionicons name="play-outline" size={18} color="white" />
                <Text style={styles.actionButtonText}>
                  {isCurrentlyLoaded
                    ? "Active"
                    : loading
                      ? "Loading..."
                      : "Load"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.deleteButton,
                  (isCurrentlyLoaded || loading) && styles.disabledButton,
                ]}
                onPress={() => handleDeleteModel(item)}
                disabled={isCurrentlyLoaded || loading}
              >
                <Ionicons name="trash-outline" size={18} color="white" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          {displayStatus === "error" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.retryButton]}
              onPress={() => handleDownload(item)}
              disabled={loading}
            >
              <Ionicons name="refresh-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Model Downloads</Text>
        {loading && (
          <View style={styles.loadingBanner}>
            <Text style={styles.loadingText}>
              Loading model, please wait...
            </Text>
          </View>
        )}

        <FlatList
          data={models}
          keyExtractor={(item) => item.name}
          renderItem={renderModelItem}
          contentContainerStyle={styles.modelList}
          onRefresh={handleRefreshModels}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Ionicons name="cloud-offline-outline" size={48} color="#888" />
              <Text style={styles.emptyStateText}>No models available</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}