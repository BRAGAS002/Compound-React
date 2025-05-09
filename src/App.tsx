// Import necessary UI components and providers
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Initialize React Query client for data fetching and caching
const queryClient = new QueryClient();

/**
 * Main App Component
 * 
 * This component sets up the core providers and routing for the application:
 * - ThemeProvider: Enables light/dark mode functionality
 * - QueryClientProvider: Manages data fetching and caching
 * - TooltipProvider: Enables tooltips throughout the app
 * - Toaster/Sonner: Provides toast notifications
 * - BrowserRouter: Handles client-side routing
 */
const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="compound-calculator-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
