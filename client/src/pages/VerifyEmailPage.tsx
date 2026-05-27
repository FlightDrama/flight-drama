import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Plane, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const searchStr = useSearch();
  const token = new URLSearchParams(searchStr).get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verify = trpc.customAuth.verifyEmail.useMutation({
    onSuccess: (data) => { setStatus("success"); setMessage(data.message); },
    onError: (e) => { setStatus("error"); setMessage(e.message === "INVALID_OR_EXPIRED_TOKEN" ? "This verification link is invalid or has expired." : e.message); },
  });

  useEffect(() => {
    if (token) verify.mutate({ token });
    else { setStatus("error"); setMessage("No verification token found."); }
  }, [token]);

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
            {status === "loading" && (
              <>
                <Loader2 className="w-12 h-12 text-[oklch(0.85_0.18_95)] mx-auto mb-4 animate-spin" />
                <h1 className="text-xl font-black text-white mb-2">Verifying your email...</h1>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h1 className="text-xl font-black text-white mb-2">Email Verified! ✈</h1>
                <p className="text-[oklch(0.60_0_0)] mb-6">{message}</p>
                <Link href="/" className="inline-block bg-[oklch(0.85_0.18_95)] text-black font-black px-6 py-3 hover:bg-[oklch(0.78_0.18_95)] transition-colors">
                  Go to Flight Drama →
                </Link>
              </>
            )}
            {status === "error" && (
              <>
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h1 className="text-xl font-black text-white mb-2">Verification Failed</h1>
                <p className="text-[oklch(0.60_0_0)] mb-6">{message}</p>
                <Link href="/login" className="text-[oklch(0.85_0.18_95)] font-bold hover:underline text-sm">← Back to sign in</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
