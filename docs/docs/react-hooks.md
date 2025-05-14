---
id: react-hooks
title: React Hooks
---

### **`useLLM`**

The `useLLM` hook simplifies model management and inference by abstracting the complexities of model loading, downloading, and response generation.

##### **Parameters**

- `storageType`: `"asset" | "file" | "downloadable"`  
  Specifies the type of model storage.
- `modelName`: Name of the model (for asset or downloadable).
- `modelPath`: Path to the model file (for file-based models).
- `maxTokens`: Maximum tokens in the response.
- `temperature`: Controls randomness in responses.
- `topK`: Limits diversity in responses.
- `randomSeed`: For reproducible outputs.

##### **Return Values**

- `isLoaded`: Boolean indicating whether the model is ready.
- `downloadStatus`: `"not_downloaded" | "downloading" | "downloaded" | "error" | "checking"`. Indicates the download status of the model.
- `downloadProgress`: Progress of the model download (0 to 1).
- `downloadError`: Error message if the download fails.
- `generateResponse`: Function to generate a complete response.
- `generateStreamingResponse`: Function to generate token-by-token responses.
- `downloadModel`: Function to download the model (for downloadable models).
- `loadModel`: Function to load the model into memory.

##### **Examples**

###### **Asset-Based Model**

```tsx
const llm = useLLM({
  storageType: 'asset',
  modelName: 'gemma-1.1-2b-it-cpu-int4.bin',
  maxTokens: 1024,
  temperature: 0.7,
  topK: 40,
  randomSeed: 42,
});

if (llm.isLoaded) {
  const response = await llm.generateResponse('Tell me a story.');
}
```

###### **Downloadable Model**

```tsx
const llm = useLLM({
  storageType: 'downloadable',
  modelName: 'gemma-1.1-2b-it-int4.bin',
  modelUrl: 'https://huggingface.co/t-ghosh/gemma-tflite/resolve/main/gemma-1.1-2b-it-int4.bin',
  maxTokens: 1024,
  temperature: 0.7,
  topK: 40,
  randomSeed: 42,
});

// Download the model
await llm.downloadModel();

// Load the model
await llm.loadModel();

// Generate a response
const response = await llm.generateResponse('What is AI?');
```

###### **Streaming Response**

```tsx
await llm.generateStreamingResponse(
  'Explain the concept of machine learning.',
  (partial) => console.log('Partial response:', partial),
  (error) => console.error('Error:', error)
);
```

---

### **Examples**

Refer to these example usages for practical implementations:

- [Model loading from assets](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/blob/main/example/src/screens/HookAssetDemoScreen.tsx)
- [Model download and inference](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/blob/main/example/src/screens/HookDownloadableDemoScreen.tsx)
