<div align="center">
  <img src="https://img.shields.io/npm/v/expo-llm-mediapipe.svg?style=flat-square" alt="npm version">
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue.svg?style=flat-square" alt="Platform support">
  <img src="https://img.shields.io/badge/Expo-SDK%2050%2B-blue.svg?style=flat-square" alt="Expo SDK">
  <img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="License">
</div>

# Expo LLM MediaPipe

Run on-device intelligence without needing a server, with support for streaming generation and download management of LLM models.

## Features

- On-Device Intelligence – Run LLM inference directly on the device (no internet required)
- Powerful Models – Optimized support for Gemma 2B models with int4/int8 quantization
- Cross-Platform – Works seamlessly on both iOS and Android
- Streaming Generation – Token-by-token output for responsive UIs
- Prompt Engineering – Optimize inputs for better responses
- Download Management – Download, cancel or delete models on-device
- Expo Integration – Specially built for the Expo ecosystem
- React Hooks – Simple, declarative APIs for model lifecycle management

## Installation

```sh
npx expo install expo-llm-mediapipe
```

## Setup

### Configuration

1. Add the plugin to your app.json:

```json
   {
     "expo": {
       "plugins": [
         "expo-llm-mediapipe"
       ]
     }
   }
```

2. Create a development build:

```sh
   npx expo prebuild
```

3. Place your model files in your project resources:

   - For Android, copy model files (formats .bin or .task) to:

     android/app/src/main/assets/

   - For iOS, add your model files to your Xcode project ensuring “Copy items if needed” is enabled and that they are added to “Copy Bundle Resources”.

## API Overview

### Model Lifecycle and Inference

Use the `useLlmInference` React hook to create, use, and release models. Here’s an example:

```tsx
import { useLlmInference } from 'expo-llm-mediapipe';

const llm = useLlmInference({
  storageType: 'asset',        // 'asset' | 'file'
  modelName: 'model.task',     // For 'asset' type – specify the filename of the model
  modelPath: '/path/to/model', // For 'file' type – the location on device
  maxTokens: 1024,             // Maximum number of tokens in the response
  temperature: 0.7,            // Value between 0 and 1 for randomness
  topK: 40,                    // Limits diversity in responses
  randomSeed: 42               // For reproducible outputs
});
```

The hook returns an object with:

- `isLoaded`: Boolean indicating whether the model has been created and is ready.
- `generateResponse(prompt)`: Generates a complete response for the given prompt.
- `generateStreamingResponse(prompt)`: Generates token-by-token output via events.

### Download Model Functionality

The package now provides native functionality for model download management. Alongside the existing inference APIs, the module now supports:

- **Download Model** – Downloads a model from a provided URL. It accepts custom options:
  - **overwrite** (boolean): Replace an existing file.
  - **timeout** (number): Timeout for the request (in milliseconds).
  - **headers** (object): Custom headers for the download request.
- **Event Notifications** – Progress is reported via the “downloadProgress” event. The event payload includes:
  - `modelName`: Name of the model being downloaded.
  - `url`: Download URL.
  - `bytesDownloaded` and `totalBytes`: Current progress information.
  - `progress`: A fraction (0.0 - 1.0) indicating complete progress.
  - `status`: One of “downloading”, “completed”, “error”, or “cancelled”.
  - `error`: An error message if applicable.
- **Cancel Download** – Cancel an in-progress download.
- **Delete Downloaded Model** – Remove a downloaded model file.
- **Get Downloaded Models** – Retrieve a list of downloaded model names.

Example usage for downloading a model:

```tsx
// Using ModelManager (which wraps the native downloadModel method)
import { modelManager } from 'expo-llm-mediapipe';

async function downloadMyModel() {
  try {
    const success = await modelManager.downloadModel('my-model', {
      overwrite: true,
      timeout: 30000,
      headers: { Authorization: 'Bearer YOUR_TOKEN' },
    });
    if (success) {
      console.log('Download completed successfully!');
    }
  } catch (error) {
    console.error('Download error:', error);
  }
}
```

### Manual Model Lifecycle

You can also manage model lifecycle manually if preferred:

```tsx
import ExpoLlmMediapipe from 'expo-llm-mediapipe';

// Create model
const modelHandle = await ExpoLlmMediapipe.createModelFromAsset(
  'gemma-2b-it-int4.task',
  1024,  // maxTokens
  40,    // topK
  0.7,   // temperature
  42     // randomSeed
);

// Generate text
const response = await ExpoLlmMediapipe.generateResponse(
  modelHandle,
  requestId,
  'Your prompt here'
);

// Release model when done
await ExpoLlmMediapipe.releaseModel(modelHandle);
```

