import { Platform, StyleSheet } from "react-native";

const markdownStyles = {
  body: {
    fontFamily: Platform.OS === "ios" ? "Verdana" : "monospace",
  },
  link: {
    color: "#0066cc",
    textDecorationLine: "underline",
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    marginBottom: 15,
  },
  modelStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  promptContainer: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    backgroundColor: "#fff",
    fontSize: 16,
    marginBottom: 15,
  },
  generateButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  responseContainer: {
    backgroundColor: "#f0f7ff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#cce0ff",
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#0055cc",
  },
  responseScroll: {
    maxHeight: 350,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  logsContainer: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  logScroll: {
    maxHeight: 250,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noLogs: {
    fontStyle: "italic",
    color: "#888",
  },
  logEntry: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // Chat screen styles
  chatSafeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 10,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 18,
    maxWidth: "80%",
    marginVertical: 5,
  },
  userBubble: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
    marginLeft: "20%",
    borderTopRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    marginRight: "20%",
    borderTopLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
    backgroundColor: "#fff",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: 10,
    marginTop: 5,
  },
  typingDots: {
    marginLeft: 5,
  },
  noModelContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noModelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  noModelText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },

  // Download screen styles
  modelList: {
    paddingBottom: 20,
  },
  modelCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  modelName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    flex: 1,
  },
  modelDescription: {
    color: "#666",
    marginBottom: 10,
  },
  modelSize: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  modelStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modelStatusLabel: {
    color: "#666",
  },
  modelStatusValue: {
    fontWeight: "bold",
  },
  statusDownloaded: {
    color: "green",
  },
  statusDownloading: {
    color: "blue",
  },
  statusError: {
    color: "red",
  },
  statusNotDownloaded: {
    color: "#666",
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    marginVertical: 8,
  },
  progressText: {
    textAlign: "right",
    fontSize: 12,
    color: "#666",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    fontSize: 12,
  },
  modelActions: {
    marginTop: 10,
  },
  downloadedActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0066cc",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },
  loadButton: {
    backgroundColor: "#4CAF50",
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#FF9800",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 5,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    marginTop: 10,
    color: "#888",
    fontSize: 16,
  },
  loadedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  loadedBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  orText: {
    marginVertical: 10,
    color: "#666",
  },
  downloadPrompt: {
    color: "#0066cc",
    marginBottom: 10,
  },
});

export { styles, markdownStyles };
