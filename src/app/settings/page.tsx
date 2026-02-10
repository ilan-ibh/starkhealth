"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Connection { id: string; name: string; description: string; connected: boolean; authType: "oauth" | "apikey"; icon: React.ReactNode; color: string; scopes: string[]; keyHint?: string; keyUrl?: string; }
const CONNECTIONS: Connection[] = [
  { id: "whoop", name: "WHOOP", description: "Recovery, HRV, sleep, strain & workout data", connected: false, authType: "oauth", color: "#22c55e", scopes: ["Recovery metrics", "Sleep data & stages", "Strain & workouts", "Heart rate & HRV"],
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M7 12h2l1.5-3 3 6 1.5-3h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
  { id: "withings", name: "Withings", description: "Weight, body composition, blood pressure & activity", connected: false, authType: "oauth", color: "#3b82f6", scopes: ["Weight & BMI", "Body composition", "Blood pressure", "Daily activity & steps"],
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M8 18c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg> },
  { id: "hevy", name: "Hevy", description: "Workout tracking, exercises, sets, reps & strength progression", connected: false, authType: "apikey", color: "#f97316", scopes: ["Workout history", "Exercise data & sets", "Personal records", "Routines"], keyHint: "Hevy Pro API key", keyUrl: "https://hevy.com/settings?developer",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M8 8v8M16 8v8M6 10h4M14 10h4M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
];

export default function Settings() {
  const router = useRouter();
  const [connections, setConnections] = useState(CONNECTIONS);
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [aiModel, setAiModel] = useState("claude-sonnet-4-5-20250929");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [units, setUnits] = useState("metric");
  const [mcpToken, setMcpToken] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const AI_MODELS = [
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", desc: "Fast, great for daily use" },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6", desc: "Most capable, deeper analysis" },
  ];

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");

      // Load AI settings
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setMaskedKey(data.anthropic_api_key_masked);
        setHasKey(data.has_api_key);
        if (data.ai_model) setAiModel(data.ai_model);
        if (data.units) setUnits(data.units);
        if (data.mcp_token) setMcpToken(data.mcp_token);
        // Provider status comes from /api/settings now (fast, no data fetch)
        if (data.providers) {
          setConnections((prev) =>
            prev.map((c) => ({ ...c, connected: data.providers[c.id] ?? false }))
          );
        }
      }
    };
    load();
  }, []);

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anthropic_api_key: apiKey }) });
    if (res.ok) { setHasKey(true); setMaskedKey(apiKey.slice(0, 12) + "•".repeat(20) + apiKey.slice(-4)); setApiKey(""); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  const [hevyKey, setHevyKey] = useState("");
  const [hevyKeySaved, setHevyKeySaved] = useState(false);

  const signOut = async () => { const supabase = createClient(); await supabase.auth.signOut(); router.push("/"); router.refresh(); };

  const deleteAccount = async () => {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) { router.push("/"); router.refresh(); }
    else { setDeleting(false); setDeleteConfirm(false); }
  };

  const generateMcpToken = async () => {
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mcp_token: token }) });
    setMcpToken(token);
  };

  const revokeMcpToken = async () => {
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mcp_token: null }) });
    setMcpToken(null);
  };

  const toggleUnits = async (newUnits: string) => {
    setUnits(newUnits);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ units: newUnits }) });
  };

  const connectProvider = (id: string) => {
    // OAuth providers redirect to auth endpoint
    if (id === "whoop") window.location.href = "/api/whoop/auth";
    else if (id === "withings") window.location.href = "/api/withings/auth";
  };

  const disconnectProvider = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("provider_tokens").delete().eq("user_id", user.id).eq("provider", id);
    setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, connected: false } : c)));
  };

  const saveHevyKey = async () => {
    if (!hevyKey.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("provider_tokens").upsert(
      { user_id: user.id, provider: "hevy", access_token: hevyKey.trim() },
      { onConflict: "user_id,provider" }
    );
    setConnections((prev) => prev.map((c) => (c.id === "hevy" ? { ...c, connected: true } : c)));
    setHevyKeySaved(true);
    setHevyKey("");
    setTimeout(() => setHevyKeySaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-30 border-b border-edge bg-header backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <Link href="/"><Image src="/logo.png" alt="Stark Health" width={28} height={28} /></Link>
            <div className="h-4 w-px bg-edge" />
            <span className="text-[11px] font-light tracking-[0.2em] text-t4 uppercase">Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard" className="flex items-center gap-2 text-[11px] font-light tracking-wider text-t4 transition-colors hover:text-t2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Dashboard
            </Link>
            <button onClick={signOut} className="rounded-full border border-edge px-3.5 py-1.5 text-[11px] font-light tracking-wider text-t4 transition-all hover:border-edge-h hover:text-t2">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* AI Configuration */}
        <section>
          <h2 className="text-[10px] font-medium tracking-[0.25em] text-t4 uppercase">AI Configuration</h2>
          <p className="mt-2 text-sm font-light text-t3">Add your Anthropic API key to power the Stark Health AI assistant. Your key is stored securely and only used for your requests.</p>
          <div className="mt-6 rounded-2xl border border-edge bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-light tracking-wider text-t1">Anthropic API Key</h3>
                <p className="mt-0.5 text-[11px] font-light text-t4">Get yours at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-t3 underline underline-offset-4 hover:text-t2">console.anthropic.com</a></p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${hasKey ? "bg-emerald-500" : "bg-tm"}`} />
                <span className={`text-[11px] font-light ${hasKey ? "text-emerald-600 dark:text-emerald-400" : "text-t4"}`}>{hasKey ? "Configured" : "Not set"}</span>
              </div>
            </div>
            {maskedKey && <div className="mt-4 rounded-lg bg-page px-3 py-2"><p className="font-mono text-[11px] text-t4">{maskedKey}</p></div>}
            <div className="mt-4 flex gap-3">
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={hasKey ? "Enter new key to update..." : "sk-ant-..."}
                className="flex-1 rounded-xl border border-edge bg-page px-4 py-2.5 font-mono text-sm font-light text-t1 placeholder-tm outline-none transition-colors focus:border-edge-h" />
              <button onClick={saveApiKey} disabled={saving || !apiKey.trim()}
                className="shrink-0 rounded-xl bg-btn px-5 py-2.5 text-[12px] font-light tracking-wider text-t2 transition-all hover:bg-btn-h disabled:opacity-30">
                {saving ? "Saving..." : saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div className="mt-4 rounded-2xl border border-edge bg-card p-6">
            <h3 className="text-sm font-light tracking-wider text-t1">AI Model</h3>
            <p className="mt-0.5 text-[11px] font-light text-t4">Choose which Claude model powers your health assistant</p>
            <div className="mt-4 space-y-2.5">
              {AI_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={async () => {
                    setAiModel(m.id);
                    await fetch("/api/settings", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ai_model: m.id }),
                    });
                  }}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                    aiModel === m.id
                      ? "border-edge-h bg-card-h"
                      : "border-edge bg-page hover:border-edge-s"
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    aiModel === m.id ? "border-emerald-500" : "border-edge-s"
                  }`}>
                    {aiModel === m.id && <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-light text-t1">{m.name}</p>
                    <p className="text-[11px] font-light text-t4">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* MCP Integration */}
        <section className="mt-14">
          <h2 className="text-[10px] font-medium tracking-[0.25em] text-t4 uppercase">MCP Integration</h2>
          <p className="mt-2 text-sm font-light text-t3">Connect external AI agents (like Open Claw) to your Stark Health data via the Model Context Protocol.</p>
          <div className="mt-6 rounded-2xl border border-edge bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-light tracking-wider text-t1">API Token</h3>
                <p className="mt-0.5 text-[11px] font-light text-t4">Used to authenticate MCP tool calls from external agents</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${mcpToken ? "bg-emerald-500" : "bg-tm"}`} />
                <span className={`text-[11px] font-light ${mcpToken ? "text-emerald-600 dark:text-emerald-400" : "text-t4"}`}>{mcpToken ? "Active" : "Not set"}</span>
              </div>
            </div>

            {mcpToken && (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-page px-3 py-2">
                  <p className="break-all font-mono text-[11px] text-t3">{mcpToken}</p>
                </div>
                <div className="rounded-lg bg-page px-3 py-2">
                  <p className="text-[10px] font-medium text-t4 uppercase tracking-wider mb-1">MCP Client Config</p>
                  <pre className="font-mono text-[10px] text-t3 whitespace-pre-wrap">{`{
  "stark-health": {
    "url": "${typeof window !== "undefined" ? window.location.origin : "https://starkhealth.io"}/api/mcp",
    "headers": {
      "Authorization": "Bearer ${mcpToken}"
    }
  }
}`}</pre>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              {!mcpToken ? (
                <button onClick={generateMcpToken} className="rounded-xl bg-btn px-5 py-2.5 text-[12px] font-light tracking-wider text-t2 transition-all hover:bg-btn-h">
                  Generate Token
                </button>
              ) : (
                <>
                  <button onClick={generateMcpToken} className="rounded-xl bg-btn px-5 py-2.5 text-[12px] font-light tracking-wider text-t2 transition-all hover:bg-btn-h">
                    Regenerate
                  </button>
                  <button onClick={revokeMcpToken} className="rounded-xl border border-edge px-5 py-2.5 text-[12px] font-light tracking-wider text-t4 transition-all hover:border-red-500/30 hover:text-red-500">
                    Revoke
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Connected Services */}
        <section className="mt-14">
          <h2 className="text-[10px] font-medium tracking-[0.25em] text-t4 uppercase">Connected Services</h2>
          <p className="mt-2 text-sm font-light text-t3">Connect your health devices to aggregate data into your Stark Health dashboard.</p>
          <div className="mt-8 space-y-4">
            {connections.map((conn) => (
              <div key={conn.id} className="rounded-2xl border border-edge bg-card p-6 transition-colors hover:bg-card-h">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-edge" style={{ color: conn.color }}>{conn.icon}</div>
                    <div>
                      <h3 className="text-sm font-light tracking-wider text-t1">{conn.name}</h3>
                      <p className="mt-0.5 text-[12px] font-light text-t4">{conn.description}</p>
                    </div>
                  </div>
                  {conn.authType === "oauth" && !conn.connected && (
                    <button onClick={() => connectProvider(conn.id)} className="shrink-0 rounded-full bg-btn px-5 py-2 text-[11px] font-light tracking-wider text-t1 transition-all hover:bg-btn-h">
                      Connect
                    </button>
                  )}
                  {conn.authType === "oauth" && conn.connected && (
                    <button onClick={() => disconnectProvider(conn.id)} className="shrink-0 rounded-full border border-edge px-5 py-2 text-[11px] font-light tracking-wider text-t3 transition-all hover:border-red-500/30 hover:text-red-500">
                      Disconnect
                    </button>
                  )}
                  {conn.authType === "apikey" && !conn.connected && (
                    <span className="shrink-0 rounded-full border border-edge px-3 py-1.5 text-[10px] font-light tracking-wider text-t4">API Key</span>
                  )}
                  {conn.authType === "apikey" && conn.connected && (
                    <button onClick={() => disconnectProvider(conn.id)} className="shrink-0 rounded-full border border-edge px-5 py-2 text-[11px] font-light tracking-wider text-t3 transition-all hover:border-red-500/30 hover:text-red-500">
                      Disconnect
                    </button>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${conn.connected ? "bg-emerald-500" : "bg-tm"}`} />
                  <span className={`text-[11px] font-light ${conn.connected ? "text-emerald-600 dark:text-emerald-400" : "text-t4"}`}>{conn.connected ? "Connected" : "Not connected"}</span>
                </div>

                {/* API Key input for Hevy */}
                {conn.authType === "apikey" && !conn.connected && (
                  <div className="mt-4 border-t border-edge pt-4">
                    <p className="text-[11px] font-light text-t4">
                      Get your API key at{" "}
                      <a href={conn.keyUrl} target="_blank" rel="noopener noreferrer" className="text-t3 underline underline-offset-4 hover:text-t2">{conn.keyUrl?.replace("https://", "")}</a>
                    </p>
                    <p className="mt-1 text-[10px] text-tm">Requires Hevy Pro subscription</p>
                    <div className="mt-3 flex gap-3">
                      <input
                        type="password"
                        value={hevyKey}
                        onChange={(e) => setHevyKey(e.target.value)}
                        placeholder={conn.keyHint || "Enter API key..."}
                        className="flex-1 rounded-xl border border-edge bg-page px-4 py-2.5 font-mono text-sm font-light text-t1 placeholder-tm outline-none transition-colors focus:border-edge-h"
                      />
                      <button
                        onClick={saveHevyKey}
                        disabled={!hevyKey.trim()}
                        className="shrink-0 rounded-xl bg-btn px-5 py-2.5 text-[12px] font-light tracking-wider text-t2 transition-all hover:bg-btn-h disabled:opacity-30"
                      >
                        {hevyKeySaved ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 border-t border-edge pt-4">
                  <p className="text-[9px] font-medium tracking-[0.2em] text-tm uppercase">Data access</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {conn.scopes.map((s) => <span key={s} className="rounded-full border border-edge px-3 py-1 text-[10px] font-light text-t4">{s}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Account */}
        <section className="mt-14">
          <h2 className="text-[10px] font-medium tracking-[0.25em] text-t4 uppercase">Account</h2>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-edge bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-btn text-sm font-light text-t3">{userEmail ? userEmail[0].toUpperCase() : "U"}</div>
                <div><p className="text-sm font-light text-t2">{userEmail || "User"}</p><p className="text-[11px] font-light text-t4">Signed in</p></div>
              </div>
            </div>
            <div className="rounded-2xl border border-edge bg-card p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-light text-t2">Units</p><p className="text-[11px] font-light text-t4">Display measurements in your preferred system</p></div>
                <div className="flex rounded-lg border border-edge">
                  <button onClick={() => toggleUnits("metric")} className={`px-3 py-1.5 text-[11px] font-light transition-all ${units === "metric" ? "bg-btn-h text-t1" : "text-t4 hover:text-t2"}`}>Metric</button>
                  <button onClick={() => toggleUnits("imperial")} className={`px-3 py-1.5 text-[11px] font-light transition-all ${units === "imperial" ? "bg-btn-h text-t1" : "text-t4 hover:text-t2"}`}>Imperial</button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-edge bg-card p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-light text-t2">Data &amp; Privacy</p><p className="text-[11px] font-light text-t4">Manage your data and export options</p></div>
                <Link href="/privacy" className="text-[11px] font-light tracking-wider text-t4 transition-colors hover:text-t2">View Policy</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mt-14 pb-12">
          <h2 className="text-[10px] font-medium tracking-[0.25em] text-red-500/60 uppercase">Danger Zone</h2>
          <div className="mt-6 rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-5">
            {!deleteConfirm ? (
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-light text-t2">Delete Account</p><p className="text-[11px] font-light text-t4">Permanently delete your account and all associated data</p></div>
                <button onClick={() => setDeleteConfirm(true)} className="rounded-full border border-red-500/20 px-4 py-1.5 text-[11px] font-light tracking-wider text-red-500/70 transition-all hover:border-red-500/40 hover:text-red-500">Delete</button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-light text-red-500">Are you sure? This cannot be undone.</p>
                <p className="mt-1 text-[11px] font-light text-t4">All your data, connections, and cached health data will be permanently deleted.</p>
                <div className="mt-4 flex gap-3">
                  <button onClick={deleteAccount} disabled={deleting} className="rounded-full bg-red-500 px-5 py-2 text-[11px] font-light tracking-wider text-white transition-all hover:bg-red-600 disabled:opacity-50">
                    {deleting ? "Deleting..." : "Yes, delete my account"}
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} className="rounded-full border border-edge px-5 py-2 text-[11px] font-light tracking-wider text-t3 transition-all hover:border-edge-h">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
