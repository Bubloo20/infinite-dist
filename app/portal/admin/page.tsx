"use client";

import { useEffect, useState } from "react";
import { PortalBackdrop } from "@/components/portal/PortalShell";
import LoginGate from "@/components/portal/LoginGate";
import AdminDashboard from "@/components/portal/AdminDashboard";

export default function AdminPage() {
  const [role, setRole] = useState<"worker" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/session")
      .then((r) => r.json())
      .then((d) => setRole(d.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    await fetch("/api/portal/session", { method: "DELETE" });
    setRole(null);
  };

  return (
    <main className="relative min-h-[100svh]">
      <PortalBackdrop />
      {loading ? (
        <div className="relative z-10 grid min-h-[100svh] place-items-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-orchid" />
        </div>
      ) : role !== "admin" ? (
        <LoginGate
          role="admin"
          title="Admin access"
          subtitle="Enter the admin password to view submitted work logs."
          onSuccess={setRole}
        />
      ) : (
        <AdminDashboard onSignOut={signOut} />
      )}
    </main>
  );
}
