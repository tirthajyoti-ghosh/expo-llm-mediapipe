import ExpoLlmMediapipe from "expo-llm-mediapipe";
import { useEffect } from "react";

export default function useModelEvents(
  modelHandle: number | null,
  onPartialResponse?: (text: string) => void,
) {
  useEffect(() => {
    if (!modelHandle) return;

    // Listen for partial responses during generation
    const partialSubscription = ExpoLlmMediapipe.addListener(
      "onPartialResponse",
      (event: { handle: number; requestId: number; response: string }) => {
        if (event.handle === modelHandle && onPartialResponse) {
          onPartialResponse(event.response);
        }
      },
    );

    return () => {
      partialSubscription.remove();
    };
  }, [modelHandle, onPartialResponse]);
}
