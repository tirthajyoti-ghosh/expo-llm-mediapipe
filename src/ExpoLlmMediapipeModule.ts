import { EventEmitter, requireNativeModule } from "expo-modules-core";
import * as React from "react";

import type { ExpoLlmMediapipeModuleEvents } from "./ExpoLlmMediapipe.types";

// Import the Native Module
const module = requireNativeModule("ExpoLlmMediapipe");

// Create an event emitter for handling module events
const eventEmitter = new EventEmitter<ExpoLlmMediapipeModuleEvents>(module ?? {});

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

  return React.useMemo(
    () => ({ generateResponse, isLoaded: modelHandle !== undefined }),
    [generateResponse, modelHandle],
  );
}

export default module;
export { eventEmitter };
