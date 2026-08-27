import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function initializeFirebaseAdmin() {
  if (getApps().length > 0) return getApp();

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

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
    });
  }

  if (!projectId) {
    throw new Error(
      "Firebase Admin não configurado: defina FIREBASE_PROJECT_ID e credenciais padrão da aplicação"
    );
  }

  return initializeApp({ credential: applicationDefault(), projectId });
}

export function getFirebaseAdminAuth() {
  return getAuth(initializeFirebaseAdmin());
}
