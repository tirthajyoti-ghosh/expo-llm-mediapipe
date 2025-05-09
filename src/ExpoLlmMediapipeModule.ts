import { requireNativeModule } from "expo-modules-core";
import * as React from "react";

import type {
  ExpoLlmMediapipeModule as NativeModuleType,
  DownloadOptions,
  DownloadProgressEvent,
  UseLLMProps, // General type for dispatcher
  BaseLlmReturn,
  DownloadableLlmReturn,
  UseLLMAssetProps,
  UseLLMFileProps,
  UseLLMDownloadableProps,
  PartialResponseEventPayload,
  ErrorResponseEventPayload,
} from "./ExpoLlmMediapipe.types";

const module = requireNativeModule<NativeModuleType>("ExpoLlmMediapipe");

// Hook Overloads
export function useLLM(props: UseLLMDownloadableProps): DownloadableLlmReturn;
export function useLLM(props: UseLLMAssetProps): BaseLlmReturn;
export function useLLM(props: UseLLMFileProps): BaseLlmReturn;

// Dispatcher Implementation
export function useLLM(props: UseLLMProps): BaseLlmReturn | DownloadableLlmReturn {
  if ('modelUrl' in props && props.modelUrl !== undefined) {
    return _useLLMDownloadable(props as UseLLMDownloadableProps);
  } else {
    return _useLLMBase(props as UseLLMAssetProps | UseLLMFileProps);
  }
}

