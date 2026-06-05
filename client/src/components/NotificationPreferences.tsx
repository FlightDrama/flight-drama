import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Smartphone, Globe, Zap, Lock, Crown } from "lucide-react";
import { Link } from "wouter";

type Prefs = {
  emailEnabled: boolean;
  emailAddress: string;
  smsEnabled: boolean;
  smsPhone: string;
  whatsappEnabled: boolean;
  whatsappPhone: string;
  browserPushEnabled: boolean;
  breakingOnly: boolean;
};

const DEFAULT_PREFS: Prefs = {
  emailEnabled: true,
  emailAddress: "",
  smsEnabled: false,
  smsPhone: "",
  whatsappEnabled: false,
  whatsappPhone: "",
  browserPushEnabled: false,
  breakingOnly: false,
};

const CHANNELS = [
  {
    key: "email" as const,
    icon: Mail,
    label: "Priority Email",
    description: "Instant email the moment a breaking story drops — before the newsletter, before social media.",
    tier: "crew",
    hasField: true,
    fieldKey: "emailAddress" as const,
    fieldLabel: "Email address",
    fieldType: "email",
    fieldPlaceholder: "your@email.com",
  },
  {
    key: "sms" as const,
    icon: Smartphone,
    label: "SMS Text",
    description: "A text message to your phone with the headline and link. No app needed.",
    tier: "captain",
    hasField: true,
    fieldKey: "smsPhone" as const,
    fieldLabel: "Phone number (with country code)",
    fieldType: "tel",
    fieldPlaceholder: "+44 7700 900000",
  },
  {
    key: "whatsapp" as const,
    icon: MessageSquare,
    label: "WhatsApp",
    description: "Breaking news sent directly to your WhatsApp — with the headline, excerpt and link.",
    tier: "captain",
    hasField: true,
    fieldKey: "whatsappPhone" as const,
    fieldLabel: "WhatsApp number (with country code)",
    fieldType: "tel",
    fieldPlaceholder: "+44 7700 900000",
  },
  {
    key: "browser" as const,
    icon: Globe,
    label: "Browser Push",
    description: "A push notification in your browser — even when you're not on the site.",
    tier: "crew",
    hasField: false,
    fieldKey: null,
    fieldLabel: "",
    fieldType: "",
    fieldPlaceholder: "",
  },
];

const TIER_ORDER = { crew: 0, captain: 1, firstclass: 2 };

