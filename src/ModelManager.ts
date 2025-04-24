import ExpoLlmMediapipe, {
  DownloadProgressEvent,
} from "./ExpoLlmMediapipeModule";

export interface ModelInfo {
  name: string;
  url: string;
  size?: number;
  status: "not_downloaded" | "downloading" | "downloaded" | "error";
  progress?: number;
  error?: string;
}

export class ModelManager {
  private models: Map<string, ModelInfo> = new Map();
  private listeners: ((models: Map<string, ModelInfo>) => void)[] = [];
  private downloadSubscription?: { remove: () => void };

  constructor() {
    // Set up download progress listener
    this.downloadSubscription = ExpoLlmMediapipe.addListener(
      "downloadProgress",
      this.handleDownloadProgress,
    );
  }

  private handleDownloadProgress = (event: DownloadProgressEvent) => {
    const { modelName, progress, status, error } = event;

    // Update model info
    const model = this.models.get(modelName);
    if (model) {
      model.status =
        status === "completed"
          ? "downloaded"
          : status === "error"
            ? "error"
            : status === "downloading"
              ? "downloading"
              : "not_downloaded";

      if (progress !== undefined) {
        model.progress = progress;
      }

      if (error) {
        model.error = error;
      }

      // Save updated model info
      this.models.set(modelName, model);

      // Notify listeners
      this.notifyListeners();
    }
  };

  public registerModel(name: string, url: string): void {
    if (!this.models.has(name)) {
      this.models.set(name, {
        name,
        url,
        status: "not_downloaded",
      });

      // Check if it's already downloaded
      this.checkModelStatus(name);
    }
  }

  private async checkModelStatus(modelName: string): Promise<void> {
    try {
      const isDownloaded = await ExpoLlmMediapipe.isModelDownloaded(modelName);
      const model = this.models.get(modelName);

      if (model) {
        model.status = isDownloaded ? "downloaded" : "not_downloaded";
        this.models.set(modelName, model);
        this.notifyListeners();
      }
    } catch (error) {
      console.error(`Error checking model status: ${error}`);
    }
  }

  public async downloadModel(modelName: string): Promise<boolean> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} is not registered`);
    }

    try {
      // Update status to downloading
      model.status = "downloading";
      model.progress = 0;
      this.models.set(modelName, model);
      this.notifyListeners();

      // Start download
      const result = await ExpoLlmMediapipe.downloadModel(model.url, modelName);
      return result;
    } catch (error) {
      // Update status to error
      model.status = "error";
      model.error = error.message;
      this.models.set(modelName, model);
      this.notifyListeners();
      throw error;
    }
  }

  public async cancelDownload(modelName: string): Promise<boolean> {
    return await ExpoLlmMediapipe.cancelDownload(modelName);
  }

  public async deleteModel(modelName: string): Promise<boolean> {
    const result = await ExpoLlmMediapipe.deleteDownloadedModel(modelName);
    if (result) {
      const model = this.models.get(modelName);
      if (model) {
        model.status = "not_downloaded";
        model.progress = undefined;
        this.models.set(modelName, model);
        this.notifyListeners();
      }
    }
    return result;
  }

  public async getDownloadedModels(): Promise<string[]> {
    return await ExpoLlmMediapipe.getDownloadedModels();
  }

  public async loadDownloadedModel(
    modelName: string,
    maxTokens?: number,
    topK?: number,
    temperature?: number,
    randomSeed?: number,
  ): Promise<number> {
    return await ExpoLlmMediapipe.createModelFromDownloaded(
      modelName,
      maxTokens,
      topK,
      temperature,
      randomSeed,
    );
  }

  public getModelInfo(modelName: string): ModelInfo | undefined {
    return this.models.get(modelName);
  }

  public getAllModels(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  public addListener(
    callback: (models: Map<string, ModelInfo>) => void,
  ): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback,
      );
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.models);
    });
  }

  public cleanup(): void {
    if (this.downloadSubscription) {
      this.downloadSubscription.remove();
    }

    this.listeners = [];
  }
}

// Export a singleton instance
export const modelManager = new ModelManager();

// Also export the class for those who need multiple instances
export default ModelManager;
