import { useState } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Plane, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const searchStr = useSearch();
  const token = new URLSearchParams(searchStr).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = trpc.customAuth.resetPassword.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message === "INVALID_OR_EXPIRED_TOKEN" ? "This reset link is invalid or has expired. Please request a new one." : e.message),
  });

  if (success) return (
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
            <h1 className="text-xl font-black text-white mb-2">Password Updated ✈</h1>
            <p className="text-[oklch(0.60_0_0)] mb-6">Your password has been changed. You can now sign in with your new password.</p>
            <Link href="/login" className="inline-block bg-[oklch(0.85_0.18_95)] text-black font-black px-6 py-3 hover:bg-[oklch(0.78_0.18_95)] transition-colors">Sign In →</Link>
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
              <h1 className="text-2xl font-black text-white mb-1">Set new password</h1>
              <p className="text-sm text-[oklch(0.55_0_0)]">Choose a strong password for your Flight Drama account</p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault(); setError("");
              if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
              if (password !== confirm) { setError("Passwords don't match."); return; }
              if (!token) { setError("Missing reset token."); return; }
              reset.mutate({ token, password });
            }} className="px-8 py-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-700 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-3 pr-10 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.45_0_0)] hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[oklch(0.55_0_0)] mb-1.5">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" className="w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] rounded-lg px-4 py-3 text-white placeholder-[oklch(0.40_0_0)] focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors text-sm" />
              </div>
              <button type="submit" disabled={reset.isPending} className="w-full bg-[oklch(0.85_0.18_95)] text-black font-black py-3 rounded-lg hover:bg-[oklch(0.78_0.18_95)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {reset.isPending ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Plane className="w-4 h-4" />}
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
