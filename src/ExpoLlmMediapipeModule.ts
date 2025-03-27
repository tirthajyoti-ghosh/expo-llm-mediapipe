import { NativeModule, requireNativeModule } from 'expo';

import { ExpoLlmMediapipeModuleEvents } from './ExpoLlmMediapipe.types';

declare class ExpoLlmMediapipeModule extends NativeModule<ExpoLlmMediapipeModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoLlmMediapipeModule>('ExpoLlmMediapipe');
