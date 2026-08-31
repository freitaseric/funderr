import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export function getFirebaseAdminApp() {
  if (getApps().length > 0) return getApp();

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (serviceAccountJson) {
    let serviceAccount: Record<string, string>;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON não contém um JSON válido");
    }
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
      storageBucket,
    });
  }

  if (!projectId) {
    throw new Error(
      "Firebase Admin não configurado: defina FIREBASE_PROJECT_ID e credenciais padrão da aplicação"
    );
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket,
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}
