# Expo LLM MediaPipe

A powerful and efficient library for running on-device LLM (Large Language Model) inference in Expo applications using Google's MediaPipe LLM Task API.

## Overview

Expo LLM MediaPipe enables Expo/React Native developers to integrate on-device AI capabilities into their applications without requiring cloud services. By leveraging Google's MediaPipe framework, this package brings Gemma and other LLM models directly to your mobile application.

## Features

- Run LLM inference directly on-device without an internet connection
- Support for Gemma 2B/3B models with quantized int4/int8 variants
- Streaming token generation for responsive UI
- Custom prompt engineering
- Built specifically for Expo's development ecosystem
- Simple API with React hooks for easy integration

## Installation

```sh
npx expo install expo-llm-mediapipe
```

## Setup

### Required Configuration

1. Add the plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-llm-mediapipe"
    ]
  }
}
```

2. Create a development build of your Expo app that includes the native module:

```sh
npx expo prebuild
```

3. Add LLM model files to your project:

#### Android

Place your .tflite model files in the `android/app/src/main/assets/` directory.

#### iOS

Add the model files to your Xcode project by dragging them into the Resources group.

### Automatic Configuration (v0.3+)

Starting from version 0.2.0, expo-llm-mediapipe includes an Expo Config Plugin that automatically configures your Android project with:

1. The required OpenCL native library references in AndroidManifest.xml
2. Increased Gradle memory settings for handling large LLM models

These settings will be applied automatically when you run npx expo prebuild as long as you've added the plugin to your app.json.

### Recommended Models

For optimal performance, we recommend using quantized versions of Gemma models:

- gemma-2b-it-int4.task (smallest, fastest)
- gemma-2b-it-int8.task (balanced)
- gemma-3b-it-int4.task (more capabilities, slightly larger)

You can download these models from [Google's MediaPipe page](https://developers.google.com/mediapipe/solutions/text/llm_inference/knowledgebase#supported-models).

## Usage

### Basic Usage

```typescript
import React, { useState } from 'react';
import { View, Button, TextInput, Text } from 'react-native';
import ExpoLlmMediapipe, { useLlmInference } from 'expo-llm-mediapipe';