// Internal implementation for Downloadable models
function _useLLMDownloadable(props: UseLLMDownloadableProps): DownloadableLlmReturn {
  const [modelHandle, setModelHandle] = React.useState<number | undefined>();
  const nextRequestIdRef = React.useRef(0);

  const [downloadStatus, setDownloadStatus] = React.useState<
    "not_downloaded" | "downloading" | "downloaded" | "error"
  >("not_downloaded");
  const [downloadProgress, setDownloadProgress] = React.useState<number>(0);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(true);

  const { modelUrl, modelName, maxTokens, topK, temperature, randomSeed } = props;

  React.useEffect(() => {
    const checkModelStatus = async () => {
      setIsCheckingStatus(true);
      try {
        const isDownloaded = await module.isModelDownloaded(modelName);
        setDownloadStatus(isDownloaded ? "downloaded" : "not_downloaded");
        if (isDownloaded) setDownloadProgress(1); else setDownloadProgress(0);
      } catch (error) {
        console.error(`Error checking model status for ${modelName}:`, error);
        setDownloadError(error instanceof Error ? error.message : String(error));
        setDownloadStatus("error");
      } finally {
        setIsCheckingStatus(false);
      }
    };
    checkModelStatus();
  }, [modelName]);

  React.useEffect(() => {
    const subscription = module.addListener(
      "downloadProgress",
      (event: DownloadProgressEvent) => {
        if (event.modelName !== modelName) return;

        if (event.status === "downloading" && event.progress !== undefined) {
          setDownloadProgress(event.progress);
          setDownloadStatus("downloading");
        } else if (event.status === "completed") {
          setDownloadProgress(1);
          setDownloadStatus("downloaded");
          setDownloadError(null);
        } else if (event.status === "error") {
          setDownloadStatus("error");
          setDownloadError(event.error || "Unknown error occurred");
        } else if (event.status === "cancelled") {
          setDownloadStatus("not_downloaded");
          setDownloadProgress(0);
        }
      },
    );
    return () => subscription.remove();
  }, [modelName]);

  React.useEffect(() => {
    const currentModelHandle = modelHandle;
    return () => {
      if (currentModelHandle !== undefined) {
        console.log(`Releasing downloadable model with handle ${currentModelHandle}.`);
        module.releaseModel(currentModelHandle)
          .then(() => console.log(`Successfully released model ${currentModelHandle}`))
          .catch((error) => console.error(`Error releasing model ${currentModelHandle}:`, error));
      }
    };
  }, [modelHandle]);

  const downloadModelHandler = React.useCallback(
    async (options?: DownloadOptions): Promise<boolean> => {
      try {
        setDownloadStatus("downloading");
        setDownloadProgress(0);
        setDownloadError(null);
        const result = await module.downloadModel(modelUrl, modelName, options);
        return result;
      } catch (error) {
        console.error(`Error initiating download for ${modelName}:`, error);
        setDownloadStatus("error");
        setDownloadError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [modelUrl, modelName],
  );

  const loadModelHandler = React.useCallback(async (): Promise<void> => {
    if (modelHandle !== undefined) {
      console.log(`Model ${modelName} already loaded or load in progress.`);
      return;
    }
    if (downloadStatus !== "downloaded") {
      throw new Error(`Model ${modelName} is not downloaded. Call downloadModel() first.`);
    }
    try {
      console.log(`Attempting to load downloaded model: ${modelName}`);
      const handle = await module.createModelFromDownloaded(
        modelName,
        maxTokens ?? 512,
        topK ?? 40,
        temperature ?? 0.8,
        randomSeed ?? 0,
      );
      console.log(`Loaded downloaded model '${modelName}' with handle ${handle}`);
      setModelHandle(handle);
    } catch (error) {
      console.error(`Error loading downloaded model '${modelName}':`, error);
      setModelHandle(undefined);
      throw error;
    }
  }, [modelHandle, downloadStatus, modelName, maxTokens, topK, temperature, randomSeed]);

  const generateResponse = React.useCallback(
    async (
      promptText: string,
      onPartial?: (partial: string, reqId: number | undefined) => void,
      onErrorCb?: (message: string, reqId: number | undefined) => void,
      abortSignal?: AbortSignal,
    ): Promise<string> => {
      if (modelHandle === undefined) {
        throw new Error("Model is not loaded. Call loadModel() first.");
      }
      const requestId = nextRequestIdRef.current++;

      const partialSub = module.addListener("onPartialResponse", (ev: PartialResponseEventPayload) => {
        if (onPartial && requestId === ev.requestId && ev.handle === modelHandle && !(abortSignal?.aborted ?? false)) {
          onPartial(ev.response, ev.requestId);
        }
      });
      const errorSub = module.addListener("onErrorResponse", (ev: ErrorResponseEventPayload) => {
        if (onErrorCb && requestId === ev.requestId && ev.handle === modelHandle && !(abortSignal?.aborted ?? false)) {
          onErrorCb(ev.error, ev.requestId);
        }
      });

      try {
        return await module.generateResponse(modelHandle, requestId, promptText);
      } catch (e) {
        console.error("Generate response error:", e);
        if (onErrorCb && !(abortSignal?.aborted ?? false)) {
          onErrorCb(e instanceof Error ? e.message : String(e), requestId);
        }
        throw e;
      } finally {
        partialSub.remove();
        errorSub.remove();
      }
    },
    [modelHandle]
  );

  const generateStreamingResponse = React.useCallback(
    async (
      promptText: string,
      onPartial?: (partial: string, reqId: number) => void,
      onErrorCb?: (message: string, reqId: number) => void,
      abortSignal?: AbortSignal,
    ): Promise<void> => {
      if (modelHandle === undefined) {
        throw new Error("Model is not loaded. Call loadModel() first.");
      }
      const requestId = nextRequestIdRef.current++;

      return new Promise<void>((resolve, reject) => {
        const partialSubscription = module.addListener("onPartialResponse", (ev: PartialResponseEventPayload) => {
          if (ev.handle === modelHandle && ev.requestId === requestId && !(abortSignal?.aborted ?? false)) {
            if (onPartial) onPartial(ev.response, ev.requestId);
          }
        });
        const errorSubscription = module.addListener("onErrorResponse", (ev: ErrorResponseEventPayload) => {
          if (ev.handle === modelHandle && ev.requestId === requestId && !(abortSignal?.aborted ?? false)) {
            if (onErrorCb) onErrorCb(ev.error, ev.requestId);
            errorSubscription.remove();
            partialSubscription.remove();
            reject(new Error(ev.error));
          }
        });

        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            errorSubscription.remove();
            partialSubscription.remove();
            console.log(`Request ${requestId} aborted for downloadable model.`);
            reject(new Error("Aborted"));
          });
        }

        module.generateResponseAsync(modelHandle, requestId, promptText)
          .then(() => {
            if (!(abortSignal?.aborted ?? false)) {
              errorSubscription.remove();
              partialSubscription.remove();
              resolve();
            }
          })
          .catch((error) => {
            if (!(abortSignal?.aborted ?? false)) {
              errorSubscription.remove();
              partialSubscription.remove();
              if (onErrorCb) {
                onErrorCb(error instanceof Error ? error.message : String(error), requestId);
              }
              reject(error);
            }
          });
      });
    },
    [modelHandle]
  );

  return React.useMemo(() => ({
    generateResponse,
    generateStreamingResponse,
    isLoaded: modelHandle !== undefined,
    downloadModel: downloadModelHandler,
    loadModel: loadModelHandler,
    downloadStatus,
    downloadProgress,
    downloadError,
    isCheckingStatus,
  }), [
    generateResponse, generateStreamingResponse, modelHandle,
    downloadModelHandler, loadModelHandler, downloadStatus, downloadProgress, downloadError, isCheckingStatus,
  ]);
}

