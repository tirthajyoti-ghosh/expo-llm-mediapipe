import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoLlmMediapipeViewProps } from './ExpoLlmMediapipe.types';

const NativeView: React.ComponentType<ExpoLlmMediapipeViewProps> =
  requireNativeView('ExpoLlmMediapipe');

export default function ExpoLlmMediapipeView(props: ExpoLlmMediapipeViewProps) {
  return <NativeView {...props} />;
}
