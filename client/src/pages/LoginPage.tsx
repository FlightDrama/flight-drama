import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Plane, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const login = trpc.customAuth.login.useMutation({
    onSuccess: () => {
      toast.success("Welcome back! ✈");
      window.location.href = "/";
    },
    onError: (e) => {
      if (e.message === "INVALID_CREDENTIALS") setError("Incorrect email or password.");
      else if (e.message === "EMAIL_NOT_VERIFIED") setError("Please verify your email first. Check your inbox.");
      else setError(e.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] flex flex-col">
      {/* Top bar */}
      <div className="bg-[oklch(0.85_0.18_95)] px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-black" />
          <span className="font-black text-black text-lg tracking-wide">FLIGHT DRAMA</span>
        </Link>
        <span className="text-black text-xs font-bold uppercase tracking-widest">Aviation News</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-[oklch(0.20_0_0)]">
              <div className="w-12 h-12 bg-[oklch(0.85_0.18_95)] flex items-center justify-center mb-4">
                <Plane className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-2xl font-black text-white mb-1">Sign in to Flight Drama</h1>
              <p className="text-sm text-[oklch(0.55_0_0)]">Join the aviation community</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-700 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-3 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)]">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[oklch(0.85_0.18_95)] hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-3 pr-10 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.45_0_0)] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                className="w-full bg-[oklch(0.85_0.18_95)] text-black font-black py-3 rounded-lg hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {login.isPending ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plane className="w-4 h-4" />
                )}
                Sign In
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[oklch(0.22_0_0)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[oklch(0.13_0_0)] px-3 text-[oklch(0.45_0_0)]">or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.location.href = getLoginUrl()}
                className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] text-white font-bold py-3 rounded-lg hover:border-[oklch(0.85_0.18_95)]/40 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <span className="text-base">🔐</span> Continue with Manus
              </button>
            </form>

            <div className="px-8 pb-8 text-center">
              <p className="text-sm text-[oklch(0.50_0_0)]">
                Don't have an account?{" "}
                <Link href="/register" className="text-[oklch(0.85_0.18_95)] font-bold hover:underline">
                  Create one free →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
