---
id: hookless-apis
title: Hookless APIs
---

The hookless APIs provide more granular control over the model lifecycle and inference process. These APIs are ideal for developers who need to manage models manually or integrate them into non-React workflows.

### **`createModel`**

Creates a model from an asset or file.

##### **Parameters**

- `modelPath`: Path to the model file.
- `maxTokens`: Maximum tokens in the response.
- `topK`: Limits diversity in responses.
- `temperature`: Controls randomness in responses.
- `randomSeed`: For reproducible outputs.

##### **Example**

```tsx
const modelHandle = await ExpoLlmMediapipe.createModel(
  '/path/to/model',
  1024,
  40,
  0.7,
  42
);
```

---

### **`releaseModel`**

Releases a model to free resources.

##### **Parameters**

- `modelHandle`: Handle to the model.

##### **Example**

```tsx
await ExpoLlmMediapipe.releaseModel(modelHandle);
```

---

### **`generateResponse`**

Generates a complete response for a given prompt.

##### **Parameters**

- `modelHandle`: Handle to the model.
- `requestId`: Unique identifier for the request.
- `prompt`: The input prompt for the model.

##### **Example**

```tsx
const response = await ExpoLlmMediapipe.generateResponse(modelHandle, 1, 'What is AI?');
console.log(response);
```

---

### **`generateResponseAsync`**

Generates a streaming response for a given prompt.

##### **Parameters**

- `modelHandle`: Handle to the model.
- `requestId`: Unique identifier for the request.
- `prompt`: The input prompt for the model.

##### **Example**

```tsx
await ExpoLlmMediapipe.generateResponseAsync(modelHandle, 1, 'Explain machine learning.');
```

---

### **`downloadModel`**

Downloads a model from a given URL.

##### **Parameters**

- `url`: URL of the model file.
- `modelName`: Name of the model.
- `options`: Additional options (e.g., `overwrite`, `timeout`).

##### **Example**

```tsx
await ExpoLlmMediapipe.downloadModel(
  'https://huggingface.co/t-ghosh/gemma-tflite/resolve/main/gemma-1.1-2b-it-int4.bin',
  'gemma-1.1-2b-it-int4.bin',
  { overwrite: true }
);
```

---

### **`cancelDownload`**

Cancels an ongoing model download.

##### **Parameters**

- `modelName`: Name of the model.

##### **Example**

```tsx
await ExpoLlmMediapipe.cancelDownload('gemma-1.1-2b-it-int4.bin');
```

---

### **`isModelDownloaded`**

Checks if a model is already downloaded.

##### **Parameters**

- `modelName`: Name of the model.

##### **Example**

```tsx
const isDownloaded = await ExpoLlmMediapipe.isModelDownloaded('gemma-1.1-2b-it-int4.bin');
console.log(isDownloaded ? 'Model is downloaded' : 'Model is not downloaded');
```

---

### **`getDownloadedModels`**

Retrieves a list of all downloaded models.

##### **Example**

```tsx
const models = await ExpoLlmMediapipe.getDownloadedModels();
console.log('Downloaded models:', models);
```

---

### **`deleteDownloadedModel`**

Deletes a downloaded model.

##### **Parameters**

- `modelName`: Name of the model.

##### **Example**

```tsx
await ExpoLlmMediapipe.deleteDownloadedModel('gemma-1.1-2b-it-int4.bin');
```

---

### **Examples**

Refer to these example usages for practical implementations:
- [Model loading from assets](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/blob/main/example/src/screens/HooklessAssetDemoScreen.tsx)
- [Model download and inference](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/blob/main/example/src/screens/HooklessDownloadableDemoScreen.tsx)
- [Model utility functions](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/blob/main/example/src/screens/HooklessUtilityDemoScreen.tsx)