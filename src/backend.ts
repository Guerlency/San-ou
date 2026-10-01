import { createClient, type Session } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const clientKey = `__sanouSupabase_${projectId}`;
const browserGlobal = globalThis as typeof globalThis & Record<string, ReturnType<typeof createClient> | undefined>;

// Keep one auth client across React remounts and Vite hot updates. A dedicated
// storage key also prevents collisions with Supabase clients owned by the host.
export const supabase = browserGlobal[clientKey] ?? createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  { auth: { storageKey: `sanou-${projectId}-auth-token` } },
);
browserGlobal[clientKey] = supabase;
const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-bcaad37c`;

export async function request<T>(path: string, session: Session, init?: RequestInit): Promise<T> {
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${session.access_token}`, ...(init?.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Erreur du serveur (${response.status})`);
  return payload as T;
}

export type Profile = { email: string; postalCode: string; admin: boolean };
export type UpdatedDocument = { id: string; pages: string[]; fileName: string; updatedAt: string };

export async function extractPdf(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await task.promise;
  try {
    if (pdf.numPages > 300) throw new Error("Ce PDF contient trop de pages (300 maximum).");
    const pages: string[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("").trim());
    }
    if (pages.join("").trim().length < 30) throw new Error("Aucun texte sélectionnable : un PDF scanné doit d’abord être traité par OCR.");
    return pages;
  } finally {
    await task.destroy();
  }
}
