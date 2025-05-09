export type OnLoadEventPayload = {
  url: string;
};

export type ExpoLlmMediapipeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
  onPartialResponse: (params: PartialResponseEventPayload) => void;
  onErrorResponse: (params: ErrorResponseEventPayload) => void;
  logging: (params: LoggingEventPayload) => void;
  downloadProgress: (params: DownloadProgressEvent) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type PartialResponseEventPayload = {
  handle: number;
  requestId: number;
  response: string;
};

export type ErrorResponseEventPayload = {
  handle: number;
  requestId: number;
  error: string;
};

export type LoggingEventPayload = {
  handle: number;
  message: string;
};

// LLM Types and Hook
type LlmModelLocation =
  | { storageType: "asset"; modelName: string }
  | { storageType: "file"; modelPath: string };

export type LlmInferenceConfig = LlmModelLocation & {
  maxTokens?: number;
  topK?: number;
  temperature?: number;
  randomSeed?: number;
};

export interface DownloadProgressEvent {
  modelName: string;
  url?: string;
  bytesDownloaded?: number;
  totalBytes?: number;
  progress?: number;
  status: "downloading" | "completed" | "error" | "cancelled";
  error?: string;
}

export interface DownloadOptions {
  overwrite?: boolean;
  timeout?: number;
  headers?: Record<string, string>;
}

type BaseLlmParams = {
  maxTokens?: number;
  topK?: number;
  temperature?: number;
  randomSeed?: number;
};

/**
 * Props for the `useLLM` hook.
 * - If `modelUrl` is provided, `modelName` is also required for downloadable models.
 * - Otherwise, `storageType` and either `modelName` (for assets) or `modelPath` (for files) are required.
 */
// This existing UseLLMProps is a good union type for the implementation signature.
export type UseLLMProps = BaseLlmParams & (
  | { modelUrl?: undefined; storageType: "asset"; modelName: string; modelPath?: undefined }
  | { modelUrl?: undefined; storageType: "file"; modelPath: string; modelName?: undefined }
  | { modelUrl: string; modelName: string; storageType?: undefined; modelPath?: undefined }
);

// Specific prop types for hook overloads
export type UseLLMAssetProps = BaseLlmParams & { modelUrl?: undefined; storageType: "asset"; modelName: string; modelPath?: undefined };
export type UseLLMFileProps = BaseLlmParams & { modelUrl?: undefined; storageType: "file"; modelPath: string; modelName?: undefined };
export type UseLLMDownloadableProps = BaseLlmParams & { modelUrl: string; modelName: string; storageType?: undefined; modelPath?: undefined };


// Return types for the useLLM hook
export interface BaseLlmReturn {
  generateResponse: (
    promptText: string,
    onPartial?: (partial: string, reqId: number | undefined) => void,
    onErrorCb?: (message: string, reqId: number | undefined) => void,
    abortSignal?: AbortSignal
  ) => Promise<string>;
  generateStreamingResponse: (
    promptText: string,
    onPartial?: (partial: string, reqId: number) => void,
    onErrorCb?: (message: string, reqId: number) => void,
    abortSignal?: AbortSignal
  ) => Promise<void>;
  isLoaded: boolean;
}

export interface DownloadableLlmReturn extends BaseLlmReturn {
  downloadModel: (options?: DownloadOptions) => Promise<boolean>;
  loadModel: () => Promise<void>;
  downloadStatus: "not_downloaded" | "downloading" | "downloaded" | "error";
  downloadProgress: number;
  downloadError: string | null;
  isCheckingStatus: boolean;
}

export interface NativeModuleSubscription {
  remove(): void;
}

export interface ExpoLlmMediapipeModule {
  /**
   * Creates a model from a file path.
   * @param modelPath - The path to the model file.
   * @param maxTokens - The maximum number of tokens to generate.
   * @param topK - The number of top tokens to consider.
   * @param temperature - The temperature for sampling.
   * @param randomSeed - The random seed for reproducibility.
   * @returns A promise that resolves to the model handle.
   */
  createModel(
    modelPath: string,
    maxTokens: number,
    topK: number,
    temperature: number,
    randomSeed: number,
  ): Promise<number>;

