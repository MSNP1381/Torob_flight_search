import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

export interface AppFooterProps {
  isDarkMode: boolean;
}

export const AppFooter: React.FC<AppFooterProps> = ({ isDarkMode }) => {
  return (
    <Footer
      className={`border-t py-6 text-center text-xs transition-colors duration-200 ${
        isDarkMode
          ? 'border-slate-800 bg-[#090d16] text-slate-500'
          : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
        <div>
          سامانه تجمیع و مقایسه هوشمند پرواز BuyO • طراحی شده برای وب‌سایت ترب
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          نسخه ۲.۰ • پشتیبانی از پروتکل‌های علی‌بابا، فلای‌تودی و سفرمارکت
        </div>
      </div>
    </Footer>
  );
};
