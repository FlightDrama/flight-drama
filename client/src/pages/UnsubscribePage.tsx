import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Plane, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function UnsubscribePage() {
  const searchStr = useSearch();
  const token = new URLSearchParams(searchStr).get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">(token ? "loading" : "idle");

  const unsubscribe = trpc.newsletter.unsubscribe.useMutation({
    onSuccess: () => setStatus("success"),
    onError: () => setStatus("error"),
  });

  useEffect(() => {
    if (token) unsubscribe.mutate({ token });
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
                <h1 className="text-xl font-black text-white mb-2">Unsubscribing...</h1>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h1 className="text-xl font-black text-white mb-2">You've been unsubscribed</h1>
                <p className="text-[oklch(0.60_0_0)] mb-6">
                  You've been removed from the Flight Drama newsletter. You won't receive any more emails from us.
                </p>
                <p className="text-sm text-[oklch(0.50_0_0)] mb-4">Changed your mind?</p>
                <Link href="/newsletter" className="inline-block bg-[oklch(0.85_0.18_95)] text-black font-black px-6 py-3 hover:bg-[oklch(0.78_0.18_95)] transition-colors">
                  Resubscribe →
                </Link>
              </>
            )}
            {status === "error" && (
              <>
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h1 className="text-xl font-black text-white mb-2">Invalid Link</h1>
                <p className="text-[oklch(0.60_0_0)] mb-6">
                  This unsubscribe link is invalid or has already been used.
                </p>
                <Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline text-sm">← Back to Flight Drama</Link>
              </>
            )}
            {status === "idle" && (
              <>
                <Plane className="w-12 h-12 text-[oklch(0.85_0.18_95)] mx-auto mb-4" />
                <h1 className="text-xl font-black text-white mb-2">Unsubscribe</h1>
                <p className="text-[oklch(0.60_0_0)] mb-6">No unsubscribe token found. Please use the unsubscribe link from your email.</p>
                <Link href="/" className="text-[oklch(0.85_0.18_95)] hover:underline text-sm">← Back to Flight Drama</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
