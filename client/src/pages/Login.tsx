import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { AlertCircle, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.localLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (err: any) => {
      setError(err.message || "Invalid email or password");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setError("");
    
    // Sign in on frontend to get Supabase session for Storage uploads
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      return;
    }
    
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="login-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020813] p-4 text-[#e2e8f0]">
      <Card className="login-card w-full max-w-md overflow-hidden border border-[#17324b] border-t-4 border-t-[#7de7ff] bg-[#0b1527] text-[#e2e8f0] shadow-[0_24px_80px_rgba(0,0,0,.42)]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full border border-[#7de7ff]/25 bg-[#0c2d38] p-3 shadow-[0_0_28px_rgba(125,231,255,.12)]">
              <LockKeyhole className="h-8 w-8 text-[#7de7ff]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#f7fbff]">Welcome Back</CardTitle>
          <CardDescription className="text-[#9fb2c7]">
            Enter your Supabase email and password to access IMCAN Inventory Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#d8e6f2]" htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                className="w-full border-[#27445d] bg-[#071426] text-[#f7fbff] placeholder:text-[#6f849a] focus-visible:border-[#7de7ff] focus-visible:ring-[#7de7ff]/25"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#d8e6f2]" htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  className="w-full border-[#27445d] bg-[#071426] pr-11 text-[#f7fbff] placeholder:text-[#6f849a] focus-visible:border-[#7de7ff] focus-visible:ring-[#7de7ff]/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loginMutation.isPending}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#8ea5b9] transition-colors hover:text-[#7de7ff] focus:outline-none focus-visible:text-[#7de7ff] disabled:pointer-events-none disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-4 border-[#ef6b73]/40 bg-[#351b25] text-[#ffd7da]">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="mt-4 w-full border-0 bg-gradient-to-r from-[#10a8df] to-[#22c7a7] text-[#021018] shadow-[0_8px_24px_rgba(34,199,167,.18)] transition-all hover:from-[#39c2ef] hover:to-[#42d8bb]" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-[#17324b] bg-[#071426] p-4 text-xs text-[#8ea5b9]">
          IMCAN Inventory Hub &copy; {new Date().getFullYear()}
        </CardFooter>
      </Card>
    </div>
  );
}
