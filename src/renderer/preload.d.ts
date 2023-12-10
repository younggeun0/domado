import { ElectronHandler } from '../main/preload';
import { DotEnvHandler } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
    dot_env: DotEnvHandler;
  }
}

export {};
