"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ticketingFetch } from "@/lib/ticketing-fetch";
import { UserAvatar } from "@/components/UserAvatar";

export default function PortalProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void ticketingFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        const me = data.data as { name?: string; email?: string; profilePhotoUrl?: string | null };
        setName(String(me.name ?? ""));
        setEmail(String(me.email ?? ""));
        setPhotoUrl(me.profilePhotoUrl ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await ticketingFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), profilePhotoUrl: photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await ticketingFetch("/api/profile/photo", { method: "POST", body: formData });
      const json = await res.json();
      const url = json.data && typeof json.data.url === "string" ? json.data.url : "";
      if (!res.ok || !url) throw new Error((json as { error?: string }).error || "Upload failed");
      setPhotoUrl(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your support portal account details.</p>
      </div>
      <form onSubmit={(e) => void save(e)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <UserAvatar name={name} email={email} photoUrl={photoUrl} size="md" />
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPhoto(e.target.files?.[0])} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            >
              Upload photo
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={email} readOnly />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
