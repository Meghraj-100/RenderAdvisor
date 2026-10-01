import type { Metadata } from 'next';
import './globals.css';
import AuthHeader from '@/components/AuthHeader';

export const metadata: Metadata = {
  title: 'RenderAdvisor | Next.js Rendering Strategy Analyzer',
  description: 'Automated tool to analyze Next.js projects and recommend optimal rendering strategies (SSG, SSR, ISR, CSR) per route based on peer-reviewed research.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className="min-h-screen flex flex-col bg-navy-900 text-gray-100 font-sans antialiased relative overflow-x-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 dot-pattern pointer-events-none opacity-50 z-0"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        
        {/* Main Content */}
        <main className="flex-grow flex flex-col relative z-10 p-4 sm:p-6 lg:p-8">
          <AuthHeader />
          {children}
        </main>
        
        {/* Footer */}
        <footer className="relative z-10 py-6 border-t border-white/10 bg-navy-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-gray-500 font-medium">
              RenderAdvisor &copy; {new Date().getFullYear()} — Next.js Rendering Strategy Decision Engine
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
