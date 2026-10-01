import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { extractPdf, request, supabase, type Profile, type UpdatedDocument } from "./backend";
import initialIndex from "./document-index.json";
import { sources, type SourceId } from "./data";

type Page = "search" | "sources" | "admin";
const ids = Object.keys(sources) as SourceId[];
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
type Document = { id: SourceId; pages: string[]; href: string; updatedAt?: string; fileName?: string };
const bundledDocuments: Document[] = ids.map((id) => ({ id, pages: initialIndex[id], href: sources[id].href }));

function Icon({ name, size = 19 }: { name: "search" | "book" | "shield" | "file" | "arrow" | "external" | "close" | "user" | "upload" | "pin"; size?: number }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    book: <><path d="M12 6c-2.5-1.8-5.5-2-9-1.5v14c3.5-.5 6.5-.3 9 1.5 2.5-1.8 5.5-2 9-1.5v-14c-3.5-.5-6.5-.3-9 1.5Z" /><path d="M12 6v14" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    file: <><path d="M6 2h8l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" /><path d="M14 2v6h5M8 13h8M8 17h6" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    external: <><path d="M13 5h6v6m0-6-9 9" /><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" /></>,
    close: <path d="M6 6 18 18M18 6 6 18" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4" /></>,
    pin: <><path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function excerpt(text: string, terms: string[]) {
  if (!terms.length) return text.replace(/\s+/g, " ").slice(0, 260);
  const lines = text.split("\n").filter((line) => terms.some((term) => normalize(line).includes(term)));
  return (lines.length ? lines.slice(0, 3).join(" · ") : text).replace(/\s+/g, " ").slice(0, 360);
}

function Login({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) setError("Impossible d’envoyer le lien. Vérifiez votre adresse et réessayez.");
    else setSent(true);
  }
  return <div className="flex min-h-dvh items-center justify-center bg-[#f7f8f5] px-5 py-12"><div className="w-full max-w-[460px] rounded-[28px] border border-[#e4ebe4] bg-white p-7 shadow-[0_25px_80px_rgba(29,68,44,.07)] sm:p-10"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#1e6c51] text-white"><Icon name="shield" size={25} /></div><div className="mt-6"><div className="font-display text-[28px] font-extrabold leading-none tracking-[-.06em] text-[#173d2c]">San'Ou</div><div className="mt-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#779083]">by Dr MICHEL Guerlency</div></div><h1 className="mt-6 font-display text-[29px] font-extrabold tracking-[-.05em] text-[#173b2b]">Bienvenue dans votre espace médecin.</h1><p className="mt-3 text-[13px] leading-relaxed text-[#708175]">Votre adresse e-mail vérifiée est requise pour accéder au référentiel. Un lien de connexion vous sera envoyé.</p>{sent ? <div className="mt-7 rounded-2xl bg-[#eaf4ed] p-5 text-[13px] leading-relaxed text-[#256a45]">Consultez votre messagerie et ouvrez le lien envoyé à <strong>{email}</strong>.<button type="button" onClick={() => setSent(false)} className="mt-3 block font-bold underline">Utiliser une autre adresse</button></div> : <form onSubmit={submit} className="mt-7"><label htmlFor="email" className="text-[12px] font-bold text-[#345343]">Adresse e-mail professionnelle</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="medecin@exemple.be" className="mt-2 w-full rounded-xl border border-[#dce7dc] bg-[#fafbf9] px-4 py-3.5 text-[14px] outline-none focus:border-[#4d9b6c]" />{error && <p role="alert" className="mt-3 text-[12px] text-[#b6513c]">{error}</p>}<button disabled={busy} type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#26734f] px-5 py-3.5 text-[13px] font-bold text-white hover:bg-[#1e5d40] disabled:opacity-60">{busy ? "Envoi en cours…" : "Recevoir mon lien de connexion"}<Icon name="arrow" size={16} /></button></form>}<p className="mt-6 text-[11px] leading-relaxed text-[#97a59a]">Vos données sont enregistrées dans Supabase. Ne saisissez pas de données de patients. <button type="button" onClick={onAuthenticated} className="underline">Actualiser la session</button></p></div></div>;
}

