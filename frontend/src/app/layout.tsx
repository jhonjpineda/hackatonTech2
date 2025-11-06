import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google';
// import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito-sans',
  display: 'swap',
  weight: ['300', '400', '600', '700'],
});

// TODO: Add Hey August font file to ./fonts/HeyAugust.woff2
// For now, using Nunito Sans as fallback for display font
// const heyAugust = localFont({
//   src: [
//     {
//       path: './fonts/HeyAugust.woff2',
//       weight: '400',
//       style: 'normal',
//     },
//   ],
//   variable: '--font-hey-august',
//   display: 'swap',
//   fallback: ['system-ui', 'sans-serif'],
// });

export const metadata: Metadata = {
  title: 'HackatonTech2 - Plataforma de Hackathones',
  description: 'Sistema de gestión de hackathones TalentoTech',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${nunitoSans.variable} font-sans`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
