import React from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div
      className="min-h-screen bg-background relative overflow-hidden"
      style={{
        backgroundImage: `url('/image.jpg')`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
      }}
    >
      {/* Blurred overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 0,
        }}
        aria-hidden="true"
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="mr-4 flex">
              <h1 className="font-bold text-xl">Compound Interest Calculator</h1>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container py-6">{children}</main>

        <footer className="border-t">
          <div className="container flex h-14 items-center justify-between text-sm">
            <p>© {new Date().getFullYear()} Compound Interest Calculator. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