export default function App() {
  const [prompt, setPrompt] = useState('Tell me a short story about robots learning to feel emotions.');
  const [response, setResponse] = useState('');
  const [generating, setGenerating] = useState(false);

  // Initialize the LLM with the model from your assets directory
  const llm = useLlmInference({
    storageType: 'asset',
    modelName: 'gemma-2b-it-int4.task', // The filename in your assets folder
    maxTokens: 1024,
    temperature: 0.7,
    topK: 40,
    randomSeed: 42
  });

  // Generate a complete response (wait until finished)
  const handleGenerateComplete = async () => {
    if (!llm.isLoaded) return;
    
    setGenerating(true);
    setResponse('');
    
    try {
      const result = await llm.generateResponse(prompt);
      setResponse(result);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setGenerating(false);
    }
  };
  
  // Stream the response as it's generated
  const handleGenerateStream = async () => {
    if (!llm.isLoaded) return;
    
    setGenerating(true);
    setResponse('');
    
    try {
      await llm.generateStreamingResponse(
        prompt,
        (partial) => {
          setResponse(current => current + partial);
        },
        (error) => {
          console.error('Stream error:', error);
        }
      );
    } catch (error) {
      console.error('Error streaming response:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>LLM Demo</Text>
      
      <Text>Model Status: {llm.isLoaded ? "✅ Loaded" : "❌ Not Loaded"}</Text>
      
      <TextInput
        style={{ borderWidth: 1, padding: 10, marginVertical: 15, height: 120 }}
        value={prompt}
        onChangeText={setPrompt}
        multiline
        placeholder="Enter your prompt"
      />
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button 
          title={generating ? "Generating..." : "Generate"} 
          onPress={handleGenerateComplete}
          disabled={generating || !llm.isLoaded}
        />
        <Button 
          title="Stream Response" 
          onPress={handleGenerateStream}
          disabled={generating || !llm.isLoaded}
        />
      </View>
      
      <Text style={{ fontWeight: 'bold', marginTop: 20 }}>Response:</Text>
      <Text>{response}</Text>
    </View>
  );
}
```

### Advanced Usage

#### Loading from file path instead of assets

If you need to download or generate model files dynamically:

```typescript
const llm = useLlmInference({
  storageType: 'file',
  modelPath: '/path/to/model/on/device.task',
  maxTokens: 1024,
  temperature: 0.7,
  topK: 40,
  randomSeed: 42
});
```

#### Controlling generation settings

Adjust the output by changing these parameters:

```typescript
const llm = useLlmInference({
  storageType: 'asset',
  modelName: 'gemma-2b-it-int4.task',
  // Controls maximum response length
  maxTokens: 2048,
  // Higher temperature (0-1) means more creative/random responses
  temperature: 0.9,
  // Top-K filtering focuses generation on more probable tokens
  topK: 40,
  // Set a fixed seed for reproducible results
  randomSeed: 0
});
```

#### Manual Model Management

For more control over the model lifecycle:

```typescript
import ExpoLlmMediapipe from 'expo-llm-mediapipe';

// Create model
const handleCreateModel = async () => {
  try {
    const handle = await ExpoLlmMediapipe.createModelFromAsset(
      'gemma-2b-it-int4.task',
      1024,  // maxTokens
      40,    // topK
      0.7,   // temperature
      42     // randomSeed
    );
    console.log(`Model created with handle: ${handle}`);
    return handle;
  } catch (error) {
    console.error('Failed to create model:', error);
  }
};

// Generate response
const handleGenerate = async (modelHandle, prompt) => {
  try {
    const requestId = Math.floor(Math.random() * 100000);
    const response = await ExpoLlmMediapipe.generateResponse(
      modelHandle,
      requestId,
      prompt
    );
    return response;
  } catch (error) {
    console.error('Failed to generate response:', error);
  }
};

// Release model when done to free memory
const handleReleaseModel = async (modelHandle) => {
  try {
    const success = await ExpoLlmMediapipe.releaseModel(modelHandle);
    console.log(`Model released: ${success}`);
  } catch (error) {
    console.error('Failed to release model:', error);
  }
};
```

## API Reference

### Module Functions

#### `createModel(modelPath, maxTokens, topK, temperature, randomSeed)`

Creates a model from a file path.

#### `createModelFromAsset(modelName, maxTokens, topK, temperature, randomSeed)`

Creates a model from an asset bundled with the app.

#### `releaseModel(handle)`

Releases model resources when no longer needed.

#### `generateResponse(handle, requestId, prompt)`

Generates a complete text response.

#### `generateResponseAsync(handle, requestId, prompt)`

Generates a response with streaming capability through events.

### Hooks

#### `useLlmInference(config)`

React hook that manages the model lifecycle and provides methods for text generation.

- **Config parameters**:
  - `storageType`: 'asset' | 'file'
  - `modelName`: (for 'asset' type) Name of the model file in assets directory
  - `modelPath`: (for 'file' type) Full path to the model file
  - `maxTokens`: Maximum number of tokens to generate
  - `temperature`: Controls randomness (0.0-1.0)
  - `topK`: Controls diversity
  - `randomSeed`: Seed for reproducible generation

- **Returns**:
  - `isLoaded`: Boolean indicating if the model is loaded and ready
  - `generateResponse`: Function to generate a complete response
  - `generateStreamingResponse`: Function to generate a streaming response

### Events

The module emits the following events:

- `onPartialResponse`: Emitted when a partial response is generated during streaming
- `onErrorResponse`: Emitted when an error occurs during generation
- `logging`: Internal debug logs

## Performance Considerations

- Model loading may take a few seconds, especially for larger models
- First inference is typically slower (JIT compilation)
- Memory usage varies by model size (200-500MB for quantized models)
- Battery impact is significant during generation, optimize accordingly

## Troubleshooting

### Common Issues

1. **Model Not Loading**
   - Ensure the model file exists in the correct location
   - Check that file permissions allow reading the model
   - Verify the model format is compatible (should be .task format)

2. **Slow Performance**
   - Use smaller quantized models for better speed
   - Reduce the `maxTokens` parameter for quicker responses
   - Consider using streaming responses for better user experience

3. **Memory Issues**
   - Always release models when not in use
   - Avoid loading multiple models simultaneously
   - Use int4 quantized models instead of int8 or float models

4. **Build Errors**
   - Ensure you're using a development build with `npx expo prebuild`
   - Check that MediaPipe dependencies are properly installed

## Running Locally

To run the example project locally:

1. Clone the repository:

```sh
git clone https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe.git
cd expo-llm-mediapipe
```

2. Install dependencies:

```sh
npm install
cd example
npm install
```

3. Download a supported model (e.g., gemma-2b-it-int4.task) and place it in:
   - Android: assets
   - iOS: Add to the Xcode project resources

4. Run the development build:

```sh
# For Android
npm run android

# For iOS
npm run ios
```

## Contributing

Contributions are welcome! Here's how you can help improve this library:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add some amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Create a Pull Request

### Development Setup

1. Install dependencies:

```sh
npm install
```

2. Make changes to the source code in the src directory

3. Build the module:

```sh
npm run build
```

4. Test your changes in the example app:

```sh
cd example
npm run android  # or npm run ios
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google MediaPipe team for the underlying LLM inference API
- Expo team for the module system and tooling
- Contributors to the Gemma open model

## Contact

For questions, support, or collaboration:

- GitHub Issues: [https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/issues](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/issues)
- Twitter: [@tirthajyoti_g](https://twitter.com/tirthajyoti_g)
- Email: <itirthahere@gmail.com>
