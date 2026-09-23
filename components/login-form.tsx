"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", body: formData });
      if (!response.ok) {
        setError("Identifiant ou mot de passe incorrect.");
        setLoading(false);
        return;
      }
      router.replace("/admin/dashboard");
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau puis réessayez.");
      setLoading(false);
    }
  }

  return (
    <form action={submit} className="space-y-5">
      <label className="block text-sm font-medium">Téléphone
        <input name="telephone" required placeholder="+221..." className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
      </label>
      <label className="block text-sm font-medium">Mot de passe
        <input name="password" required type="password" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
      </label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="min-h-12 w-full rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">
        {loading ? "Connexion..." : "Se connecter"}
      </button>
      {process.env.NODE_ENV !== "production" && <p className="text-center text-xs leading-5 text-slate-400">Environnement de développement · utilisez le compte admin local configuré pour ce projet.</p>}
    </form>
  );
}
