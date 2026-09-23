"use client";
import { useState } from "react";

export function ParticipantConfirmButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    setLoading(true); setError("");
    const response = await fetch(`/api/participant/${token}/confirm`, { method: "POST" });
    if (!response.ok) setError("Impossible de confirmer la lecture.");
    else window.location.reload();
    setLoading(false);
  }
  return <div className="mt-6"><button onClick={confirm} disabled={loading} className="w-full rounded-2xl bg-emerald-700 px-5 py-4 text-lg font-bold text-white shadow-sm disabled:opacity-50">{loading ? "Confirmation..." : "✓ J'ai terminé ma lecture"}</button>{error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}</div>;
}
