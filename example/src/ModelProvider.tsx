import ExpoLlmMediapipe from "expo-llm-mediapipe";
import React from "react";

export const ModelContext = React.createContext<{
  modelHandle: number | null;
  modelState: "not_loaded" | "loading" | "loaded" | "error";
  loadModel: () => Promise<void>;
  releaseModel: () => Promise<void>;
  loading: boolean;
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
}>({
  modelHandle: null,
  modelState: "not_loaded",
  loadModel: async () => {},
  releaseModel: async () => {},
  loading: false,
  logs: [],
  setLogs: () => {},
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

  const MODEL_NAME = "gemma2-2b-it-cpu-int8.task";

  // Function to load the model
  const loadModel = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setModelState("loading");
      setLogs((prev) => [...prev, `Starting to load ${MODEL_NAME}...`]);

      // If we have a previous model handle, release it first
      if (modelHandle !== null) {
        try {
          await ExpoLlmMediapipe.releaseModelAsync(modelHandle);
          setLogs((prev) => [...prev, "Previous model released."]);
        } catch (releaseError) {
          setLogs((prev) => [
            ...prev,
            `Error releasing previous model: ${releaseError.message}`,
          ]);
        }
        setModelHandle(null);
      }

      // Load the new model
      // Load the new model
      const startTime = Date.now();
      const handle = await ExpoLlmMediapipe.createModelFromAsset(
        MODEL_NAME,
        1024, // maxTokens
        40, // topK
        0.7, // temperature
        42, // randomSeed
      );
      const endTime = Date.now();

      setModelHandle(handle);
      setModelState("loaded");
      setLogs((prev) => [
        ...prev,
        `Model loaded successfully in ${(endTime - startTime) / 1000} seconds. Handle: ${handle}`,
      ]);
    } catch (error) {
      setModelState("error");
      setLogs((prev) => [...prev, `Error loading model: ${error.message}`]);
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
      setModelState("not_loaded");
      setLogs((prev) => [...prev, "Model released successfully."]);
    } catch (error) {
      setLogs((prev) => [...prev, `Error releasing model: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const modelContextValue = {
    modelHandle,
    modelState,
    loadModel,
    releaseModel,
    loading,
    logs,
    setLogs,
  };

  return (
    <ModelContext.Provider value={modelContextValue}>
      {children}
    </ModelContext.Provider>
  );
};
