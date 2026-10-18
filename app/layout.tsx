import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Talent Lens — Recruitment Analytics Agent',
  description: 'A governed semantic and metric layer proof of concept for recruitment analytics.',
  openGraph: {
    title: 'Talent Lens — Recruitment Analytics Agent',
    description: 'Governed recruitment analytics with three trusted questions.',
    images: [{ url: '/og-ospectra.png', width: 1200, height: 630, alt: 'Talent Lens — Governed recruitment analytics' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talent Lens — Recruitment Analytics Agent',
    description: 'Governed recruitment analytics with three trusted questions.',
    images: ['/og-ospectra.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
