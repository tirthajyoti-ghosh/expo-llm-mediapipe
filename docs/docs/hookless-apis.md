---
id: hookless-apis
title: Hookless APIs
---

The hookless APIs provide more granular control over the model lifecycle and inference process. These APIs are ideal for developers who need to manage models manually or integrate them into non-React workflows.

## Model Creation and Management

### **`createModel`**

Creates a model from a file path.

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
  1024,  // maxTokens
  40,    // topK
  0.7,   // temperature
  42     // randomSeed
);
```

---

### **`createModelFromAsset`**

Creates a model from an asset bundled with the application.

##### **Parameters**

- `modelName`: Name of the model asset.
- `maxTokens`: Maximum tokens in the response.
- `topK`: Limits diversity in responses.
- `temperature`: Controls randomness in responses.
- `randomSeed`: For reproducible outputs.

##### **Example**

```tsx
const modelHandle = await ExpoLlmMediapipe.createModelFromAsset(
  'gemma-1.1-2b-it-cpu-int4.bin',  // modelName
  1024,  // maxTokens
  40,    // topK
  0.7,   // temperature
  42     // randomSeed
);
```

---

### **`createModelFromDownloaded`**

Creates a model from a previously downloaded file.

##### **Parameters**

- `modelName`: Name of the downloaded model.
- `maxTokens`: Maximum tokens in the response (optional).
- `topK`: Limits diversity in responses (optional).
- `temperature`: Controls randomness in responses (optional).
- `randomSeed`: For reproducible outputs (optional).

##### **Example**

```tsx
const modelHandle = await ExpoLlmMediapipe.createModelFromDownloaded(
  'gemma-1.1-2b-it-cpu-int4.bin',  // modelName
  1024,  // maxTokens
  40,    // topK
  0.7,   // temperature
  42     // randomSeed
);
```

---

### **`releaseModel`**

Releases a model to free resources.

##### **Parameters**

- `handle`: Handle to the model.

##### **Example**

```tsx
await ExpoLlmMediapipe.releaseModel(modelHandle);
```

---

## Inference

### **`generateResponse`**

Generates a complete response for a given prompt.

##### **Parameters**

- `handle`: Handle to the model.
- `requestId`: Unique identifier for the request.
- `prompt`: The input prompt for the model.

##### **Example**

```tsx
const response = await ExpoLlmMediapipe.generateResponse(
  modelHandle, 
  1,  // requestId
  'What is AI?'
);
console.log(response);
```

---

### **`generateResponseAsync`**

Generates a streaming response for a given prompt. Results are delivered through event listeners.

##### **Parameters**

- `handle`: Handle to the model.
- `requestId`: Unique identifier for the request.
- `prompt`: The input prompt for the model.

##### **Example**

```tsx
// Set up listener for partial responses first (see Event Listeners section)
const subscription = ExpoLlmMediapipe.addListener('onPartialResponse', (event) => {
  console.log(`Partial response: ${event.response}`);
});

// Then generate response asynchronously
await ExpoLlmMediapipe.generateResponseAsync(
  modelHandle,
  1,  // requestId
  'Explain machine learning.'
);

