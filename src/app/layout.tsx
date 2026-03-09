import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import SessionProvider from '@/components/auth/ClientSessionProvider';
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${outfit.className} dark:bg-gray-900`}>
        <SessionProvider>
          <ThemeProvider>
            <SidebarProvider>{children}</SidebarProvider>
            <Toaster position="bottom-right" reverseOrder={false} />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
