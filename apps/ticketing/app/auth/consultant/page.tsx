"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConsultantAuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Missing SSO token.");
      return;
    }
    void fetch("/api/auth/session", { method: "DELETE" })
      .catch(() => undefined)
      .then(() =>
        fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }),
      )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to establish session");
        const next = searchParams.get("next");
        router.replace(next && next.startsWith("/") ? next : "/dashboard");
      })
      .catch(() => setError("Could not sign you in from TBOS. Try logging in manually."));
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">
      {error || "Signing you in from TBOS…"}
    </div>
  );
}
