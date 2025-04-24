import ExpoLlmMediapipe from "expo-llm-mediapipe";
import React, { useEffect, useMemo } from "react";

// Enhanced context with downloaded models support
export const ModelContext = React.createContext<{
  modelHandle: number | null;
  modelState: "not_loaded" | "loading" | "loaded" | "error";
  loadModel: (modelName?: string) => Promise<void>;
  loadDownloadedModel: (modelName: string) => Promise<void>;
  releaseModel: () => Promise<void>;
  loading: boolean;
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  downloadedModels: string[];
  refreshDownloadedModels: () => Promise<void>;
  currentModelName: string | null;
}>({
  modelHandle: null,
  modelState: "not_loaded",
  loadModel: async () => {},
  loadDownloadedModel: async () => {},
  releaseModel: async () => {},
  loading: false,
  logs: [],
  setLogs: () => {},
  downloadedModels: [],
  refreshDownloadedModels: async () => {},
  currentModelName: null,
});

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modelHandle, setModelHandle] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [modelState, setModelState] = React.useState<
    "not_loaded" | "loading" | "loaded" | "error"
  >("not_loaded");
  const [downloadedModels, setDownloadedModels] = React.useState<string[]>([]);
  const [currentModelName, setCurrentModelName] = React.useState<string | null>(
    null,
  );

  // Default bundled model
  const DEFAULT_MODEL_NAME = "gemma2-2b-it-cpu-int8.task";

  // Refresh the list of downloaded models
  const refreshDownloadedModels = async () => {
    try {
      const models = await ExpoLlmMediapipe.getDownloadedModels();
      setDownloadedModels(models);
      return models;
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        `Error fetching downloaded models: ${error.message}`,
      ]);
      return [];
    }
  };

  // Initial fetch of downloaded models
  useEffect(() => {
    refreshDownloadedModels();
  }, []);

  // Release the current model if it exists
  const releaseCurrentModel = async () => {
    if (modelHandle !== null) {
      try {
        await ExpoLlmMediapipe.releaseModel(modelHandle);
        setLogs((prev) => [...prev, "Previous model released."]);
      } catch (releaseError) {
        setLogs((prev) => [
          ...prev,
          `Error releasing previous model: ${releaseError.message}`,
        ]);
      }
      setModelHandle(null);
      setCurrentModelName(null);
    }
  };

  // Function to load the model (either default or specified)
  const loadModel = async (modelName?: string) => {
    if (loading) return;

    try {
      const modelToLoad = modelName || DEFAULT_MODEL_NAME;
      setLoading(true);
      setModelState("loading");
      setLogs((prev) => [...prev, `Starting to load ${modelToLoad}...`]);

      // Release any existing model
      await releaseCurrentModel();

      // Load the model from bundled assets
      const startTime = Date.now();
      const handle = await ExpoLlmMediapipe.createModelFromAsset(
        modelToLoad,
        1024, // maxTokens
        40, // topK
        0.7, // temperature
        42, // randomSeed
      );
      const endTime = Date.now();

      setModelHandle(handle);
      setModelState("loaded");
      setCurrentModelName(modelToLoad);
      setLogs((prev) => [
        ...prev,
        `Model ${modelToLoad} loaded successfully in ${(endTime - startTime) / 1000} seconds. Handle: ${handle}`,
      ]);
    } catch (error) {
      setModelState("error");
      setLogs((prev) => [...prev, `Error loading model: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  // Function to load a downloaded model
  const loadDownloadedModel = async (modelName: string) => {
    if (loading) return;

    try {
      setLoading(true);
      setModelState("loading");
      setLogs((prev) => [
        ...prev,
        `Starting to load downloaded model ${modelName}...`,
      ]);

      // Release any existing model
      await releaseCurrentModel();

      // Load the downloaded model
      const startTime = Date.now();
      const handle = await ExpoLlmMediapipe.createModelFromDownloaded(
        modelName,
        1024, // maxTokens
        40, // topK
        0.7, // temperature
        42, // randomSeed
      );
      const endTime = Date.now();

      setModelHandle(handle);
      setModelState("loaded");
      setCurrentModelName(modelName);
      setLogs((prev) => [
        ...prev,
        `Downloaded model ${modelName} loaded successfully in ${(endTime - startTime) / 1000} seconds. Handle: ${handle}`,
      ]);
    } catch (error) {
      setModelState("error");
      setLogs((prev) => [
        ...prev,
        `Error loading downloaded model: ${error.message}`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Function to release the model
  const releaseModel = async () => {
    if (modelHandle === null || loading) return;

    try {
      setLoading(true);
      setLogs((prev) => [
        ...prev,
        `Releasing model with handle ${modelHandle}...`,
      ]);

      await ExpoLlmMediapipe.releaseModel(modelHandle);

      setModelHandle(null);
      setCurrentModelName(null);
      setModelState("not_loaded");
      setLogs((prev) => [...prev, "Model released successfully."]);
    } catch (error) {
      setLogs((prev) => [...prev, `Error releasing model: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  // Set up event listener for any model loading events
  useEffect(() => {
    const subscription = ExpoLlmMediapipe.addListener("logging", (event) => {
      if (event.message) {
        setLogs((prev) => [...prev, `Native: ${event.message}`]);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const modelContextValue = useMemo(
    () => ({
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
    }),
    [
      modelHandle,
      modelState,
      loading,
      logs,
      downloadedModels,
      currentModelName,
    ],
  );

  return (
    <ModelContext.Provider value={modelContextValue}>
      {children}
    </ModelContext.Provider>
  );
};
