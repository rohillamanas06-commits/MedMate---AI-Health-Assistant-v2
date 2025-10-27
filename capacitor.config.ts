import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medmate.app',
  appName: 'MedMate',
  webDir: 'dist',
  server: {
    // Use your production API URL
    url: 'https://med-mate-ai-health-assistant-v2.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    // Enable hardware back button
    androidHardwareBack: true
  }
};

export default config;
