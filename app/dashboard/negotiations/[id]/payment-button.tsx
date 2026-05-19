"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentButton({
  negotiationId,
  label,
  mode,
}: {
  negotiationId: string;
  label: string;
  mode: "checkout" | "confirm";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      if (mode === "checkout") {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ negotiationId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        window.location.href = data.url;
      } else {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ negotiationId }),
        });
        if (!res.ok) throw new Error("Confirmation failed");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <button onClick={handleClick} disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
        {loading ? "Processing..." : label}
      </button>
    </div>
  );
}
