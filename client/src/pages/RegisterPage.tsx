import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Plane, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const register = trpc.customAuth.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email) { setError("Please enter your email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    register.mutate({ name: name.trim(), email, password, origin: window.location.origin });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[oklch(0.10_0_0)] flex flex-col">
        <div className="bg-[oklch(0.85_0.18_95)] px-6 py-3 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-black" />
            <span className="font-black text-black text-lg tracking-wide">FLIGHT DRAMA</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl p-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-black text-white mb-2">Check your inbox ✈</h1>
              <p className="text-[oklch(0.60_0_0)] mb-6">
                We've sent a verification link to <span className="text-white font-bold">{email}</span>.
                Click the link in the email to activate your account.
              </p>
              <p className="text-xs text-[oklch(0.45_0_0)] mb-4">Didn't receive it? Check your spam folder.</p>
              <Link href="/login" className="text-[oklch(0.85_0.18_95)] font-bold hover:underline text-sm">
                ← Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] flex flex-col">
      <div className="bg-[oklch(0.85_0.18_95)] px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-black" />
          <span className="font-black text-black text-lg tracking-wide">FLIGHT DRAMA</span>
        </Link>
        <span className="text-black text-xs font-bold uppercase tracking-widest">Aviation News</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
            <div className="px-8 pt-8 pb-6 border-b border-[oklch(0.20_0_0)]">
              <div className="w-12 h-12 bg-[oklch(0.85_0.18_95)] flex items-center justify-center mb-4">
                <Plane className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-2xl font-black text-white mb-1">Join Flight Drama</h1>
              <p className="text-sm text-[oklch(0.55_0_0)]">Create your free account and start your pilot journey</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-700 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dave Thornton"
                  autoComplete="name"
                  className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-3 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm"
                />
              </div>

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
                <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
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
                {password.length > 0 && (
                  <div className="mt-1.5 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= (i + 1) * 3
                          ? i < 2 ? "bg-red-500" : i < 3 ? "bg-yellow-500" : "bg-green-500"
                          : "bg-[oklch(0.22_0_0)]"
                      }`} />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={register.isPending}
                className="w-full bg-[oklch(0.85_0.18_95)] text-black font-black py-3 rounded-lg hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {register.isPending ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plane className="w-4 h-4" />
                )}
                Create Account
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[oklch(0.22_0_0)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[oklch(0.13_0_0)] px-3 text-[oklch(0.45_0_0)]">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.location.href = getLoginUrl()}
                className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] text-white font-bold py-3 rounded-lg hover:border-[oklch(0.85_0.18_95)]/40 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <span className="text-base">🔐</span> Continue with Manus
              </button>

              <p className="text-[10px] text-[oklch(0.40_0_0)] text-center">
                By creating an account you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>

            <div className="px-8 pb-8 text-center">
              <p className="text-sm text-[oklch(0.50_0_0)]">
                Already have an account?{" "}
                <Link href="/login" className="text-[oklch(0.85_0.18_95)] font-bold hover:underline">
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
