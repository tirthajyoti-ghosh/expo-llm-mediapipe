import ExpoLlmMediapipe from "expo-llm-mediapipe";
import React, { useState, useRef } from "react";
import {
  ScrollView,
  SafeAreaView,
  View,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import Markdown from "react-native-markdown-display";

import { ModelContext } from "./ModelProvider";
import { markdownStyles, styles } from "./styles";
import useModelEvents from "./useModelEvent";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: number;
}

function ChatScreen() {
  const { modelHandle } = React.useContext(ModelContext);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I am your AI assistant. How can I help you today?",
      sender: "ai",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [generating, setGenerating] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useModelEvents(modelHandle, (partialText) => {
    if (generating) {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage && lastMessage.sender === "ai") {
          lastMessage.text += partialText;
        }
        return updatedMessages;
      });

      // Scroll to bottom after response updates
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  });

  const sendMessage = async () => {
    if (!inputText.trim() || !modelHandle) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // Add AI message placeholder
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "",
      sender: "ai",
      timestamp: Date.now() + 1,
    };

    setMessages((prev) => [...prev, aiMessage]);

    // Scroll to the bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      setGenerating(true);
      const requestId = Math.floor(Math.random() * 10000);

      // Generate streaming response
      await ExpoLlmMediapipe.generateResponseAsync(
        modelHandle,
        requestId,
        userMessage.text,
      );
    } catch (error) {
      console.log("====================================");
      console.log("Error in sendMessage:", error);
      console.log("====================================");
      // Update the AI message with error info
      setMessages((prev) => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage.sender === "ai") {
          lastMessage.text =
            "Sorry, I encountered an error while processing your request.";
        }
        return updated;
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.chatSafeArea}>
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === "user" ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Markdown style={markdownStyles}>
                {message.text ||
                  (message.sender === "ai" && generating ? "Thinking..." : "")}
              </Markdown>
            </View>
          ))}
          {generating && (
            <View style={styles.typingIndicator}>
              <Text>AI is typing</Text>
              <ActivityIndicator
                size="small"
                color="#4CAF50"
                style={styles.typingDots}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
            editable={!generating}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || generating || !modelHandle) &&
                styles.disabledButton,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || generating || !modelHandle}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ChatScreen;
