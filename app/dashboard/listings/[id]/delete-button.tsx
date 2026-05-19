"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Remove this listing?")) return;
    setLoading(true);
    await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-danger text-sm">
      {loading ? "Removing..." : "Remove Listing"}
    </button>
  );
}
