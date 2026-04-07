import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/components/WalletProvider";
import { EVMWalletProvider } from "@/components/EVMWalletProvider";
import JoinRei from "./pages/JoinRei";
import Rei from "./pages/Rei";
import ReferralRedirect from "./pages/ReferralRedirect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <EVMWalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<JoinRei />} />
              <Route path="/rei" element={<Rei />} />
              <Route path="/r/:code" element={<ReferralRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </EVMWalletProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
