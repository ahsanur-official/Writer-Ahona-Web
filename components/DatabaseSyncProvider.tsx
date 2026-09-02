"use client";

import { useEffect } from "react";
import { initFirebaseSync } from "@/lib/store";

export default function DatabaseSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initFirebaseSync();
  }, []);

  return <>{children}</>;
}
