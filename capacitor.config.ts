import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jvxie.optimix',
  appName: 'OptiMix',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,  // 发布时设为 false
    backgroundColor: '#1e293b', // 深色模式背景色，与你的 app 一致
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1f2937',
      showSpinner: false
    },
    StatusBar: {
      overlaysWebView: true,  // 关键：让 WebView 延伸到状态栏下方
      style: 'LIGHT',         // 状态栏图标颜色：LIGHT = 白色图标，DARK = 黑色图标
      backgroundColor: '#00000000'  // 透明背景
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
