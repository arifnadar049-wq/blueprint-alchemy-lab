import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PomodoroTimer from "./pages/PomodoroTimer";
import Today from "./pages/Today";
import ThisWeek from "./pages/ThisWeek";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/app" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pomodoro" element={<PomodoroTimer />} />
          <Route path="/today" element={<Today />} />
          <Route path="/this-week" element={<ThisWeek />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
