import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import SystemHealth from "@/pages/SystemHealth";
import Help from "@/pages/Help";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Login = lazy(() => import("./pages/Login"));

function Router() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#020813]"><Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" /></div>}>
      <Switch>
        <Route path={"/login"} component={Login} />
        <Route path={"/"} component={Home} />
        <Route path={"/search"} component={Home} />
        <Route path={"/analytics"} component={Home} />

        <Route path={"/admin/users"} component={Home} />
        <Route path={"/assistant"} component={Home} />
        <Route path={"/health"} component={SystemHealth} />
        <Route path={"/help"} component={Help} />
        <Route path={"/import"} component={Home} />
        <Route path={"/editor"} component={Home} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
