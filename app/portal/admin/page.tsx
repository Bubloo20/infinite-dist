"use client";

import { useEffect, useState } from "react";
import { PortalBackdrop, Loading } from "@/components/portal/PortalShell";
import LoginGate from "@/components/portal/LoginGate";
import AdminDashboard from "@/components/portal/AdminDashboard";
import LoginFlourish from "@/components/portal/LoginFlourish";

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
      <LoginFlourish />
      {loading ? (
        <div className="relative z-10 grid min-h-[100svh] place-items-center">
          <Loading label="Loading" />
        </div>
      ) : role !== "admin" ? (
        <LoginGate mode="admin" onSuccess={setRole} />
      ) : (
        <AdminDashboard onSignOut={signOut} />
      )}
    </main>
  );
}
