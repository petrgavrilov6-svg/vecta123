import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VECTA Admin',
  description: 'Платформенная административная панель VECTA CRM для управления пользователями, workspace и аудитом системы',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}


