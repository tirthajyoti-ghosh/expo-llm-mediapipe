import { registerWebModule, NativeModule } from 'expo';

import { ExpoLlmMediapipeModuleEvents } from './ExpoLlmMediapipe.types';

class ExpoLlmMediapipeModule extends NativeModule<ExpoLlmMediapipeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoLlmMediapipeModule);
