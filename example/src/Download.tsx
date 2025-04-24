import { Ionicons } from "@expo/vector-icons";
import ExpoLlmMediapipe, { modelManager, ModelInfo } from "expo-llm-mediapipe";
import * as Progress from "expo-progress";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";

import { styles } from "./styles";

// Available models for download
const AVAILABLE_MODELS = [
  {
    name: "gemma2-2b-it-cpu-int8.task",
    displayName: "Gemma 2B (Integer 8)",
    description: "Small, efficient instruction-tuned model (quantized)",
    size: 1200000000, // ~1.2GB
    url: "https://your-storage-url/models/gemma2-2b-it-cpu-int8.task", // Replace with actual URL
  },
  {
    name: "gemma2-7b-it-cpu-int8.task",
    displayName: "Gemma 7B (Integer 8)",
    description: "Larger capacity instruction-tuned model (quantized)",
    size: 3800000000, // ~3.8GB
    url: "https://your-storage-url/models/gemma2-7b-it-cpu-int8.task", // Replace with actual URL
  },
];

// Define a model context to share model state across screens
const ModelContext = React.createContext<{
  modelHandle: number | null;
  modelState: "not_loaded" | "loading" | "loaded" | "error";
  loadModel: (modelPath: string) => Promise<void>;
  releaseModel: () => Promise<void>;
  loading: boolean;
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  currentModelName: string | null;
  setCurrentModelName: React.Dispatch<React.SetStateAction<string | null>>;
}>({
  modelHandle: null,
  modelState: "not_loaded",
  loadModel: async () => {},
  releaseModel: async () => {},
  loading: false,
  logs: [],
  setLogs: () => {},
  currentModelName: null,
  setCurrentModelName: () => {},
});

// Downloads Screen Component
export default function DownloadsScreen() {
  const {
    modelHandle,
    loadModel,
    releaseModel,
    loading,
    setLogs,
    currentModelName,
    setCurrentModelName,
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
    refreshDownloadedModels();

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshDownloadedModels = async () => {
    setRefreshing(true);
    try {
      const downloadedModels = await ExpoLlmMediapipe.getDownloadedModels();
      console.log("Downloaded models:", downloadedModels);
      setRefreshing(false);
    } catch (error) {
      console.error("Error refreshing models:", error);
      setRefreshing(false);
    }
  };

  const handleDownload = async (model: ModelInfo) => {
    try {
      setLogs((prev) => [...prev, `Starting download of ${model.name}...`]);
      await modelManager.downloadModel(model.name);
    } catch (error) {
      console.error(`Error downloading model ${model.name}:`, error);
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
      } else {
        setLogs((prev) => [...prev, `Failed to delete model ${model.name}`]);
      }
    } catch (error) {
      console.error(`Error deleting model ${model.name}:`, error);
      Alert.alert("Delete Error", `Failed to delete model: ${error.message}`);
    }
  };

  const handleLoadModel = async (model: ModelInfo) => {
    if (modelHandle !== null) {
      // Release current model first
      await releaseModel();
    }

    try {
      setLogs((prev) => [...prev, `Loading downloaded model ${model.name}...`]);
      await loadModel(model.name);
      setCurrentModelName(model.name);
    } catch (error) {
      console.error(`Error loading model ${model.name}:`, error);
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

        {/* Status indicator */}
        <View style={styles.modelStatusContainer}>
          <Text style={styles.modelStatusLabel}>Status: </Text>
          <Text
            style={[
              styles.modelStatusValue,
              item.status === "downloaded"
                ? styles.statusDownloaded
                : item.status === "downloading"
                  ? styles.statusDownloading
                  : item.status === "error"
                    ? styles.statusError
                    : styles.statusNotDownloaded,
            ]}
          >
            {item.status === "downloaded"
              ? "Downloaded"
              : item.status === "downloading"
                ? "Downloading..."
                : item.status === "error"
                  ? "Error"
                  : "Not Downloaded"}
          </Text>
        </View>

        {/* Show progress bar for downloading models */}
        {item.status === "downloading" && (
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
        {item.status === "error" && (
          <Text style={styles.errorText}>Error: {item.error}</Text>
        )}

        <View style={styles.modelActions}>
          {/* Different buttons depending on status */}
          {item.status === "not_downloaded" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownload(item)}
            >
              <Ionicons name="cloud-download-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Download</Text>
            </TouchableOpacity>
          )}

          {item.status === "downloading" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelDownload(item)}
            >
              <Ionicons name="close-circle-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}

          {item.status === "downloaded" && (
            <View style={styles.downloadedActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.loadButton,
                  isCurrentlyLoaded && styles.disabledButton,
                ]}
                onPress={() => handleLoadModel(item)}
                disabled={isCurrentlyLoaded}
              >
                <Ionicons name="play-outline" size={18} color="white" />
                <Text style={styles.actionButtonText}>
                  {isCurrentlyLoaded ? "Active" : "Load"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteModel(item)}
              >
                <Ionicons name="trash-outline" size={18} color="white" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === "error" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.retryButton]}
              onPress={() => handleDownload(item)}
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

        <FlatList
          data={models}
          keyExtractor={(item) => item.name}
          renderItem={renderModelItem}
          contentContainerStyle={styles.modelList}
          onRefresh={refreshDownloadedModels}
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
