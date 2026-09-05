import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import config from "@/firebase-applet-config.json";

let serverApp: FirebaseApp | null = null;
let serverDb: Firestore | null = null;

export function getServerFirestore(): Firestore {
  if (!serverDb) {
    serverApp = getApps().length ? getApp() : initializeApp(config);
    serverDb = getFirestore(serverApp, config.firestoreDatabaseId || "(default)");
  }
  return serverDb;
}