// Internal implementation for Asset/File models
function _useLLMBase(props: UseLLMAssetProps | UseLLMFileProps): BaseLlmReturn {
  const [modelHandle, setModelHandle] = React.useState<number | undefined>();
  const nextRequestIdRef = React.useRef(0);

  const { maxTokens, topK, temperature, randomSeed } = props;
  let modelIdentifier: string | undefined;
  let storageType: "asset" | "file" | undefined;

  if (props.storageType === 'asset') {
    modelIdentifier = props.modelName;
    storageType = props.storageType;
  } else if (props.storageType === 'file') {
    modelIdentifier = props.modelPath;
    storageType = props.storageType;
  }

  React.useEffect(() => {
    if (!storageType || !modelIdentifier) {
      if (modelHandle !== undefined) setModelHandle(undefined);
      return;
    }

    const currentConfigStorageKey = modelIdentifier;
    const currentStorageType = storageType;
    
    console.log(`Attempting to create non-downloadable model: ${currentConfigStorageKey}, type: ${currentStorageType}`);
    
    let active = true;
    const modelCreatePromise =
      currentStorageType === "asset"
        ? module.createModelFromAsset(currentConfigStorageKey, maxTokens ?? 512, topK ?? 40, temperature ?? 0.8, randomSeed ?? 0)
        : module.createModel(currentConfigStorageKey, maxTokens ?? 512, topK ?? 40, temperature ?? 0.8, randomSeed ?? 0);

    modelCreatePromise
      .then((handle: number) => {
        if (active) {
          console.log(`Created non-downloadable model with handle ${handle} for ${currentConfigStorageKey}`);
          setModelHandle(handle);
        } else {
          module.releaseModel(handle).catch(e => console.error("Error releasing model from stale promise (non-downloadable)", e));
        }
      })
      .catch((error: Error) => {
        if (active) {
          console.error(`createModel error for ${currentConfigStorageKey} (non-downloadable):`, error);
          setModelHandle(undefined);
        }
      });

    return () => {
      active = false;
    };
  }, [modelIdentifier, storageType, maxTokens, topK, temperature, randomSeed]);

  React.useEffect(() => {
    const currentModelHandle = modelHandle;
    return () => {
      if (currentModelHandle !== undefined) {
        console.log(`Releasing base model with handle ${currentModelHandle}.`);
        module.releaseModel(currentModelHandle)
          .then(() => console.log(`Successfully released model ${currentModelHandle}`))
          .catch((error) => console.error(`Error releasing model ${currentModelHandle}:`, error));
      }
    };
  }, [modelHandle]);

  const generateResponse = React.useCallback(
    async (
      promptText: string,
      onPartial?: (partial: string, reqId: number | undefined) => void,
      onErrorCb?: (message: string, reqId: number | undefined) => void,
      abortSignal?: AbortSignal,
    ): Promise<string> => {
      if (modelHandle === undefined) {
        throw new Error("Model handle is not defined. Ensure model is created/loaded.");
      }
      const requestId = nextRequestIdRef.current++;

      const partialSub = module.addListener("onPartialResponse", (ev: PartialResponseEventPayload) => {
        if (onPartial && requestId === ev.requestId && ev.handle === modelHandle && !(abortSignal?.aborted ?? false)) {
          onPartial(ev.response, ev.requestId);
        }
      });
      const errorSub = module.addListener("onErrorResponse", (ev: ErrorResponseEventPayload) => {
        if (onErrorCb && requestId === ev.requestId && ev.handle === modelHandle && !(abortSignal?.aborted ?? false)) {
          onErrorCb(ev.error, ev.requestId);
        }
      });

      try {
        return await module.generateResponse(modelHandle, requestId, promptText);
      } catch (e) {
        console.error("Generate response error:", e);
        if (onErrorCb && !(abortSignal?.aborted ?? false)) {
          onErrorCb(e instanceof Error ? e.message : String(e), requestId);
        }
        throw e;
      } finally {
        partialSub.remove();
        errorSub.remove();
      }
    },
    [modelHandle]
  );

  const generateStreamingResponse = React.useCallback(
    async (
      promptText: string,
      onPartial?: (partial: string, reqId: number) => void,
      onErrorCb?: (message: string, reqId: number) => void,
      abortSignal?: AbortSignal,
    ): Promise<void> => {
      if (modelHandle === undefined) {
        throw new Error("Model handle is not defined. Ensure model is created/loaded.");
      }
      const requestId = nextRequestIdRef.current++;

      return new Promise<void>((resolve, reject) => {
        const partialSubscription = module.addListener("onPartialResponse", (ev: PartialResponseEventPayload) => {
          if (ev.handle === modelHandle && ev.requestId === requestId && !(abortSignal?.aborted ?? false)) {
            if (onPartial) onPartial(ev.response, ev.requestId);
          }
        });
        const errorSubscription = module.addListener("onErrorResponse", (ev: ErrorResponseEventPayload) => {
          if (ev.handle === modelHandle && ev.requestId === requestId && !(abortSignal?.aborted ?? false)) {
            if (onErrorCb) onErrorCb(ev.error, ev.requestId);
            errorSubscription.remove();
            partialSubscription.remove();
            reject(new Error(ev.error));
          }
        });

        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            errorSubscription.remove();
            partialSubscription.remove();
            console.log(`Request ${requestId} aborted for base model.`);
            reject(new Error("Aborted"));
          });
        }

        module.generateResponseAsync(modelHandle, requestId, promptText)
          .then(() => {
            if (!(abortSignal?.aborted ?? false)) {
              errorSubscription.remove();
              partialSubscription.remove();
              resolve();
            }
          })
          .catch((error) => {
            if (!(abortSignal?.aborted ?? false)) {
              errorSubscription.remove();
              partialSubscription.remove();
              if (onErrorCb) {
                onErrorCb(error instanceof Error ? error.message : String(error), requestId);
              }
              reject(error);
            }
          });
      });
    },
    [modelHandle]
  );

  return React.useMemo(() => ({
    generateResponse,
    generateStreamingResponse,
    isLoaded: modelHandle !== undefined,
  }), [generateResponse, generateStreamingResponse, modelHandle]);
}


