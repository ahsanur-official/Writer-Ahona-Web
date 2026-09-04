"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAdminAuth() {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch("/api/admin/session");
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (data.authenticated && active) {
          setAuthorized(true);
        } else if (active) {
          localStorage.removeItem("ahona-admin");
          router.replace("/admin/login");
        }
      } catch {
        if (active) {
          localStorage.removeItem("ahona-admin");
          router.replace("/admin/login");
        }
      }
    }
    check();
    return () => {
      active = false;
    };
  }, [router]);

  return authorized;
}
