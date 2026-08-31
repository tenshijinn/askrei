import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/components/WalletProvider";
import { EVMWalletProvider } from "@/components/EVMWalletProvider";
import JoinRei from "./pages/JoinRei";
import JoinReiV2 from "./pages/JoinReiV2";
import JoinReiOriginal from "./pages/JoinReiOriginal";
import Rei from "./pages/Rei";
import Agents from "./pages/Agents";
import AdminMockups from "./pages/AdminMockups";
import UnlimitedPosts from "./pages/UnlimitedPosts";
import UnlimitedPostsReturn from "./pages/UnlimitedPostsReturn";
import ReferralRedirect from "./pages/ReferralRedirect";
import CampaignRedirect from "./pages/CampaignRedirect";
import ButtonLab from "./pages/ButtonLab";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import Login from "./pages/Login";
import Ask from "./pages/Ask";
import Earn from "./pages/Earn";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";


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
              <Route path="/" element={<JoinReiV2 />} />
              <Route path="/v1" element={<JoinRei />} />
              <Route path="/joinrei" element={<JoinReiOriginal />} />
              <Route path="/rei" element={<Rei />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/admin/mockups" element={<AdminMockups />} />
              <Route path="/unlimited-posts" element={<UnlimitedPosts />} />
              <Route path="/unlimited-posts/return" element={<UnlimitedPostsReturn />} />
              <Route path="/r/:code" element={<ReferralRedirect />} />
              <Route path="/c/:code" element={<CampaignRedirect />} />
              <Route path="/button-lab" element={<ButtonLab />} />
              <Route path="/login" element={<Login />} />
              <Route path="/ask" element={<Ask />} />
              <Route path="/earn" element={<Earn />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              <Route path="/s/:shareId" element={<Earn />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </EVMWalletProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
