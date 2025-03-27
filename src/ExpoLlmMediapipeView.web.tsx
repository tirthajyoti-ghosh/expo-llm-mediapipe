import * as React from 'react';

import { ExpoLlmMediapipeViewProps } from './ExpoLlmMediapipe.types';

export default function ExpoLlmMediapipeView(props: ExpoLlmMediapipeViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
