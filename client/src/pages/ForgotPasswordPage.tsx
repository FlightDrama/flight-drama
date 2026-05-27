import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Plane, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const forgot = trpc.customAuth.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
    onError: (e) => setError(e.message),
  });

  if (sent) return (
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
            <h1 className="text-xl font-black text-white mb-2">Check your inbox</h1>
            <p className="text-[oklch(0.60_0_0)] mb-6">If an account exists for <span className="text-white font-bold">{email}</span>, we've sent a password reset link. Check your spam folder if you don't see it.</p>
            <Link href="/login" className="text-[oklch(0.85_0.18_95)] font-bold hover:underline text-sm">← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] flex flex-col">
      <div className="bg-[oklch(0.85_0.18_95)] px-6 py-3 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-black" />
          <span className="font-black text-black text-lg tracking-wide">FLIGHT DRAMA</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
            <div className="px-8 pt-8 pb-6 border-b border-[oklch(0.20_0_0)]">
              <h1 className="text-2xl font-black text-white mb-1">Forgot your password?</h1>
              <p className="text-sm text-[oklch(0.55_0_0)]">Enter your email and we'll send you a reset link</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setError(""); forgot.mutate({ email, origin: window.location.origin }); }} className="px-8 py-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-700 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-3 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm" />
              </div>
              <button type="submit" disabled={forgot.isPending || !email} className="w-full bg-[oklch(0.85_0.18_95)] text-black font-black py-3 rounded-lg hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {forgot.isPending ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Plane className="w-4 h-4" />}
                Send Reset Link
              </button>
            </form>
            <div className="px-8 pb-8 text-center">
              <Link href="/login" className="text-sm text-[oklch(0.85_0.18_95)] font-bold hover:underline">← Back to sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
