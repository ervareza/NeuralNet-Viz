import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Neural Network Simulator',
  description: 'Deep Learning visualization interface',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-slate-950 text-slate-200 antialiased font-sans overflow-hidden" suppressHydrationWarning>{children}</body>
    </html>
  );
}
