import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UseInstallPromptReturn {
    /** 是否可以显示安装按钮 */
    canInstall: boolean;
    /** 是否为 iOS 设备 */
    isIOS: boolean;
    /** 触发安装（Android）或返回 false 表示需要引导（iOS） */
    install: () => Promise<boolean>;
}

/**
 * PWA 安装提示 Hook
 * - 仅在移动端浏览器中可用（排除 Capacitor 原生和 Electron）
 * - Android: 通过 beforeinstallprompt 事件触发安装
 * - iOS: 检测环境，引导用户使用"添加到主屏幕"
 */
export function useInstallPrompt(): UseInstallPromptReturn {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    // 检测是否已安装（standalone 模式）
    const isStandalone =
        typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true);

    // 检测是否为原生平台
    const isNative = Capacitor.isNativePlatform();

    // 检测是否为 Electron
    const isElectron = typeof window !== 'undefined' &&
        (window.navigator.userAgent.toLowerCase().includes('electron') ||
            (window as any).process?.versions?.electron);

    // 检测 iOS
    const isIOS = typeof window !== 'undefined' &&
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // 检测是否为移动端
    const isMobile = typeof window !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    useEffect(() => {
        if (isNative || isElectron || isStandalone) return;

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isNative, isElectron, isStandalone]);

    const canInstall = !isNative && !isElectron && !isStandalone && !isInstalled && isMobile;

    const install = async (): Promise<boolean> => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
            return outcome === 'accepted';
        }
        // iOS 不支持 beforeinstallprompt, 返回 false 表示需要显示引导
        return false;
    };

    return { canInstall, isIOS, install };
}
