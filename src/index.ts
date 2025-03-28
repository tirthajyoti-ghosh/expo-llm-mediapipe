// Reexport the native module. On web, it will be resolved to ExpoLlmMediapipeModule.web.ts
// and on native platforms to ExpoLlmMediapipeModule.ts
export { default } from "./ExpoLlmMediapipeModule";
export * from "./ExpoLlmMediapipe.types";
export {
  eventEmitter,
  useLlmInference,
  type LlmInferenceConfig,
} from "./ExpoLlmMediapipeModule";
