# Expo LLM MediaPipe

<div align="center">
  <img src="https://img.shields.io/npm/v/expo-llm-mediapipe.svg?style=flat-square" alt="npm version">
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue.svg?style=flat-square" alt="Platform support">
  <img src="https://img.shields.io/badge/Expo-SDK%2050%2B-blue.svg?style=flat-square" alt="Expo SDK">
  <img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="License">
</div>

<p align="center">
  <b>Run powerful LLMs directly on mobile devices with no server required</b>
</p>

<p align="center">
  <img src="./assets/expo-llm-mediapipe.png" width="250" alt="MediaPipe LLM">
</p>

A powerful and efficient library for running on-device LLM (Large Language Model) inference in Expo applications using Google's MediaPipe LLM Task API.

---

## ✨ Features

- 📱 **On-Device Intelligence** - Run LLM inference directly on-device, no internet connection required
- 🧠 **Powerful Models** - Support for Gemma 2B models with optimized quantization (int4/int8)
- 🌉 **Cross-Platform** - Works seamlessly on both iOS and Android
- 🌊 **Streaming Generation** - Get token-by-token output for responsive UI experiences
- 💬 **Prompt Engineering** - Format inputs optimally for better model responses
- 📦 **Expo Integration** - Built specifically for the Expo ecosystem
- 🪝 **React Hooks** - Easy integration with simple, declarative APIs

---

## 📦 Installation

```sh
npx expo install expo-llm-mediapipe
```

## 🛠 Setup

### Required Configuration

1️⃣ **Add the plugin to your `app.json`**:

```json
{
  "expo": {
    "plugins": [
      "expo-llm-mediapipe"
    ]
  }
}
```

2️⃣ **Create a development build** of your Expo app:

```sh
npx expo prebuild
```

3️⃣ **Add LLM model files** to your project:

<div style="display: flex; gap: 20px;">

<div>

### Android 🤖

Place your model files in the assets directory:
```
android/app/src/main/assets/
```
- Supports `.bin` and `.task` formats

</div>

<div>

### iOS 🍏

Add models to your Xcode project:

1. Open Xcode project (`xed ios`)
2. Drag model file into the project in the navigator (item with your app name)
3. ✅ Check "Copy items if needed"
4. ✅ Select your app target
5. Click on the project again > Go to Build Phases tab > Verify files appear in "Copy Bundle Resources"

</div>

</div>

---

## 🚀 Recommended Models

For optimal performance on mobile devices:

| Model | Size | Platform | Performance |
|-------|------|----------|-------------|
| `gemma-1.1-2b-it-cpu-int4.bin` | ~1GB | iOS/Android | Most reliable |
| `gemma2-2b-it-cpu-int8.task` | ~3GB | iOS | Best quality |
| `gemma3-1b-it-int4.task` | ~550MB | Android only | Latest (not for iOS) |

⚠️ **Note:** Gemma3-1b models are not yet supported on iOS. Please use Gemma 2B models for cross-platform compatibility.

Download models from [Google's MediaPipe page](https://developers.google.com/mediapipe/solutions/text/llm_inference/knowledgebase#supported-models).

---

## 📱 Example Usage

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

---

## 🧩 Advanced Usage

<details open>
<summary><b>Loading from file path</b></summary>

```tsx
const llm = useLlmInference({
  storageType: 'file',
  modelPath: '/path/to/model/on/device.task',
  maxTokens: 1024,
  temperature: 0.7,
  topK: 40,
  randomSeed: 42
});
```
</details>

<details open>
<summary><b>Fine-tuning generation parameters</b></summary>

```tsx
const llm = useLlmInference({
  // Higher values (0-1) = more creative but potentially less coherent
  temperature: 0.9,
  
  // Higher values = more diverse outputs
  topK: 40,
  
  // Longer responses (be careful with memory usage)
  maxTokens: 2048,
  
  // Fixed seed for reproducible outputs
  randomSeed: 123
});
```
</details>

<details open>
<summary><b>Manual model lifecycle management</b></summary>

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
  prompt
);

// Free resources when done
await ExpoLlmMediapipe.releaseModel(modelHandle);
```
</details>

---

## 📊 Performance Tips

| Tip | Description |
|-----|-------------|
| ⚡ Use int4 quantized models | Smaller size, faster inference |
| 🔢 Limit `maxTokens` | Set only as high as needed |
| 📱 Release when not in use | Call `releaseModel()` to free memory |
| 🌊 Use streaming | Better UX for longer responses |
| 📉 Avoid running multiple models | Can cause memory pressure |

---

## ⚠️ Troubleshooting

<details open>
<summary><b>iOS Model Loading Issues</b></summary>

- Confirm model is in "Copy Bundle Resources" phase
- Gemma3-1b models are not supported on iOS
- Verify both MediaPipeTasksGenAI pods are installed
- Model format must be `.task` or `.bin`
</details>

<details open>
<summary><b>Android Memory Problems</b></summary>

- Check model size is appropriate for target devices
- Enable automatic memory config via the plugin
- Use smaller, quantized models when possible
</details>

<details open>
<summary><b>Build Errors</b></summary>

- Always use `npx expo prebuild` after plugin changes
- Ensure iOS deployment target is 14.0+
- Android minSdkVersion should be 24+
</details>

---

## 📄 API Reference

### `useLlmInference(config)`

React hook that manages the model lifecycle and provides methods for text generation.

```tsx
const llm = useLlmInference({
  storageType: 'asset',     // 'asset' | 'file'
  modelName: 'model.task',  // For 'asset' type
  modelPath: '/path/file',  // For 'file' type
  maxTokens: 1024,          // Maximum response length
  temperature: 0.7,         // Randomness (0-1)
  topK: 40,                 // Diversity control
  randomSeed: 42            // Reproducibility
});

// Properties & methods
llm.isLoaded               // Boolean - model ready status
llm.generateResponse()     // Complete response Promise
llm.generateStreamingResponse() // Token-by-token streaming
```

---

## 🤝 Contributing

Contributions are welcome! See our Contributing Guide for more details.

## 📜 License

This project is licensed under the MIT License.

---

<div align="center">
  <p>
    <a href="https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/issues">Report Bug</a>
    ·
    <a href="https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/issues">Request Feature</a>
  </p>
  
  <p>
    Made with ❤️ by <a href="https://twitter.com/terrific_ghosh">Tirtha G</a>
  </p>
</div>