  /**
   * Creates a model from an asset.
   * @param modelName - The name of the model asset.
   * @param maxTokens - The maximum number of tokens to generate.
   * @param topK - The number of top tokens to consider.
   * @param temperature - The temperature for sampling.
   * @param randomSeed - The random seed for reproducibility.
   * @returns A promise that resolves to the model handle.
   */
  createModelFromAsset(
    modelName: string,
    maxTokens: number,
    topK: number,
    temperature: number,
    randomSeed: number,
  ): Promise<number>;
  releaseModel(handle: number): Promise<boolean>;

  /**
   * Generates a response based on the provided prompt.
   * @param handle - The model handle.
   * @param requestId - The unique request identifier.
   * @param prompt - The input prompt for the model.
   * @returns A promise that resolves to the generated response.
   */
  generateResponse(
    handle: number,
    requestId: number,
    prompt: string,
  ): Promise<string>;

  /**
   * Generates a response asynchronously based on the provided prompt.
   * @param handle - The model handle.
   * @param requestId - The unique request identifier.
   * @param prompt - The input prompt for the model.
   * @returns A promise that resolves to a boolean indicating success or failure.
   */
  generateResponseAsync(
    handle: number,
    requestId: number,
    prompt: string,
  ): Promise<boolean>;

  /**
   * Checks if a model is downloaded.
   * @param modelName - The name of the model to check.
   * @returns A promise that resolves to a boolean indicating if the model is downloaded.
   */
  isModelDownloaded(modelName: string): Promise<boolean>;

  /**
   * Lists all downloaded models.
   * @returns A promise that resolves to an array of model names.
   */
  getDownloadedModels(): Promise<string[]>;

  /**
   * Deletes a downloaded model.
   * @param modelName - The name of the model to delete.
   * @returns A promise that resolves to a boolean indicating success or failure.
   */
  deleteDownloadedModel(modelName: string): Promise<boolean>;

  /**
   * Downloads a model from a given URL.
   * @param url - The URL to download the model from.
   * @param modelName - The name to save the downloaded model as.
   * @param options - Optional download options.
   * @returns A promise that resolves to a boolean indicating success or failure.
   */
  downloadModel(
    url: string,
    modelName: string,
    options?: DownloadOptions,
  ): Promise<boolean>;

  /**
   * Cancels a model download.
   * @param modelName - The name of the model to cancel the download for.
   * @returns A promise that resolves to a boolean indicating success or failure.
   */
  cancelDownload(modelName: string): Promise<boolean>;

  /**
   * Creates a model from a downloaded file.
   * @param modelName - The name of the downloaded model.
   * @param maxTokens - The maximum number of tokens to generate.
   * @param topK - The number of top tokens to consider.
   * @param temperature - The temperature for sampling.
   * @param randomSeed - The random seed for reproducibility.
   * @returns A promise that resolves to the model handle.
   */
  createModelFromDownloaded(
    modelName: string,
    maxTokens?: number,
    topK?: number,
    temperature?: number,
    randomSeed?: number,
  ): Promise<number>;

  /**
   * Adds a listener for a specific event.
   * @param eventName - The name of the event to listen for.
   * @param listener - The callback function to execute when the event occurs.
   * @returns A subscription object to manage the listener.
   */
  addListener<EventName extends keyof ExpoLlmMediapipeModuleEvents>(
    eventName: EventName,
    listener: ExpoLlmMediapipeModuleEvents[EventName],
  ): NativeModuleSubscription;

  /**
   * Removes all listeners for a specific event.
   * @param event - The name of the event to remove listeners for.
   * @returns A promise that resolves when all listeners have been removed.
   */
  removeAllListeners(event: keyof ExpoLlmMediapipeModuleEvents): void;
}