function PostalGate({ session, onSaved }: { session: Session; onSaved: (postal: string) => void }) {
  const [postal, setPostal] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await request<{ postalCode: string }>("/profile", session, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postalCode: postal }) });
      onSaved(result.postalCode);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Enregistrement impossible"); }
    finally { setBusy(false); }
  }
  return <div className="flex min-h-dvh items-center justify-center bg-[#f7f8f5] px-5"><div className="w-full max-w-[460px] rounded-[28px] border border-[#e4ebe4] bg-white p-8 shadow-xl"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f3ea] text-[#287551]"><Icon name="pin" size={24} /></div><h1 className="mt-6 font-display text-[27px] font-extrabold tracking-[-.04em]">Compléter votre accès</h1><p className="mt-3 text-[13px] leading-relaxed text-[#718377]">Indiquez votre code postal pour accéder aux documents. Votre courriel est celui de votre compte vérifié.</p><form onSubmit={submit} className="mt-6"><label htmlFor="postal" className="text-[12px] font-bold">Code postal obligatoire</label><input id="postal" value={postal} onChange={(event) => setPostal(event.target.value)} required minLength={2} maxLength={12} autoComplete="postal-code" placeholder="Ex. 1000" className="mt-2 w-full rounded-xl border border-[#dce7dc] bg-[#fafbf9] px-4 py-3.5 outline-none focus:border-[#4d9b6c]" />{error && <p role="alert" className="mt-3 text-[12px] text-[#b6513c]">{error}</p>}<button disabled={busy} type="submit" className="mt-5 w-full rounded-xl bg-[#26734f] px-5 py-3.5 text-[13px] font-bold text-white disabled:opacity-60">{busy ? "Enregistrement…" : "Enregistrer et accéder"}</button></form><button type="button" onClick={() => supabase.auth.signOut()} className="mt-5 text-[12px] font-medium text-[#7e9283] underline">Changer de compte</button></div></div>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>(bundledDocuments);
  const [documentsReady, setDocumentsReady] = useState(false);
  const [serverError, setServerError] = useState("");
  const [page, setPage] = useState<Page>("search");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SourceId | "all">("all");
  const [limit, setLimit] = useState(8);
  const [doctors, setDoctors] = useState<{ email: string; postalCode: string; createdAt: string }[]>([]);
  const [adminError, setAdminError] = useState("");
  const [uploading, setUploading] = useState<SourceId | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "San'Ou · by Dr MICHEL Guerlency";
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); setDocumentsReady(false); return; }
    let active = true;
    request<Profile>("/me", session).then((result) => { if (active) { setProfile(result); setServerError(""); } }).catch((reason) => { if (active) { setServerError(reason instanceof Error ? reason.message : "Serveur indisponible"); setProfile(null); } });
    return () => { active = false; };
  }, [session?.access_token]);

  useEffect(() => {
    if (!session || !profile?.postalCode) return;
    let active = true;
    setDocumentsReady(false);
    request<{ documents: UpdatedDocument[] }>("/documents", session).then(({ documents: updates }) => {
      if (!active) return;
      setDocuments(bundledDocuments.map((original) => {
        const updated = updates.find((item) => item.id === original.id);
        return updated ? { ...original, pages: updated.pages, updatedAt: updated.updatedAt, fileName: updated.fileName, href: "" } : original;
      }));
      setDocumentsReady(true); setServerError("");
    }).catch((reason) => { if (active) setServerError(reason instanceof Error ? reason.message : "Documents indisponibles"); });
    return () => { active = false; };
  }, [session?.access_token, profile?.postalCode]);

  useEffect(() => {
    if (page !== "admin" || !profile?.admin || !session) return;
    request<{ doctors: typeof doctors }>("/admin/doctors", session).then((result) => { setDoctors(result.doctors); setAdminError(""); }).catch((reason) => setAdminError(reason instanceof Error ? reason.message : "Lecture impossible"));
  }, [page, profile?.admin, session?.access_token]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) { event.preventDefault(); setPage("search"); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const terms = useMemo(() => normalize(query.trim()).split(/\s+/).filter(Boolean), [query]);
  const matches = useMemo(() => documents.flatMap((document) => filter !== "all" && filter !== document.id ? [] : document.pages.flatMap((text, index) => terms.every((term) => normalize(text).includes(term)) ? [{ document, page: index + 1, text }] : [])), [documents, filter, terms]);
  const pageCount = documents.reduce((sum, document) => sum + document.pages.length, 0);

  async function openFile(document: Document, number = 1) {
    if (!session) return;
    try {
      const url = document.updatedAt ? (await request<{ url: string }>(`/documents/${document.id}/file`, session)).url : document.href;
      window.open(`${url}#page=${number}`, "_blank", "noopener,noreferrer");
    } catch (reason) { setServerError(reason instanceof Error ? reason.message : "PDF indisponible"); }
  }

  async function upload(id: SourceId, file?: File) {
    if (!file || !session) return;
    setAdminError(""); setUploading(id);
    try {
      if (file.size > 8_000_000 || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) throw new Error("Choisissez un PDF de 8 Mo maximum.");
      const pages = await extractPdf(file);
      const body = new FormData(); body.append("file", file); body.append("pages", JSON.stringify(pages));
      const updated = await request<UpdatedDocument>(`/admin/documents/${id}`, session, { method: "POST", body });
      setDocuments((current) => current.map((document) => document.id === id ? { ...document, pages: updated.pages, updatedAt: updated.updatedAt, fileName: updated.fileName, href: "" } : document));
    } catch (reason) { setAdminError(reason instanceof Error ? reason.message : "Mise à jour impossible"); }
    finally { setUploading(null); }
  }

  if (loading) return <div className="flex min-h-dvh items-center justify-center text-[#367755]">Chargement de San'Ou…</div>;
  if (!session) return <Login onAuthenticated={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />;
  if (!profile) return <div className="flex min-h-dvh items-center justify-center bg-[#f7f8f5] px-5"><div className="max-w-md rounded-2xl bg-white p-8 text-center"><p className="font-display font-bold">Connexion au service sécurisé…</p>{serverError && <><p role="alert" className="mt-4 text-[13px] text-[#ad583f]">{serverError}. La fonction serveur doit être déployée depuis les paramètres Make.</p><button type="button" onClick={() => supabase.auth.signOut()} className="mt-5 text-[12px] font-bold text-[#26734f] underline">Se déconnecter</button></>}</div></div>;
  if (!profile.postalCode) return <PostalGate session={session} onSaved={(postalCode) => setProfile({ ...profile, postalCode })} />;

  return <div className="min-h-dvh bg-[#f7f8f5] text-[#19372c] lg:flex">
    <aside className="flex shrink-0 flex-col border-b border-[#e5ebe6] bg-white lg:sticky lg:top-0 lg:h-dvh lg:w-[252px] lg:border-b-0 lg:border-r">
      <div className="px-5 py-5 lg:px-7 lg:py-8"><button type="button" onClick={() => setPage("search")} className="flex items-center gap-2.5 text-left"><span className="flex size-10 items-center justify-center rounded-[13px] bg-[#1e6c51] text-white"><Icon name="shield" size={23} /></span><span><span className="block font-display text-[23px] font-extrabold leading-none tracking-[-.06em] text-[#173d2c]">San'Ou</span><span className="mt-1 block text-[9px] font-bold tracking-[.06em] text-[#899b90]">by Dr MICHEL Guerlency</span></span></button></div>
      <nav className="flex gap-2 overflow-x-auto px-5 pb-4 lg:block lg:space-y-1 lg:px-7 lg:pt-7" aria-label="Navigation principale"><button type="button" onClick={() => setPage("search")} className={`side-link shrink-0 ${page === "search" ? "side-link-active" : ""}`}><Icon name="search" size={18} /> Recherche intégrale</button><button type="button" onClick={() => setPage("sources")} className={`side-link shrink-0 ${page === "sources" ? "side-link-active" : ""}`}><Icon name="book" size={18} /> Documents sources</button>{profile.admin && <button type="button" onClick={() => setPage("admin")} className={`side-link shrink-0 ${page === "admin" ? "side-link-active" : ""}`}><Icon name="shield" size={18} /> Administration</button>}</nav>
      <div className="mt-auto hidden px-5 pb-6 lg:block"><div className="rounded-2xl bg-[#eff5f0] p-4"><span className="flex size-8 items-center justify-center rounded-lg bg-white text-[#277453]"><Icon name="shield" size={17} /></span><p className="mt-3 text-[12px] font-bold text-[#244837]">Les documents font référence</p><p className="mt-1 text-[11px] leading-relaxed text-[#6d8375]">Vérifiez les exceptions et le protocole médical en vigueur avant toute décision.</p></div></div>
    </aside>
    <main className="min-w-0 flex-1"><div className="mx-auto max-w-[1300px] px-5 pb-16 sm:px-8 lg:px-12 xl:px-16"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9ede8] py-5"><span className="text-[11px] text-[#87968a]">Espace médecin <span className="mx-2">/</span> <strong className="text-[#365743]">{page === "search" ? "Épidémiologie" : page === "sources" ? "Documents sources" : "Administration"}</strong></span><div className="flex items-center gap-3 text-[11px] text-[#607a68]"><span className="hidden sm:inline">{profile.email}</span><button type="button" onClick={() => supabase.auth.signOut()} className="font-bold underline">Déconnexion</button></div></header>
      {serverError && <p role="alert" className="mt-5 rounded-xl border border-[#efc9b9] bg-[#fff4ef] p-4 text-[12px] text-[#a74f38]">{serverError}</p>}
      {!documentsReady && page !== "admin" ? <div className="py-16 text-center text-[13px] text-[#708175]">Chargement du référentiel sécurisé…</div> : page === "search" ? <>
        <section className="grid gap-7 pb-8 pt-9 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-end lg:pb-10 lg:pt-12"><div><div className="mb-5 inline-flex flex-col rounded-xl border border-[#dce9df] bg-[#edf5ef] px-4 py-2.5"><span className="font-display text-[16px] font-extrabold leading-none tracking-[-.04em] text-[#246947]">San'Ou</span><span className="mt-1 text-[9px] font-bold tracking-[.07em] text-[#779083]">by Dr MICHEL Guerlency</span></div><h1 className="font-display max-w-[900px] text-[37px] font-extrabold leading-[1.13] tracking-[-.055em] text-[#173b2b] sm:text-[46px] xl:text-[52px]">La sécurité du don de sang <span className="text-[#4e8867]">face aux maladies infectieuses</span></h1><p className="mt-5 max-w-[610px] text-[14px] leading-[1.8] text-[#708175]">Recherchez dans le texte intégral des quatre documents, page par page. Les délais, zones et exceptions restent à interpréter dans leur contexte médical.</p></div><div className="hidden rounded-[20px] border border-[#e0ebe3] bg-[#eef5ef] p-5 lg:block"><div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white text-[#26734f]"><Icon name="shield" size={20} /></div><div className="font-display text-[15px] font-bold leading-snug text-[#244b36]">Une décision éclairée commence par une source fiable.</div><p className="mt-2 text-[11px] leading-relaxed text-[#758d7b]">Référentiel et mises à jour épidémiologiques</p></div></section>
        <div className="grid gap-3 sm:grid-cols-3"><div className="stat-card"><span className="stat-icon bg-[#e9f3ec] text-[#3a8a5a]"><Icon name="file" size={18} /></span><div><strong>4</strong><span>documents intégralement indexés</span></div></div><div className="stat-card"><span className="stat-icon bg-[#fcefe9] text-[#cb7855]"><Icon name="book" size={18} /></span><div><strong>{pageCount}</strong><span>pages consultables</span></div></div><div className="stat-card"><span className="stat-icon bg-[#edf0fa] text-[#717eb4]"><Icon name="search" size={18} /></span><div><strong>100 %</strong><span>du texte sélectionnable</span></div></div></div>
        <section className="mt-8 rounded-[22px] border border-[#e6ebe6] bg-white p-5 shadow-[0_7px_28px_rgba(28,55,38,.025)] sm:p-7"><h2 className="mb-4 flex items-center gap-2 font-display text-[16px] font-bold"><Icon name="search" size={18} /> Rechercher dans tous les documents</h2><div className="relative"><Icon name="search" size={20} /><input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setLimit(8); }} type="search" placeholder="Commune, région, maladie, délai, condition…" aria-label="Rechercher dans les quatre documents" className="-mt-[24px] w-full rounded-xl border border-[#dde6de] bg-[#fafbf9] py-4 pl-12 pr-12 text-[14px] outline-none placeholder:text-[#a0ada3] focus:border-[#69a883] focus:ring-4 focus:ring-[#eaf4ec]" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#819187]"><Icon name="close" size={17} /></button>}</div><p className="mt-3 text-[11px] text-[#9aa89e]">Recherche insensible aux accents et à la casse · Plusieurs mots peuvent être saisis</p></section>
        <section className="pt-10"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#819b87]">Texte intégral</div><h2 className="font-display text-[24px] font-extrabold tracking-[-.04em] sm:text-[27px]">{query ? "Résultats de recherche" : "Toutes les pages du référentiel"}</h2></div><span className="rounded-full border border-[#e1e9e1] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#607969]">{matches.length} page{matches.length > 1 ? "s" : ""}</span></div><div className="mb-6 flex gap-2 overflow-x-auto pb-2">{([{ id: "all", title: "Tous les documents" }, ...ids.map((id) => ({ id, title: sources[id].title }))] as { id: SourceId | "all"; title: string }[]).map((item) => <button type="button" key={item.id} onClick={() => { setFilter(item.id); setLimit(8); }} aria-pressed={filter === item.id} className={`shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold ${filter === item.id ? "border-[#2e7954] bg-[#2e7954] text-white" : "border-[#e2e9e2] bg-white text-[#718577] hover:border-[#9cc4a8]"}`}>{item.title}</button>)}</div>
          {matches.length ? <><div className="grid gap-3 xl:grid-cols-2">{matches.slice(0, limit).map(({ document, page: number, text }) => <article key={`${document.id}-${number}`} className="min-w-0 rounded-[20px] border border-[#e5eae8] bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-[.09em] text-[#558165]">{sources[document.id].title}</div><h3 className="mt-1 font-display text-[17px] font-bold text-[#203f2d]">Page {number} <span className="font-normal text-[#9baa9d]">/ {document.pages.length}</span></h3></div><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ec] text-[#3e865c]"><Icon name="file" size={18} /></span></div><p className="mt-4 min-h-[60px] text-[12px] leading-[1.7] text-[#6d8072]">{excerpt(text, terms)}{text.length > 360 ? "…" : ""}</p><details className="mt-4 border-t border-[#edf0ed] pt-4"><summary className="cursor-pointer text-[12px] font-bold text-[#287550]">Lire le texte intégral de cette page</summary><pre className="mt-4 max-h-[440px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#f7f9f6] p-4 font-sans text-[11px] leading-relaxed text-[#3d5647]">{text}</pre></details><button type="button" onClick={() => openFile(document, number)} className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#227253] hover:underline">Voir la page dans le PDF <Icon name="external" size={15} /></button></article>)}</div>{matches.length > limit && <div className="mt-7 text-center"><button type="button" onClick={() => setLimit(limit + 12)} className="rounded-xl border border-[#d7e4d9] bg-white px-5 py-3 text-[12px] font-bold text-[#347251] hover:bg-[#eff6ef]">Afficher plus de pages</button></div>}</> : <div className="rounded-[20px] border border-dashed border-[#d7e3d9] bg-white px-6 py-12 text-center"><h3 className="font-display text-[17px] font-bold">Aucune page ne contient ces mots</h3><p className="mt-2 text-[12px] text-[#788a7e]">Essayez un autre terme ou changez de document.</p><button type="button" onClick={() => { setQuery(""); setFilter("all"); }} className="mt-5 text-[12px] font-bold text-[#2a7850] underline">Effacer les filtres</button></div>}</section>
        <div className="mt-12 rounded-[22px] bg-[#1e4833] p-6 text-white sm:p-7"><h3 className="font-display text-[16px] font-bold">Les documents originaux font référence</h3><p className="mt-2 text-[12px] leading-relaxed text-[#c4d8c9]">La recherche porte sur tout le texte sélectionnable des PDF. La mise en page, les surlignages et les éventuelles images ne sont visibles que dans le PDF. Vérifiez la version et les mises à jour avant toute décision.</p></div>
      </> : page === "sources" ? <section className="pb-16 pt-12"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ebf4ec] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#327858]">Bibliothèque</div><h1 className="font-display text-[38px] font-extrabold tracking-[-.055em] sm:text-[50px]">Documents sources<span className="text-[#d97856]">.</span></h1><p className="mt-3 max-w-[650px] text-[14px] leading-relaxed text-[#748579]">Chaque page de chaque PDF est consultable depuis le moteur de recherche. Les remplacements publiés par l’administrateur prennent effet pour tous les médecins.</p><div className="mt-9 grid gap-4 md:grid-cols-2">{documents.map((document, index) => <button type="button" key={document.id} onClick={() => openFile(document)} className="group flex min-h-[210px] flex-col rounded-[22px] border border-[#e1e9e2] bg-white p-6 text-left transition-all hover:border-[#a8cbb2] hover:shadow-lg"><div className="flex items-start justify-between"><span className={`flex size-12 items-center justify-center rounded-[14px] ${index % 2 ? "bg-[#fbeee9] text-[#ba6e50]" : "bg-[#eaf3ec] text-[#3e865c]"}`}><Icon name="file" size={23} /></span><Icon name="external" size={18} /></div><div className="mt-auto pt-7"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8b9b8e]">PDF · {document.pages.length} page{document.pages.length > 1 ? "s" : ""} · {document.updatedAt ? `Remplacé le ${new Date(document.updatedAt).toLocaleDateString("fr-BE")}` : sources[document.id].date}</span><h2 className="mt-1 font-display text-[18px] font-bold text-[#254532]">{sources[document.id].title}</h2><p className="mt-2 text-[12px] text-[#788b7d]">{document.fileName || sources[document.id].detail}</p></div></button>)}</div></section> : profile.admin ? <section className="pb-16 pt-12"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ebf4ec] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#327858]">Accès administrateur</div><h1 className="font-display text-[38px] font-extrabold tracking-[-.055em] sm:text-[50px]">Administration<span className="text-[#d97856]">.</span></h1><p className="mt-3 max-w-[690px] text-[14px] leading-relaxed text-[#748579]">Remplacez chaque PDF par sa version actualisée. Le nouveau texte est indexé immédiatement et l’ancien document cesse d’être présenté dans l’application. Mise à jour manuelle recommandée chaque semaine.</p>{adminError && <p role="alert" className="mt-5 rounded-xl bg-[#fff0e9] p-4 text-[12px] text-[#b6513c]">{adminError}</p>}<h2 className="mt-10 font-display text-[21px] font-bold">Mettre à jour les documents</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{documents.map((document) => <div key={document.id} className="rounded-[20px] border border-[#e4ebe4] bg-white p-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#eaf3ec] text-[#397b54]"><Icon name="file" size={20} /></span><div><h3 className="text-[13px] font-bold">{sources[document.id].title}</h3><p className="text-[11px] text-[#87988b]">{document.updatedAt ? `Publié le ${new Date(document.updatedAt).toLocaleString("fr-BE")}` : `Original · ${sources[document.id].date}`}</p></div></div><label className={`mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#26734f] px-4 py-2.5 text-[11px] font-bold text-white ${uploading ? "pointer-events-none opacity-60" : "hover:bg-[#1f6043]"}`}><Icon name="upload" size={16} />{uploading === document.id ? "Extraction et envoi…" : "Remplacer par un PDF"}<input type="file" accept="application/pdf,.pdf" disabled={Boolean(uploading)} className="sr-only" onChange={(event) => { void upload(document.id, event.target.files?.[0]); event.target.value = ""; }} /></label></div>)}</div><p className="mt-4 text-[11px] leading-relaxed text-[#819487]">PDF avec texte sélectionnable requis · 8 Mo maximum · Les PDF scannés nécessitent une reconnaissance de caractères (OCR) avant import.</p><h2 className="mt-12 font-display text-[21px] font-bold">Médecins enregistrés <span className="text-[#8da395]">({doctors.length})</span></h2><div className="mt-4 overflow-x-auto rounded-[18px] border border-[#e4ebe4] bg-white"><table className="w-full min-w-[480px] text-left text-[12px]"><thead className="bg-[#eff5f0] text-[#50715a]"><tr><th className="p-4">E-mail</th><th className="p-4">Code postal</th><th className="p-4">Inscription</th></tr></thead><tbody>{doctors.map((doctor) => <tr key={doctor.email} className="border-t border-[#edf1ec]"><td className="p-4">{doctor.email}</td><td className="p-4">{doctor.postalCode}</td><td className="p-4">{new Date(doctor.createdAt).toLocaleDateString("fr-BE")}</td></tr>)}</tbody></table>{!doctors.length && <p className="p-5 text-[12px] text-[#7b8c80]">Aucun profil complet enregistré.</p>}</div><p className="mt-4 text-[11px] leading-relaxed text-[#819487]">Les coordonnées ne sont renvoyées que par l’API réservée à l’administrateur. N’ajoutez aucune donnée de patient.</p></section> : null}
      <footer className="mt-14 flex flex-wrap justify-between gap-2 border-t border-[#e5ebe5] pt-6 text-[10px] text-[#93a197]"><span>© San'Ou · by Dr MICHEL Guerlency</span><span>À usage des médecins du don de sang</span></footer>
    </div></main>
  </div>;
}
