import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ArticlePage from "./pages/ArticlePage";
import CategoryPage from "./pages/CategoryPage";
import VideoPage from "./pages/VideoPage";
import ForumPage from "./pages/ForumPage";
import ForumBoardPage from "./pages/ForumBoardPage";
import ForumThreadPage from "./pages/ForumThreadPage";
import NewsletterPage from "./pages/NewsletterPage";
import ProPage from "./pages/ProPage";
import ProSuccessPage from "./pages/ProSuccessPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminArticles from "./pages/AdminArticles";
import AdminSubscribers from "./pages/AdminSubscribers";
import AdminUsers from "./pages/AdminUsers";
import AdminAdSlots from "./pages/AdminAdSlots";
import AdminComments from "./pages/AdminComments";
import ProfilePage from "./pages/ProfilePage";
import FlightLookupPage from "./pages/FlightLookupPage";
import ScrollToTop from "./components/ScrollToTop";
import FloatingNewsletter from "./components/FloatingNewsletter";
import { useEffect } from "react";
import { useLocation } from "wouter";

function ScrollReset() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollReset />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/article/:slug" component={ArticlePage} />
        <Route path="/category/:slug" component={CategoryPage} />
        <Route path="/videos" component={VideoPage} />
        <Route path="/forum" component={ForumPage} />
        <Route path="/forum/:boardSlug" component={ForumBoardPage} />
        <Route path="/forum/thread/:id" component={ForumThreadPage} />
        <Route path="/newsletter" component={NewsletterPage} />
        <Route path="/pro" component={ProPage} />
        <Route path="/pro/success" component={ProSuccessPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/articles" component={AdminArticles} />
        <Route path="/admin/subscribers" component={AdminSubscribers} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/ads" component={AdminAdSlots} />
        <Route path="/admin/comments" component={AdminComments} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/flight-lookup" component={FlightLookupPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <ScrollToTop />
          <FloatingNewsletter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