## Example Application

Below is a sample React Native component using the hook:

```tsx
import React, { useState } from 'react';
import { View, Button, TextInput, Text, StyleSheet } from 'react-native';
import { useLlmInference } from 'expo-llm-mediapipe';

export default function App() {
  const [prompt, setPrompt] = useState('Tell me a short story about robots learning to feel emotions.');
  const [response, setResponse] = useState('');
  const [generating, setGenerating] = useState(false);

  // Initialize the LLM
  const llm = useLlmInference({
    storageType: 'asset',
    modelName: 'gemma-1.1-2b-it-cpu-int4.bin',
    maxTokens: 1024,
    temperature: 0.7,
    topK: 40,
    randomSeed: 42
  });

  // Generate response with streaming
  const handleGenerateStream = async () => {
    if (!llm.isLoaded) return;
    
    setGenerating(true);
    setResponse('');
    
    try {
      await llm.generateStreamingResponse(
        prompt,
        (partial) => setResponse(current => current + partial),
        (error) => console.error('Error:', error)
      );
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Assistant</Text>
      
      <Text style={styles.status}>
        Model: {llm.isLoaded ? "✅ Ready" : "⏳ Loading..."}
      </Text>
      
      <TextInput
        style={styles.input}
        value={prompt}
        onChangeText={setPrompt}
        multiline
        placeholder="Ask anything..."
      />
      
      <Button 
        title={generating ? "Generating..." : "Generate Response"} 
        onPress={handleGenerateStream}
        disabled={generating || !llm.isLoaded}
      />
      
      <Text style={styles.responseLabel}>Response:</Text>
      <Text style={styles.response}>{response}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  status: { marginBottom: 15 },
  input: { borderWidth: 1, padding: 10, borderRadius: 5, height: 100, marginBottom: 15 },
  responseLabel: { fontWeight: 'bold', marginTop: 20 },
  response: { marginTop: 10, lineHeight: 20 }
});
```

### See [`example`](/example/src/) for more reference implementations.

## Recommended Models

For optimal performance on mobile devices:

| Model | Size | Platform | Performance |
|-------|------|----------|-------------|
| `gemma-1.1-2b-it-cpu-int4.bin` | ~1GB | iOS/Android | Most reliable |
| `gemma2-2b-it-cpu-int8.task` | ~3GB | iOS | Best quality |
| `gemma3-1b-it-int4.task` | ~550MB | Android only | Latest (not for iOS) |

**Note:** Gemma3-1b models are not yet supported on iOS. Please use Gemma 2B models for cross-platform compatibility.

Download models from [Kaggle](https://www.kaggle.com/models?query=gemma).

## Performance Tips

- Use int4 quantized models for a smaller download size and faster inference.
- Limit `maxTokens` to only what is needed for your use case.
- Release model resources when not needed by calling `releaseModel()`.
- Use streaming responses for improved UI responsiveness.
- Avoid managing multiple models simultaneously to reduce memory pressure.

## Troubleshooting

### iOS Model Loading Issues

- Verify the model is added to the “Copy Bundle Resources” phase.
- Use only supported model formats (.task or .bin).
- Check that MediaPipeTasksGenAI pods are correctly installed.

### Android Memory Problems

- Ensure the model size is appropriate for your target devices.
- Use smaller, quantized models when possible.
- Enable automatic memory configuration provided by the plugin.

### Build Errors

- Run `npx expo prebuild` after making any plugin changes.
- Confirm that your iOS deployment target is 14.0+ and Android minSdkVersion is 24+.

## API Reference

### `useLlmInference(config)`

- **Parameters:**
  - `config`: An object conforming to `LlmInferenceConfig` (includes model location, maxTokens, temperature, topK, randomSeed).
- **Returns:**
  - An object with:
    - `isLoaded`: Boolean indicating whether the model is ready.
    - `generateResponse(prompt, ...)`: Function to generate a complete response.
    - `generateStreamingResponse(prompt, ...)`: Function to stream responses token-by-token.

### Manual Model Lifecycle Management

Refer to the example above for methods like:

- `createModelFromAsset`
- `createModel`
- `releaseModel`
- `generateResponse`
- `generateResponseAsync`
- `downloadModel`
- `cancelDownload`
- `deleteDownloadedModel`
- `getDownloadedModels`
- `createModelFromDownloaded`

## Contributing

Contributions are welcome! See our Contributing Guide for more details.

## License

This project is licensed under the MIT License.
