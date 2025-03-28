import type { StyleProp, ViewStyle } from "react-native";

export type OnLoadEventPayload = {
  url: string;
};

export type ExpoLlmMediapipeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
  onPartialResponse: (params: PartialResponseEventPayload) => void;
  onErrorResponse: (params: ErrorResponseEventPayload) => void;
  logging: (params: LoggingEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type PartialResponseEventPayload = {
  handle: number;
  requestId: number;
  response: string;
};

export type ErrorResponseEventPayload = {
  handle: number;
  requestId: number;
  error: string;
};

export type LoggingEventPayload = {
  handle: number;
  message: string;
};

export type ExpoLlmMediapipeViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
