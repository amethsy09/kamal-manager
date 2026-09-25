"use client";

import { useEffect, useState } from "react";

type PushEnrollmentProps = { publicKey: string; token?: string; compact?: boolean };

function decodeKey(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return bytes;
}

export function PushEnrollment({ publicKey, token, compact = false }: PushEnrollmentProps) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(isSupported);
    if (isSupported) {
      navigator.serviceWorker.getRegistration("/").then((registration) => registration?.pushManager.getSubscription()).then((subscription) => setEnabled(Boolean(subscription))).catch(() => {});
    }
  }, []);

  async function manageSubscription() {
    if (!supported || !publicKey) {
      setMessage("Les notifications ne sont pas configurées sur ce site ou cet appareil.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      let subscription = await registration.pushManager.getSubscription();
      if (enabled && subscription) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint, token }) });
        await subscription.unsubscribe();
        setEnabled(false);
        setMessage("Les rappels sont désactivés sur cet appareil.");
      } else {
        const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
        if (permission !== "granted") throw new Error("Autorise les notifications dans les réglages de ton navigateur.");
        subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
        const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: subscription.toJSON(), token }) });
        if (!response.ok) throw new Error("Impossible d’enregistrer cet appareil pour les rappels.");
        setEnabled(true);
        setMessage("Les rappels mensuels sont activés sur cet appareil.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return <section className={`rounded-2xl border border-emerald-100 bg-emerald-50/70 ${compact ? "p-4" : "p-5"}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-semibold text-emerald-950">Rappels mensuels du Kammil</h2><p className="mt-1 text-sm leading-5 text-emerald-900/70">Active les notifications push pour recevoir les rappels sur cet appareil.</p></div>
      <button type="button" onClick={manageSubscription} disabled={busy || !supported || !publicKey} className="min-h-10 shrink-0 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Enregistrement…" : enabled ? "Désactiver les rappels" : "Activer les rappels"}</button>
    </div>
    {message && <p role="status" className="mt-3 text-xs leading-5 text-emerald-900">{message}</p>}
    {!supported && <p className="mt-3 text-xs leading-5 text-amber-800">Cet appareil ou navigateur ne prend pas en charge les notifications push.</p>}
    {!publicKey && <p className="mt-3 text-xs leading-5 text-amber-800">Les clés VAPID doivent être configurées par l’administrateur du site.</p>}
  </section>;
}
