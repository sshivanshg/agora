"use client";
import { Button, Input } from "@agora/ui";
import { useState } from "react";

export default function SettingsPage() {
  const [danger, setDanger] = useState(false);

  return (
    <div className="mx-auto max-w-[640px] px-6 py-12">
      <h1 className="mb-10 text-xl font-semibold text-[var(--color-fg)]">Settings</h1>

      {/* Provider keys */}
      <section className="mb-10">
        <h2 className="mb-1 text-sm font-semibold text-[var(--color-fg)]">API Keys</h2>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          Keys are encrypted at rest using AES-256-GCM. They are never returned in plaintext after
          saving.
        </p>
        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
          {["Anthropic", "OpenAI", "Groq", "Google"].map((provider) => (
            <div key={provider} className="flex items-center gap-3">
              <span className="w-24 shrink-0 font-mono text-xs text-[var(--color-muted)]">
                {provider}
              </span>
              <Input type="password" placeholder={"sk-..."} className="flex-1" />
              <Button variant="ghost" size="sm">
                Save
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Model preference */}
      <section className="mb-10">
        <h2 className="mb-1 text-sm font-semibold text-[var(--color-fg)]">Default Model</h2>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Used when a persona has no model preference set.
        </p>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
          <div className="flex items-center gap-3">
            <Input placeholder="claude-3-5-sonnet-20241022" className="flex-1" />
            <Button variant="ghost" size="sm">
              Save
            </Button>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="mb-1 text-sm font-semibold text-[var(--color-danger)]">Danger zone</h2>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          These actions are permanent and cannot be undone.
        </p>
        <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-5">
          {!danger ? (
            <Button
              variant="ghost"
              onClick={() => setDanger(true)}
              className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            >
              Reset instance
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--color-danger)]">
                This will delete all debates, turns, and provider keys. Are you sure?
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setDanger(false)}>
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                >
                  Yes, reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
