import { useState, useEffect, useMemo } from 'react';
import { theme, ThemeConfig } from 'antd';

export function useThemeMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('buyo_theme_mode');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('buyo_theme_mode', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {
      console.error('Failed to save theme to localStorage:', e);
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const themeConfig: ThemeConfig = useMemo(() => {
    return {
      algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: '#2563eb',
        colorBgBase: isDarkMode ? '#0b1120' : '#f8fafc',
        colorBgContainer: isDarkMode ? '#131e36' : '#ffffff',
        colorBorder: isDarkMode ? '#223254' : '#e2e8f0',
        colorTextBase: isDarkMode ? '#f8fafc' : '#0f172a',
        colorTextSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        borderRadius: 12,
        fontFamily: "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
      components: {
        Card: {
          colorBgContainer: isDarkMode ? '#111927' : '#ffffff',
          colorBorderSecondary: isDarkMode ? '#1e293b' : '#f1f5f9',
        },
        Select: {
          colorBgContainer: isDarkMode ? '#0f172a' : '#ffffff',
          colorBorder: isDarkMode ? '#334155' : '#cbd5e1',
        },
      },
    };
  }, [isDarkMode]);

  return {
    isDarkMode,
    setIsDarkMode,
    toggleTheme,
    themeConfig,
  };
}
