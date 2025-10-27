import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medmate.app',
  appName: 'MedMate',
  webDir: 'dist',
  // Remove server config to use production build directly
  android: {
    allowMixedContent: true
  }
};

export default config;
