---
id: getting-started
title: Getting Started
---

# Getting Started

## What is Expo LLM MediaPipe?

Expo LLM MediaPipe is a package that enables developers to run Large Language Models (LLMs) locally on Android and iOS devices using Google’s MediaPipe API. It provides both **React Hooks** for declarative usage and **Manual APIs** for advanced use cases.

### Key Features

- **On-Device Intelligence**: Run LLM inference directly on the device without relying on external servers.
- **Cross-Platform Support**: Works seamlessly on both Android and iOS.
- **Streaming Generation**: Generate token-by-token responses for responsive UIs.
- **Download Management**: Download, cancel, or delete models on-device.
- **React Hooks**: Simplified APIs for declarative usage.
- **Manual APIs**: Advanced APIs for developers who need more control.

---

## Installation

To install the **Expo LLM MediaPipe** package, follow the steps below. Choose your preferred package manager.

### 1. Install the Package

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npx expo install expo-llm-mediapipe
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm add expo-llm-mediapipe
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn add expo-llm-mediapipe
```

</TabItem>
</Tabs>

### 2. Create a Expo Prebuild

```bash
npx expo prebuild
```

---

## Setup

To use asset-based models, follow these steps:

#### **1. Add the Plugin to `app.json`:**

Update your `app.json` or `app.config.js` file to include the plugin:

```json
{
  "expo": {
    "plugins": [
      "expo-llm-mediapipe"
    ]
  }
}
```

#### **2. Add Model Files to Your Project:**

- **For Android**:  
  Copy your model files (e.g., `.bin` or `.task`) to the `android/app/src/main/assets/` directory.

- **For iOS**:  
  Add your model files to your Xcode project. Ensure the following:
  - "Copy items if needed" is enabled.
  - The files are added to the "Copy Bundle Resources" build phase.

#### **3. Create a Development Build**

Run the following command to create a development build:

```bash
npx expo prebuild
```

---

## Example Usage

Here’s a quick example of how to use the package with an asset-based model:

```tsx
import { useLLM } from 'expo-llm-mediapipe';

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
  console.log(response);
}
```

---

## Good reads

If you want to dive deeper into Google's Mediapipe LLM Inference Task API, we highly encourage you to check out the following resources:

- [LLM Inference Guide](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference).
- [Android Inference Guide](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/android)
- [iOS Inference Guide](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/ios)
