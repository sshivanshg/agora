"use client";

import { Button, Card, Input, Select, Stepper, ThemeToggle } from "@agora/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STEPS = ["Welcome", "Provider", "Model"];

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google" },
  { value: "groq", label: "Groq" },
  { value: "ollama", label: "Ollama (local)" },
  { value: "custom", label: "Custom endpoint" },
];

type TestResult = { ok: boolean; latencyMs: number; error?: string } | null;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 2 state
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [saving, setSaving] = useState(false);

  // Check if already set up
  useEffect(() => {
    fetch(`${API_URL}/setup/status`)
      .then((r) => r.json())
      .then((data: { completed: boolean }) => {
        if (data.completed) router.replace("/today");
      })
      .catch(() => {});
  }, [router]);

  const needsBaseUrl = provider === "ollama" || provider === "custom";

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/setup/test-connection`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, apiKey, baseUrl: baseUrl || undefined }),
      });
      const data = (await res.json()) as TestResult;
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, latencyMs: 0, error: "Could not reach API server" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveAndContinue() {
    setSaving(true);
    try {
      await fetch(`${API_URL}/setup/provider-key`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider,
          label: label || `My ${provider} key`,
          apiKey,
          baseUrl: baseUrl || undefined,
        }),
      });
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    await fetch(`${API_URL}/setup/complete`, { method: "POST" });
    router.push("/today");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <Link
            href="/"
            className="font-mono text-sm lowercase tracking-[0.08em] text-[var(--color-fg)]"
          >
            agora
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[480px] flex-1 px-6 py-16">
        <Stepper steps={STEPS} currentIndex={step} className="mb-12" />

        {step === 0 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
                SETUP · 1 OF 3
              </p>
              <h1 className="font-serif text-4xl leading-tight text-[var(--color-fg)]">
                Welcome to Agora.
              </h1>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">
              Agora is a self-hostable platform where AI personas with distinct intellectual
              worldviews debate current topics in structured, fact-checked rounds. It runs entirely
              on your own API keys — no data leaves your instance.
            </p>
            <Button onClick={() => setStep(1)} className="w-full">
              Get started
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
                SETUP · 2 OF 3
              </p>
              <h1 className="font-serif text-4xl leading-tight text-[var(--color-fg)]">
                Bring your own key.
              </h1>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">
              Your API key is encrypted with AES-256-GCM before it touches the database. It never
              leaves this instance in plaintext — not in logs, not in requests, not anywhere.
            </p>

            <Card className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="provider"
                  className="font-mono text-xs uppercase tracking-[0.06em] text-[var(--color-muted)]"
                >
                  Provider
                </label>
                <Select
                  id="provider"
                  options={PROVIDERS}
                  placeholder="Select a provider"
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value);
                    setTestResult(null);
                  }}
                />
              </div>

              {needsBaseUrl && (
                <div className="space-y-2">
                  <label
                    htmlFor="base-url"
                    className="font-mono text-xs uppercase tracking-[0.06em] text-[var(--color-muted)]"
                  >
                    Base URL
                  </label>
                  <Input
                    id="base-url"
                    placeholder="http://localhost:11434"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    mono
                  />
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="api-key"
                  className="font-mono text-xs uppercase tracking-[0.06em] text-[var(--color-muted)]"
                >
                  API Key
                </label>
                <Input
                  id="api-key"
                  variant="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  mono
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="key-label"
                  className="font-mono text-xs uppercase tracking-[0.06em] text-[var(--color-muted)]"
                >
                  Label (optional)
                </label>
                <Input
                  id="key-label"
                  placeholder={provider ? `My ${provider} key` : "My API key"}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </Card>

            {testResult && (
              <div
                className={`rounded-md border px-4 py-3 font-mono text-xs ${
                  testResult.ok
                    ? "border-[oklch(0.72_0.15_145/40%)] bg-[oklch(0.72_0.15_145/10%)] text-[var(--color-success)]"
                    : "border-[oklch(0.65_0.20_25/40%)] bg-[oklch(0.65_0.20_25/10%)] text-[var(--color-danger)]"
                }`}
              >
                {testResult.ok
                  ? `Connection successful · ${testResult.latencyMs}ms`
                  : `Failed: ${testResult.error ?? "Unknown error"}`}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleTest}
                loading={testing}
                disabled={!provider || (!needsBaseUrl && !apiKey) || testing}
                className="flex-1"
              >
                Test connection
              </Button>
              <Button
                onClick={handleSaveAndContinue}
                loading={saving}
                disabled={!testResult?.ok || saving}
                className="flex-1"
              >
                Save and continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
                SETUP · 3 OF 3
              </p>
              <h1 className="font-serif text-4xl leading-tight text-[var(--color-fg)]">
                Choose a default model.
              </h1>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">
              This can be changed later. Each persona can also override the model individually. Skip
              this step to use each provider's recommended default.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleComplete} className="flex-1">
                Skip for now
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                Finish setup
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
