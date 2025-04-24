import { EventEmitter, requireNativeModule } from "expo-modules-core";
import * as React from "react";

import type { ExpoLlmMediapipeModuleEvents } from "./ExpoLlmMediapipe.types";

// Import the Native Module
const module = requireNativeModule("ExpoLlmMediapipe");

// Create an event emitter for handling module events
const eventEmitter = new EventEmitter<ExpoLlmMediapipeModuleEvents>(
  module ?? {},
);

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

export interface ExpoLlmMediapipeModule {
  // Existing methods...

  // Model download management
  downloadModel(
    url: string,
    modelName: string,
    options?: DownloadOptions,
  ): Promise<boolean>;
  isModelDownloaded(modelName: string): Promise<boolean>;
  getDownloadedModels(): Promise<string[]>;
  deleteDownloadedModel(modelName: string): Promise<boolean>;
  cancelDownload(modelName: string): Promise<boolean>;
  createModelFromDownloaded(
    modelName: string,
    maxTokens?: number,
    topK?: number,
    temperature?: number,
    randomSeed?: number,
  ): Promise<number>;

  // Events
  addListener(
    eventName: string,
    listener: (event: any) => void,
  ): typeof EventEmitter;
}

function getConfigStorageKey(config: LlmInferenceConfig): string {
  if (config.storageType === "asset") {
    return `${config.modelName}`;
  }
  return `${config.modelPath}`;
}

export function useLlmInference(config: LlmInferenceConfig) {
  const [modelHandle, setModelHandle] = React.useState<number | undefined>();
  const configStorageKey = getConfigStorageKey(config);

  React.useEffect(() => {
    // Skip model creation if configStorageKey is empty
    if (configStorageKey.length === 0) {
      console.warn(
        "No valid model path or name provided. Skipping model creation.",
      );
      return;
    }

    let newHandle: number | undefined;
    const modelCreatePromise =
      config.storageType === "asset"
        ? module.createModelFromAsset(
            configStorageKey,
            config.maxTokens ?? 512,
            config.topK ?? 40,
            config.temperature ?? 0.8,
            config.randomSeed ?? 0,
          )
        : module.createModel(
            configStorageKey,
            config.maxTokens ?? 512,
            config.topK ?? 40,
            config.temperature ?? 0.8,
            config.randomSeed ?? 0,
          );

    modelCreatePromise
      .then((handle: number) => {
        console.log(`Created model with handle ${handle}`);
        setModelHandle(handle);
        newHandle = handle;
      })
      .catch((error: Error) => {
        console.error("createModel error:", error);
      });

    return () => {
      if (newHandle !== undefined) {
        module
          .releaseModel(newHandle)
          .then(() => {
            console.log(`Released model with handle ${newHandle}`);
          })
          .catch((error: Error) => {
            console.error("releaseModel error:", error);
          });
      }
    };
  }, [
    config.maxTokens,
    config.storageType,
    config.randomSeed,
    config.temperature,
    config.topK,
    configStorageKey,
  ]);

  const nextRequestIdRef = React.useRef(0);

  const generateResponse = React.useCallback(
    async (
      prompt: string,
      onPartial?: (partial: string, requestId: number | undefined) => void,
      onError?: (message: string, requestId: number | undefined) => void,
      abortSignal?: AbortSignal,
    ): Promise<string> => {
      if (modelHandle === undefined) {
        throw new Error("Model handle is not defined");
      }
      const requestId = nextRequestIdRef.current++;

      const partialSubscription = eventEmitter.addListener(
        "onPartialResponse",
        (ev: { handle: number; requestId: number; response: string }) => {
          if (
            onPartial &&
            requestId === ev.requestId &&
            ev.handle === modelHandle &&
            !(abortSignal?.aborted ?? false)
          ) {
            onPartial(ev.response, ev.requestId);
          }
        },
      );

      const errorSubscription = eventEmitter.addListener(
        "onErrorResponse",
        (ev: { handle: number; requestId: number; error: string }) => {
          if (
            onError &&
            requestId === ev.requestId &&
            ev.handle === modelHandle &&
            !(abortSignal?.aborted ?? false)
          ) {
            onError(ev.error, ev.requestId);
          }
        },
      );

      try {
        // Using the callback-based API
        return await module.generateResponse(modelHandle, requestId, prompt);
      } catch (e) {
        console.error("Generate response error:", e);
        throw e;
      } finally {
        partialSubscription.remove();
        errorSubscription.remove();
      }
    },
    [modelHandle],
  );

  // Emits text as it's generated
  const generateStreamingResponse = React.useCallback(
    async (
      prompt: string,
      onPartial?: (partial: string, requestId: number) => void,
      onError?: (message: string, requestId: number) => void,
      abortSignal?: AbortSignal,
    ): Promise<void> => {
      if (modelHandle === undefined) {
        throw new Error("Model handle is not defined");
      }

      try {
        await generateStreamingText(
          modelHandle,
          prompt,
          onPartial,
          onError,
          abortSignal,
        );
      } catch (e) {
        console.error("Streaming generation error:", e);
        throw e;
      }
    },
    [modelHandle],
  );

  return React.useMemo(
    () => ({
      generateResponse,
      generateStreamingResponse,
      isLoaded: modelHandle !== undefined,
    }),
    [generateResponse, generateStreamingResponse, modelHandle],
  );
}

/**
 * Generate a streaming text response from the LLM
 */
export function generateStreamingText(
  modelHandle: number,
  prompt: string,
  onPartialResponse?: (text: string, requestId: number) => void,
  onError?: (error: string, requestId: number) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!modelHandle) {
      reject(new Error("Invalid model handle"));
      return;
    }

    const requestId = Math.floor(Math.random() * 100000);
    let fullResponse = "";

    // Set up event listeners for streaming response
    const partialSubscription = eventEmitter.addListener(
      "onPartialResponse",
      (ev: { handle: number; requestId: number; response: string }) => {
        if (
          ev.handle === modelHandle &&
          ev.requestId === requestId &&
          !(abortSignal?.aborted ?? false)
        ) {
          // Call the partial response callback with each chunk
          if (onPartialResponse) {
            onPartialResponse(ev.response, ev.requestId);
          }

          // Build the full response
          fullResponse += ev.response;
        }
      },
    );

    const errorSubscription = eventEmitter.addListener(
      "onErrorResponse",
      (ev: { handle: number; requestId: number; error: string }) => {
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

    // Call the native function to start generation
    module
      .generateResponseAsync(modelHandle, requestId, prompt)
      .then(() => {
        // When complete, clean up listeners and resolve with full response
        errorSubscription.remove();
        partialSubscription.remove();
        resolve();
      })
      .catch((error) => {
        // Clean up listeners on error
        errorSubscription.remove();
        partialSubscription.remove();
        reject(error);
      });
  });
}

export default module;
export { eventEmitter };
