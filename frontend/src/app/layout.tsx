import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Inter - body text, buttons, labels
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Outfit - display / logo
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Locum Link - Connect. Cover. Care.',
  description: 'Find a Locum within 2 days, without agencies or endless calls.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable}`}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <body
        style={{
          height: '100%',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          background: '#ffffff',
          color: '#0B0F1F',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          id="app-root"
          style={{
            height: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