export default function NotificationPreferences({
  membership,
  userEmail,
}: {
  membership: any;
  userEmail?: string;
}) {
  const isActive = membership?.status === "active";
  const userTier = (membership?.tier ?? "crew") as keyof typeof TIER_ORDER;

  const { data: savedPrefs, isLoading } = trpc.notifications.getPreferences.useQuery(
    undefined,
    { enabled: isActive }
  );

  const [prefs, setPrefs] = useState<Prefs>({ ...DEFAULT_PREFS, emailAddress: userEmail ?? "" });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (savedPrefs) {
      setPrefs({
        emailEnabled: !!savedPrefs.emailEnabled,
        emailAddress: savedPrefs.emailAddress ?? userEmail ?? "",
        smsEnabled: !!savedPrefs.smsEnabled,
        smsPhone: savedPrefs.smsPhone ?? "",
        whatsappEnabled: !!savedPrefs.whatsappEnabled,
        whatsappPhone: savedPrefs.whatsappPhone ?? "",
        browserPushEnabled: !!savedPrefs.browserPushEnabled,
        breakingOnly: !!savedPrefs.breakingOnly,
      });
    }
  }, [savedPrefs, userEmail]);

  const savePrefs = trpc.notifications.savePreferences.useMutation({
    onSuccess: () => { toast.success("Notification preferences saved ✈"); setDirty(false); },
    onError: (e) => toast.error(e.message),
  });

  const update = (key: keyof Prefs, value: any) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const canUseChannel = (tier: string) =>
    isActive && TIER_ORDER[userTier] >= TIER_ORDER[tier as keyof typeof TIER_ORDER];

  if (!isActive) {
    return (
      <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
        <div className="bg-[oklch(0.18_0_0)] px-5 py-3 border-b border-[oklch(0.22_0_0)] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
          <h2 className="font-black text-white text-sm uppercase tracking-wide">Get The News First</h2>
        </div>
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <h3 className="font-black text-white text-lg mb-2">Be First. Every Time.</h3>
          <p className="text-[oklch(0.55_0_0)] text-sm mb-4 max-w-sm mx-auto">
            Pro subscribers get breaking aviation news via email, SMS and WhatsApp — before the newsletter, before social media.
          </p>
          <Link href="/pro" className="inline-flex items-center gap-2 bg-[oklch(0.85_0.18_95)] text-black px-5 py-2.5 rounded-lg font-black text-sm hover:bg-[oklch(0.78_0.18_95)] transition-colors">
            <Crown className="w-4 h-4" /> Upgrade to unlock — from £0.99/month
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[oklch(0.13_0_0)] border border-[oklch(0.22_0_0)] rounded-xl overflow-hidden">
      <div className="bg-[oklch(0.18_0_0)] px-5 py-3 border-b border-[oklch(0.22_0_0)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[oklch(0.85_0.18_95)]" />
          <h2 className="font-black text-white text-sm uppercase tracking-wide">Get The News First</h2>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[oklch(0.85_0.18_95)]/10 text-[oklch(0.85_0.18_95)]">
          ✈ Pro Only
        </span>
      </div>

      <div className="p-5">
        {/* Hero pitch */}
        <div className="bg-gradient-to-r from-[oklch(0.85_0.18_95)]/10 to-transparent border border-[oklch(0.85_0.18_95)]/20 rounded-lg p-4 mb-5">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-[oklch(0.85_0.18_95)] shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-white text-sm">You read it before anyone else.</p>
              <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
                The second we publish a breaking story, you get notified — before the newsletter, before social media, before anyone else.
              </p>
            </div>
          </div>
        </div>

        {/* Notification channels */}
        <div className="space-y-4 mb-5">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const enabled = prefs[`${channel.key}Enabled` as keyof Prefs] as boolean;
            const canUse = canUseChannel(channel.tier);
            const needsUpgrade = !canUse;

            return (
              <div
                key={channel.key}
                className={`rounded-lg border p-4 transition-colors ${
                  needsUpgrade
                    ? "border-[oklch(0.20_0_0)] opacity-60"
                    : enabled
                    ? "border-[oklch(0.85_0.18_95)]/40 bg-[oklch(0.85_0.18_95)]/05"
                    : "border-[oklch(0.22_0_0)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${enabled && !needsUpgrade ? "text-[oklch(0.85_0.18_95)]" : "text-[oklch(0.45_0_0)]"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{channel.label}</p>
                        {needsUpgrade && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#f5c518]/10 text-[#f5c518] border border-[#f5c518]/30">
                            Captain+
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[oklch(0.50_0_0)] mt-0.5">{channel.description}</p>

                      {/* Phone/email field — shown when enabled */}
                      {channel.hasField && channel.fieldKey && enabled && !needsUpgrade && (
                        <input
                          type={channel.fieldType}
                          value={prefs[channel.fieldKey] as string}
                          onChange={(e) => update(channel.fieldKey!, e.target.value)}
                          placeholder={channel.fieldPlaceholder}
                          className="mt-2 w-full bg-[oklch(0.18_0_0)] border border-[oklch(0.28_0_0)] text-white text-xs px-3 py-1.5 rounded focus:outline-none focus:border-[oklch(0.85_0.18_95)] transition-colors"
                        />
                      )}
                    </div>
                  </div>

                  {/* Toggle */}
                  {needsUpgrade ? (
                    <Link href="/pro" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Lock className="w-4 h-4 text-[oklch(0.35_0_0)]" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => update(`${channel.key}Enabled` as keyof Prefs, !enabled)}
                      className={`shrink-0 w-10 h-5 rounded-full transition-colors relative ${enabled ? "bg-[oklch(0.85_0.18_95)]" : "bg-[oklch(0.25_0_0)]"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Breaking only toggle */}
        <div className="flex items-center justify-between py-3 border-t border-[oklch(0.20_0_0)] mb-5">
          <div>
            <p className="text-sm font-bold text-white">Breaking news only</p>
            <p className="text-xs text-[oklch(0.45_0_0)]">Only notify me for breaking/emergency stories, not all new articles</p>
          </div>
          <button
            onClick={() => update("breakingOnly", !prefs.breakingOnly)}
            className={`shrink-0 w-10 h-5 rounded-full transition-colors relative ${prefs.breakingOnly ? "bg-[oklch(0.85_0.18_95)]" : "bg-[oklch(0.25_0_0)]"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${prefs.breakingOnly ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Save button */}
        <button
          onClick={() => savePrefs.mutate(prefs)}
          disabled={savePrefs.isPending || !dirty}
          className="w-full py-2.5 rounded-lg text-sm font-black uppercase tracking-wide transition-all active:scale-[0.97] disabled:opacity-40"
          style={{
            background: dirty ? "oklch(0.85 0.18 95)" : "oklch(0.20 0 0)",
            color: dirty ? "#000" : "oklch(0.45 0 0)",
          }}
        >
          {savePrefs.isPending ? "Saving..." : dirty ? "Save Preferences" : "Preferences Saved"}
        </button>

        <p className="text-[10px] text-[oklch(0.35_0_0)] text-center mt-3">
          SMS and WhatsApp require a Twilio account to be configured. Email notifications use Resend.
        </p>
      </div>
    </div>
  );
}
