import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Login from './components/Login';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [page, setPage] = useState<'donor' | 'admin'>('donor');
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function uploadFile(id: string, file: any) {
    if (!file) return;
    try {
      setUploading(true);
      const newDoc = { id, name: file.name, date: new Date().toLocaleDateString() };
      setDocuments((current) => [...current, newDoc]);
    } catch (reason: any) {
      setServerError(reason.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5] text-[#3d6346]">
        Chargement de l'application...
      </div>
    );
  }

  if (!session) {
    return <Login onAuthenticated={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#19372c] lg:flex">
      <aside className="flex shrink-0 flex-col border-b border-[#e5ebe6] bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="px-5 py-5 lg:px-7 lg:py-8">
          <button type="button" onClick={() => setPage('donor')} className="flex items-center gap-3 text-xl font-bold tracking-tight text-[#3d6346]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff5f0]">🩸</span>
            San'Ou
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-5 pb-4 lg:flex-col lg:overflow-x-visible lg:px-3 lg:pb-6">
          <button onClick={() => setPage('donor')} className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${page === 'donor' ? 'bg-[#eff5f0] text-[#3d6346]' : 'text-[#637d72] hover:bg-[#f7f8f5]'}`}>
            Interface Donneur
          </button>
          <button onClick={() => setPage('admin')} className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${page === 'admin' ? 'bg-[#eff5f0] text-[#3d6346]' : 'text-[#637d72] hover:bg-[#f7f8f5]'}`}>
            Espace Médecin
          </button>
          <button onClick={handleSignOut} className="mt-auto hidden rounded-lg px-4 py-2.5 text-left text-sm font-medium text-[#ad583f] hover:bg-[#fff5f3] lg:block">
            Se déconnecter
          </button>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        {serverError && (
          <div role="alert" className="mt-5 rounded-xl border border-[#efc9b9] bg-[#fffffb] p-4 text-sm text-[#ad583f]">
            {serverError}
          </div>
        )}

        {page === 'donor' ? (
          <div className="mx-auto max-w-[1300px]">
            <header className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-[#19372c] sm:text-3xl">Questionnaire d'Éligibilité au Don de Sang</h1>
              <p className="mt-2 text-sm text-[#637d72]">Veuillez répondre honnêtement aux questions ci-dessous.</p>
            </header>
            <div className="rounded-2xl border border-[#e5ebe6] bg-white p-6 shadow-sm">
              <p className="text-sm text-[#637d72]">Le questionnaire est prêt pour vos donneurs.</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[1300px]">
            <header className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-[#19372c] sm:text-3xl">Espace Médecin</h1>
              <p className="mt-2 text-sm text-[#637d72]">Gestion des dossiers et validation des donneurs.</p>
            </header>
            <div className="rounded-2xl border border-[#e5ebe6] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Uploader un document médical (PDF)</h3>
              <input type="file" accept="application/pdf" disabled={uploading} onChange={(e) => {
                const fileList = e.target.files;
                if (fileList && fileList.length > 0) {
                  uploadFile(Date.now().toString(), fileList[0]);
                }
              }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#eff5f0] file:text-[#3d6346] hover:file:bg-[#e2edd8]" />
              
              <div className="mt-6">
                <h4 className="text-md font-medium mb-2">Documents reçus :</h4>
                {documents.length === 0 ? (
                  <p className="text-sm text-[#637d72]">Aucun document pour le moment.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {documents.map((doc) => (
                      <li key={doc.id} className="py-3 flex justify-between text-sm">
                        <span className="font-medium text-[#19372c]">{doc.name}</span>
                        <span className="text-xs text-gray-400">{doc.date} - Prêt</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