/**
 * Generate a streaming text response from the LLM.
 * This is an independent utility function.
 */
export function generateStreamingText(
  modelHandle: number,
  prompt: string,
  onPartialResponse?: (text: string, requestId: number) => void,
  onError?: (error: string, requestId: number) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!modelHandle && modelHandle !== 0) { // modelHandle can be 0
      reject(new Error("Invalid model handle provided to generateStreamingText."));
      return;
    }

    const requestId = Math.floor(Math.random() * 1000000); // Increased range for uniqueness

    const partialSubscription = module.addListener(
      "onPartialResponse",
      (ev: PartialResponseEventPayload) => {
        if (
          ev.handle === modelHandle &&
          ev.requestId === requestId &&
          !(abortSignal?.aborted ?? false)
        ) {
          if (onPartialResponse) {
            onPartialResponse(ev.response, ev.requestId);
          }
        }
      },
    );

    const errorSubscription = module.addListener(
      "onErrorResponse",
      (ev: ErrorResponseEventPayload) => {
        if (
          ev.handle === modelHandle &&
          ev.requestId === requestId &&
          !(abortSignal?.aborted ?? false)
        ) {
          if (onError) {
            onError(ev.error, ev.requestId);
          }
          errorSubscription.remove();
          partialSubscription.remove();
          reject(new Error(ev.error));
        }
      },
    );

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        // Check if subscriptions still exist before removing
        // This is a defensive check, as they might have been removed by completion/error
        try {
            partialSubscription.remove();
        } catch (subError) {
            // console.warn("generateStreamingText: Error removing partialSubscription on abort:", subError);
        }
        try {
            errorSubscription.remove();
        } catch (subError) {
            // console.warn("generateStreamingText: Error removing errorSubscription on abort:", subError);
        }
        console.log(`generateStreamingText Request ${requestId} aborted.`);
        reject(new Error("Aborted"));
      });
    }

    module
      .generateResponseAsync(modelHandle, requestId, prompt)
      .then(() => {
        if (!(abortSignal?.aborted ?? false)) {
          partialSubscription.remove();
          errorSubscription.remove();
          resolve();
        }
        // If aborted, the abort listener should have handled rejection and cleanup.
      })
      .catch((error) => {
        if (!(abortSignal?.aborted ?? false)) {
          partialSubscription.remove();
          errorSubscription.remove();
          if (onError) {
            onError(error instanceof Error ? error.message : String(error), requestId);
          }
          reject(error);
        }
        // If aborted, the abort listener should have handled rejection and cleanup.
      });
  });
}

export default module;