// Don't forget to remove the listener when done
subscription.remove();
```

---

## Model Download Management

### **`downloadModel`**

Downloads a model from a given URL.

##### **Parameters**

- `url`: URL of the model file.
- `modelName`: Name of the model.
- `options`: Additional options (optional):
  - `overwrite`: Whether to overwrite existing model (boolean).
  - `timeout`: Download timeout in milliseconds (number).
  - `headers`: HTTP headers for the request (`Record<string, string>`).

##### **Example**

```tsx
await ExpoLlmMediapipe.downloadModel(
  'https://huggingface.co/t-ghosh/gemma-tflite/resolve/main/gemma-1.1-2b-it-int4.bin',
  'gemma-1.1-2b-it-int4.bin',
  { 
    overwrite: true,
    timeout: 60000,
    headers: { 'Authorization': 'Bearer token' }
  }
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

## Event Listeners

### **`addListener`**

Adds a listener for a specific event.

##### **Parameters**

- `eventName`: Name of the event to listen for.
- `listener`: Callback function to execute when the event occurs.

##### **Returns**

- `NativeModuleSubscription`: Subscription object with a `remove()` method.

##### **Available Events**

1. **`onPartialResponse`**: Fired when a partial response is generated.
   - `handle`: Model handle.
   - `requestId`: Request identifier.
   - `response`: Partial text response.

2. **`onErrorResponse`**: Fired when an error occurs during response generation.
   - `handle`: Model handle.
   - `requestId`: Request identifier.
   - `error`: Error message.

3. **`downloadProgress`**: Fired during model download.
   - `modelName`: Name of the model.
   - `url`: Download URL (optional).
   - `bytesDownloaded`: Amount downloaded in bytes (optional).
   - `totalBytes`: Total size in bytes (optional).
   - `progress`: Download progress from 0 to 1 (optional).
   - `status`: Status of download ('downloading', 'completed', 'error', 'cancelled').
   - `error`: Error message if status is 'error' (optional).

4. **`logging`**: Fired when the native module logs a message.
   - `handle`: Model handle.
   - `message`: Log message.

5. **`onChange`**: Fired when a value changes.
   - `value`: The new value.

##### **Example**

```tsx
// Listen for partial responses
const partialResponseSubscription = ExpoLlmMediapipe.addListener(
  'onPartialResponse', 
  (event) => {
    console.log(`Model ${event.handle}, Request ${event.requestId}: ${event.response}`);
  }
);

// Listen for error responses
const errorResponseSubscription = ExpoLlmMediapipe.addListener(
  'onErrorResponse', 
  (event) => {
    console.error(`Error from model ${event.handle}, Request ${event.requestId}: ${event.error}`);
  }
);

// Listen for download progress
const downloadProgressSubscription = ExpoLlmMediapipe.addListener(
  'downloadProgress', 
  (event) => {
    if (event.status === 'downloading' && event.progress !== undefined) {
      console.log(`Downloading ${event.modelName}: ${Math.round(event.progress * 100)}%`);
      console.log(`Downloaded ${event.bytesDownloaded} of ${event.totalBytes} bytes`);
    } else if (event.status === 'completed') {
      console.log(`Download of ${event.modelName} completed`);
    } else if (event.status === 'error') {
      console.error(`Download error: ${event.error}`);
    } else if (event.status === 'cancelled') {
      console.log(`Download of ${event.modelName} was cancelled`);
    }
  }
);

// Listen for logging messages
const loggingSubscription = ExpoLlmMediapipe.addListener(
  'logging', 
  (event) => {
    console.log(`Log from model ${event.handle}: ${event.message}`);
  }
);

// Listen for value changes
const onChangeSubscription = ExpoLlmMediapipe.addListener(
  'onChange', 
  (event) => {
    console.log(`Value changed: ${event.value}`);
  }
);

// Clean up listeners when they're no longer needed
partialResponseSubscription.remove();
errorResponseSubscription.remove();
downloadProgressSubscription.remove();
loggingSubscription.remove();
onChangeSubscription.remove();
```

---

### **`removeAllListeners`**

Removes all listeners for a specific event.

##### **Parameters**

- `event`: Name of the event to remove listeners for.

##### **Example**

```tsx
ExpoLlmMediapipe.removeAllListeners('downloadProgress');
```

---

## Complete Examples

Refer to these example implementations for practical usage:
- [Model loading from assets](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/blob/main/example/src/screens/HooklessAssetDemoScreen.tsx)
- [Model download and inference](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/blob/main/example/src/screens/HooklessDownloadableDemoScreen.tsx)
- [Model utility functions](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/blob/main/example/src/screens/HooklessUtilityDemoScreen.tsx)