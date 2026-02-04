const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

// 保持窗口对象的全局引用
let mainWindow = null;  // ← 使用 let 而不是 const

function createWindow() {
  // 根据平台选择图标
  let iconPath;
  if (process.platform === 'darwin') {
    iconPath = isDev
      ? path.join(__dirname, '../public/icons/mac/icon.icns')
      : path.join(__dirname, '../dist/icons/mac/icon.icns');
  } else {
    iconPath = isDev
      ? path.join(__dirname, '../public/icons/win/icon.ico')
      : path.join(__dirname, '../dist/icons/win/icon.ico');
  }

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    title: 'OptiMix - 最优配比计算器',
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    show: false  // 先隐藏，准备好后再显示
  });

  // 窗口准备好后显示（避免白屏闪烁）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 加载应用
  if (isDev) {
    console.log('开发模式：加载 http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    console.log('生产模式：加载本地文件');
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 移除默认菜单栏
  Menu.setApplicationMenu(null);

  // 错误处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription);
  });

  // 窗口关闭时释放引用
  mainWindow.on('closed', () => {
    mainWindow = null;  // ← 正确的做法
  });
}

// 应用就绪时创建窗口
app.whenReady().then(() => {
  console.log('Electron 应用就绪');
  createWindow();

  // macOS 特性：点击 Dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在应用退出前清理
app.on('before-quit', () => {
  console.log('应用即将退出');
});

// 禁用硬件加速（可选，解决某些显卡问题）
// app.disableHardwareAcceleration();
