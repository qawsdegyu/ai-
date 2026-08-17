import DashboardLayout from "@/components/DashboardLayout";
import type { Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Activity, Airplay, Archive, ArchiveRestore, BarChart3, Trash2, CheckCircle2, ChevronRight, Download, FileDown, Globe2, MapPin, Plane, Plus, RefreshCw, Search, Server, ShieldCheck, Sparkles, XCircle, FileSpreadsheet } from "lucide-react";
import { migrationReportDocument, migrationReportToRows, type MigrationReportExport } from "@shared/report";
import { shouldDeleteConversation } from "@shared/conversation";
import { isValidReportDateRange, toReportDateRange } from "@shared/reportFilters";
import { reportSuccessMessage } from "@shared/reportNotifications";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

const AIChatBox = lazy(() => import("@/components/AIChatBox").then(module => ({ default: module.AIChatBox })));

const AdminUsers = lazy(() => import("@/components/AdminUsers"));
const DataEditor = lazy(() => import("@/components/DataEditor"));
const AiAnalytics = lazy(() => import("@/components/AiAnalytics"));
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type RecordItem = {
  country: string; city: string; routerName: string; oldRouterName: string; siteId: string;
  subnetIp: string; contactDetails: string; location: string; operationalHours: string;
  proactiveEmailContacts: string; switchName: string; mcsStatus: string; circuitType: string;
  migrationStatus: "Migrated" | "Not Migrated"; source: string;
};

const display = (value?: string) => value?.trim() || "—";
const exportRows = (rows: RecordItem[]) => rows.map(item => ({ "Country": item.country, "City": item.city, "Router Name": item.routerName, "Old Router Name": item.oldRouterName, "Site ID": item.siteId, "Subnet IP": item.subnetIp, "Migration Status": item.migrationStatus, "Circuit Type": item.circuitType, "Contact Details": item.contactDetails, "Location": item.location, "Operational Hours": item.operationalHours, "Proactive Email Contacts": item.proactiveEmailContacts, "Switch Name": item.switchName, "MCS Status": item.mcsStatus }));
const downloadFile = (content: BlobPart, fileName: string, type: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(url); };
const escapeHtml = (value: string) => value.replace(/[&<>\"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" }[character] ?? character));
const reportUi = (language: "ar" | "en") => ({ ...migrationReportDocument(undefined, language), total: language === "ar" ? "الإجمالي" : "Total", migrated: language === "ar" ? "تم الترحيل" : "Migrated", notMigrated: language === "ar" ? "لم يتم الترحيل" : "Not Migrated" });
const downloadMigrationPdf = async (report: MigrationReportExport, language: "ar" | "en") => { const [{ jsPDF }] = await Promise.all([import("jspdf")]); const doc = new jsPDF(); const labels = migrationReportDocument(report, language); doc.setFontSize(18); doc.text(labels.title, 14, 20); doc.setFontSize(11); const rows = labels.rows; rows.forEach((row, index) => doc.text(`${row.Section} | ${row.Metric}: ${row.Value}`, 14, 32 + index * 7)); doc.save(labels.fileName); toast.success(reportSuccessMessage("pdf", language)); };
const openMigrationPrint = (report: MigrationReportExport, language: "ar" | "en") => { const popup = window.open("", "_blank", "width=960,height=760"); if (!popup) return; const labels = migrationReportDocument(report, language); const rows = labels.rows.map(row => `<tr><td>${escapeHtml(row.Section)}</td><td>${escapeHtml(row.Metric)}</td><td>${escapeHtml(row.Value)}</td></tr>`).join(""); popup.document.write(`<!doctype html><html lang="${language}" dir="${language === "ar" ? "rtl" : "ltr"}"><head><title>${escapeHtml(labels.title)}</title><style>body{font-family:Arial,sans-serif;color:#071426;padding:40px}header{border-bottom:4px solid #22c7a7;margin-bottom:24px}h1{margin:0 0 8px}p{color:#52665c}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #cfe4d6;padding:10px;text-align:start}th{background:#0b2633}@media print{.no-print{display:none}body{padding:20px}}</style></head><body><header><h1>${escapeHtml(labels.title)}</h1><p>${escapeHtml(report.summary)}</p></header><table><thead><tr><th>${escapeHtml(labels.section)}</th><th>${escapeHtml(labels.metric)}</th><th>${escapeHtml(labels.value)}</th></tr></thead><tbody>${rows}</tbody></table><button class="no-print" onclick="window.print()">${escapeHtml(labels.print)}</button></body></html>`); popup.document.close(); popup.focus(); toast.success(reportSuccessMessage("print", language)); setTimeout(() => popup.print(), 200); };

function StatCard({ title, value, hint, icon: Icon, accent }: { title: string; value: number; hint: string; icon: typeof Activity; accent: string }) {
  return <Card className="stat-card fd-interactive overflow-hidden border-0 shadow-[0_16px_40px_rgba(14,165,233,0.07)]">
    <CardContent className="relative p-5">
      <div className={`absolute right-0 top-0 h-full w-1 ${accent}`} />
      <div className="mb-5 flex items-start justify-between"><div className="rounded-xl bg-[#0f172a] p-2.5 text-[#38bdf8] border border-[#38bdf8]/20"><Icon size={19} /></div><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Live Telemetry</span></div>
      <div className="text-3xl font-bold tracking-tight text-[#e2e8f0]">{value.toLocaleString()}</div>
      <div className="mt-1 text-sm font-semibold text-slate-300">{title}</div><div className="mt-2 text-xs text-slate-400">{hint}</div>
    </CardContent>
  </Card>;
}

function OverviewSummary({ rows, total, migrated, notMigrated }: { rows: RecordItem[]; total: number; migrated: number; notMigrated: number }) {
  return <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><Card className="fd-interactive border border-[#38bdf8]/20 bg-[#061124] text-white shadow-[0_0_30px_rgba(14,165,233,0.15)] backdrop-blur-md"><CardContent className="p-7"><div className="mb-3 flex items-center gap-2 text-[#38bdf8]"><Activity size={18} /> Flight Navigation Systems</div><h2 className="text-3xl font-bold tracking-tight">Your Cockpit Control Room</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/70">Monitor the current airspace, engage the AI autopilot for deep queries, or navigate routing data instantly.</p><div className="mt-6 grid grid-cols-3 gap-3"><div><div className="text-2xl font-bold text-[#38bdf8]">{total}</div><div className="text-xs text-white/60">Total Waypoints</div></div><div><div className="text-2xl font-bold text-[#38bdf8]">{migrated}</div><div className="text-xs text-white/60">Migrated</div></div><div><div className="text-2xl font-bold text-[#f87171]">{notMigrated}</div><div className="text-xs text-white/60">Awaiting Action</div></div></div></CardContent></Card><Card className="border border-[#1e293b] bg-[#0b1527] shadow-[0_16px_40px_rgba(0,0,0,0.2)]"><CardHeader><CardTitle className="text-lg text-[#e2e8f0]">Quick Maneuvers</CardTitle></CardHeader><CardContent className="grid gap-3"><a href="/search" className="rounded-xl bg-[#0f172a] border border-[#1e293b] p-4 text-sm font-semibold text-[#38bdf8] transition-colors hover:bg-[#1e293b] hover:border-[#38bdf8]/50">Engage Search Radar <ChevronRight className="float-right" size={17} /></a><div className="rounded-xl border border-[#1e293b] bg-[#0b1527] p-4 text-xs text-slate-400">{rows.length} signals currently tracked in the active radar sector.</div></CardContent></Card></div>;
}

function AccessDenied() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center max-w-md text-center p-8 bg-[#0b1527] rounded-xl shadow-[0_16px_40px_rgba(0, 0, 0, 0.22)] border border-red-100">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-5">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-400 mb-8 leading-6">You need administrator privileges to access this page. Only the main Admin can upload files and manage users.</p>
        <a href="/" className="inline-flex h-11 items-center justify-center rounded-lg bg-[#22c7a7] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#126b3e]">Return to Dashboard</a>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState("all");
  const [circuit, setCircuit] = useState("all");
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>();
  const [showArchived, setShowArchived] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "archive" | "delete"; id: number; title: string; isArchived?: boolean } | null>(null);
  const [assistantLanguage, setAssistantLanguage] = useState<"ar" | "en">("en");
  const assistantFocus = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const file = params.get("focusFile") || "";
    const sheet = params.get("focusSheet") || "";
    const cell = params.get("focusCell") || "";
    const row = params.get("focusRow") || "";
    const column = params.get("focusColumn") || "";
    return file || sheet || cell ? { file, sheet, cell, row, column } : null;
  }, []);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const reportLabels = reportUi(assistantLanguage);
  const [location] = useLocation();
  const queryInput = useMemo(() => ({ search, country, city, migrationStatus: status, circuitType: circuit }), [search, country, city, status, circuit]);
  const recordsQueryEnabled = location === "/" || location === "/search";
  const statsQueryEnabled = location === "/" || location === "/analytics";
  const optionsQueryEnabled = location === "/search";
  const records = trpc.inventory.list.useQuery(queryInput, { enabled: recordsQueryEnabled });
  const stats = trpc.inventory.stats.useQuery(undefined, { enabled: statsQueryEnabled });
  const options = trpc.inventory.options.useQuery(undefined, { enabled: optionsQueryEnabled });
  const rows = (records.data ?? []) as RecordItem[];
  const labels = options.data?.labels;
  const aiConversations = trpc.ai.conversations.useQuery({ archivedOnly: showArchived }, { enabled: location === "/assistant" });
  const activeConversation = trpc.ai.conversation.useQuery({ conversationId: activeConversationId ?? 0 }, { enabled: Boolean(activeConversationId) });
  const reportInput = useMemo(() => ({ language: assistantLanguage, ...toReportDateRange(reportFrom, reportTo) }), [assistantLanguage, reportFrom, reportTo]);
  const migrationReport = trpc.report.migration.useQuery(reportInput, { enabled: location === "/analytics" && isValidReportDateRange(reportFrom, reportTo) });
  useEffect(() => {
    if (activeConversation.data) {
      setConversationId(activeConversation.data.conversation.id);
      setAiMessages(activeConversation.data.messages.map(message => ({ role: message.role as "user" | "system" | "assistant", content: message.content })));
    }
  }, [activeConversation.data]);
  const archiveConversation = trpc.ai.archiveConversation.useMutation({ onSuccess: () => void aiConversations.refetch() });
  const deleteConversation = trpc.ai.deleteConversation.useMutation({ onSuccess: () => { setActiveConversationId(undefined); setConversationId(undefined); setAiMessages([]); void aiConversations.refetch(); } });
  const aiAsk = trpc.ai.ask.useMutation({
    onSuccess: result => { setConversationId(result.conversationId); setAiMessages(prev => [...prev, { role: "assistant", content: result.answer }]); void aiConversations.refetch(); },
    onError: error => setAiMessages(prev => [...prev, { role: "assistant", content: `تعذر تنفيذ البحث الذكي: ${error.message}` }]),
  });
  const handleAiSend = (content: string) => {
    setAiMessages(prev => [...prev, { role: "user", content }]);
    let onedriveFileIds: string[] | undefined = undefined;
    try {
      const stored = localStorage.getItem("activeOneDriveFiles");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onedriveFileIds = parsed.map(f => f.id);
        }
      }
    } catch (e) {
      // ignore
    }
    aiAsk.mutate({ question: content, conversationId, language: assistantLanguage, onedriveFileIds });
  };
  const sectionTitle = location === "/analytics" ? "Migration Analytics" : location === "/admin/users" ? "Admin Users" : location === "/assistant" ? "AI Assistant" : location === "/search" ? "Router Search" : "Overview";
  const suggestions = useMemo(() => { const term = search.trim().toLowerCase(); if (term.length < 2) return []; const values = [...(options.data?.routerNames ?? []), ...(options.data?.siteIds ?? []), ...(options.data?.countries ?? []), ...(options.data?.cities ?? []), ...(options.data?.circuitTypes ?? [])]; return Array.from(new Set(values.filter(value => value.toLowerCase().includes(term)))).slice(0, 6); }, [search, options.data]);
  const queryError = records.error || stats.error || options.error;
  const retryAll = () => { void records.refetch(); void stats.refetch(); void options.refetch(); };
  const invalidReportRange = !isValidReportDateRange(reportFrom, reportTo);
  const exportCurrentCsv = async () => { const { toCsv } = await import("@shared/export"); const data = exportRows(rows) as Array<Record<string, string>>; downloadFile("\uFEFF" + toCsv(data), "imcan-filtered-inventory.csv", "text/csv;charset=utf-8"); toast.success(reportSuccessMessage("csv")); };
  const exportCurrentExcel = async () => { const { inventoryToExcelBuffer } = await import("@shared/export"); const buffer = inventoryToExcelBuffer(exportRows(rows) as Array<Record<string, string>>); downloadFile(buffer, "imcan-filtered-inventory.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); toast.success(reportSuccessMessage("excel")); };

  return <DashboardLayout>
    <div className={`${location === "/assistant" ? "h-[calc(100dvh-1rem)] min-h-0 overflow-hidden" : "min-h-screen"} bg-[#020813] text-[#e2e8f0]`}>
      {location === "/" && <header className="aviation-hero relative overflow-hidden px-6 pb-7 pt-6 lg:px-10">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(120deg,transparent_0%,rgba(14,165,233,.1)_47%,transparent_48%),linear-gradient(180deg,transparent_70%,rgba(6,17,36,.8))]" />
        <div className="relative mx-auto max-w-[1500px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="logo-mark"><Plane size={22} /></div><div className="flex items-center gap-2"><div className="text-xl font-bold tracking-tight text-white">Imcan</div><div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#38bdf8]">Team</div></div></div>
            <div className="flex items-center gap-2 rounded-full border border-[#38bdf8]/30 bg-[#061124]/60 px-3 py-2 text-xs font-medium text-[#e2e8f0] backdrop-blur"><Activity size={14} className="text-[#38bdf8]" /> Supersonic Radar Active <span className="status-dot" /></div>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-end"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#38bdf8]"><span className="h-px w-8 bg-[#38bdf8]" /> Command & Control</div><h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-white lg:text-6xl">Data navigation,<br /><span className="text-[#38bdf8]">At Mach Speed.</span></h1><p className="mt-5 max-w-xl text-sm leading-6 text-slate-300">AI-powered technical support for the IMCAN team. Analyze issues, navigate technical data, and get precise troubleshooting guidance in seconds.</p></div><div className="hero-route hidden lg:block"><div className="route-line" /><div className="route-plane"><Plane size={17} /></div><span className="route-label route-a">DEPARTURE</span><span className="route-label route-b">DESTINATION</span></div></div>
        </div>
      </header>}

      <main className="mx-auto max-w-[1500px] space-y-6 px-6 py-7 lg:px-10">
        <Suspense fallback={<div className="flex min-h-[24rem] items-center justify-center rounded-xl border border-[#1e293b] bg-[#0b1527] text-sm text-slate-400">Loading flight systems…</div>}>
        {queryError && <Card className="border border-red-200 bg-red-50"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-red-700"><span>Unable to load the latest inventory data. Please retry.</span><Button variant="outline" onClick={retryAll} className="border-red-200 bg-[#0b1527] text-red-700 hover:bg-red-100">Retry</Button></CardContent></Card>}
        {(location === "/" || location === "/analytics") && <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard title="Total Signals Tracked" value={stats.data?.total ?? 0} hint="Across all active radar sources" icon={Globe2} accent="bg-[#38bdf8]" /><StatCard title="Engaged Routes" value={stats.data?.migrated ?? 0} hint="Matched in primary navigation logs" icon={CheckCircle2} accent="bg-[#0ea5e9]" /><StatCard title="Pending Trajectories" value={stats.data?.notMigrated ?? 0} hint="Awaiting flight plan confirmation" icon={XCircle} accent="bg-[#f87171]" /><StatCard title="Global Sectors" value={stats.data?.countries.length ?? 0} hint="Active operational footprint" icon={BarChart3} accent="bg-[#8b5cf6]" /></section>}


        {location === "/admin/users" ? (user?.role === "admin" ? <AdminUsers /> : <AccessDenied />) : location === "/editor" ? (user?.role === "admin" ? <DataEditor /> : <AccessDenied />) : location === "/assistant" ? <div className="flex h-[calc(100dvh-8rem)] min-h-0 gap-6 flex-col overflow-hidden lg:flex-row"><Card className="w-full lg:w-80 flex-shrink-0 border border-[#1e293b] bg-[#0b1527] shadow-[0_16px_40px_rgba(0,0,0,0.2)] flex flex-col max-h-[300px] lg:max-h-full"><CardHeader className="border-b border-[#1e293b] pb-3"><div className="flex items-center justify-between"><CardTitle className="text-lg text-[#e2e8f0]">Flight Logs</CardTitle><div className="flex gap-1.5"><Button size="icon" variant="outline" className="h-7 w-7 border-[#1e293b] text-[#94a3b8] hover:text-[#38bdf8] hover:bg-[#0f172a]" onClick={() => setShowArchived(value => !value)} title={showArchived ? "View Active" : "View Archived"}>{showArchived ? 
<ArchiveRestore size={14} /> : <Trash2 size={14} />}</Button><Button size="icon" variant="outline" className="h-7 w-7 bg-[#0ea5e9]/10 text-[#38bdf8] border-[#38bdf8]/30 hover:bg-[#0ea5e9]/20" onClick={() => { setConversationId(undefined); setActiveConversationId(undefined); setAiMessages([]); }} title="New Chat"><Plus size={14} /></Button></div></div></CardHeader><CardContent className="flex-1 overflow-y-auto p-4 space-y-2">{aiConversations.isLoading ? <div className="h-10 animate-pulse rounded-lg bg-[#0f172a]" /> : aiConversations.data?.length ? aiConversations.data.map(item => <div key={item.id} className={`group relative rounded-lg border p-3 transition-colors ${activeConversationId === item.id ? "border-[#38bdf8] bg-[#061124]" : "border-transparent hover:bg-[#0f172a]"}`}><button type="button" onClick={() => setActiveConversationId(item.id)} className="w-full text-left text-sm pr-12"><div className="truncate font-medium text-[#e2e8f0]">{item.title}</div><div className="mt-1 text-[11px] text-[#64748b]">{new Date(item.updatedAt).toLocaleString()}{item.archivedAt ? " · Archived" : ""}</div></button><div className={`absolute right-2 top-2 flex flex-col gap-1 ${activeConversationId === item.id ? "opacity-100" : "opacity-0 lg:group-hover:opacity-100"} transition-opacity`}><Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-[#64748b] hover:text-[#38bdf8]" title={item.archivedAt ? "Restore" : "Archive"} onClick={() => setConfirmAction({ type: "archive", id: item.id, title: item.title, isArchived: !!item.archivedAt })}>{item.archivedAt ? <ArchiveRestore size={12} /> : <Archive size={12} />}</Button><Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-950" title="Delete" onClick={() => setConfirmAction({ type: "delete", id: item.id, title: item.title })}><XCircle size={12} /></Button></div></div>) : <p className="text-sm text-center mt-10 text-[#64748b]">No saved logs.</p>}</CardContent></Card><div className="flex-1 flex flex-col bg-[#0b1527] rounded-xl border border-[#1e293b] shadow-[0_0_30px_rgba(14,165,233,0.1)] overflow-hidden"><div className="flex items-center justify-between border-b border-[#1e293b] px-6 py-3 bg-[#061124]"><div className="flex items-center gap-2 text-[#38bdf8] font-semibold"><Sparkles size={18} />{activeConversationId ? aiConversations.data?.find(c => c.id === activeConversationId)?.title || "AI Autopilot" : "Engage AI Autopilot"}</div></div>{assistantFocus && <div className="shrink-0 border-b border-[#38bdf8]/30 bg-[#071c31] px-5 py-3 text-xs text-slate-300"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-semibold text-[#7de7ff]">Answer location</span><span>File: <strong className="text-white">{assistantFocus.file}</strong></span><span>Sheet: <strong className="text-white">{assistantFocus.sheet}</strong></span><span>Cell: <strong className="font-mono text-[#7de7ff]">{assistantFocus.cell}</strong></span><span>Row: <strong className="text-white">{assistantFocus.row || "—"}</strong></span><span>Column: <strong className="text-white">{assistantFocus.column || "—"}</strong></span></div></div>}<div className="flex-1 overflow-hidden relative"><AIChatBox messages={aiMessages} onSendMessage={handleAiSend} isLoading={aiAsk.isPending} height="100%" placeholder="Transmit query to flight computer..." emptyStateMessage="Engage the Flight Deck AI Autopilot" /></div></div></div> : location === "/analytics" ? (user?.role === "admin" ? <AiAnalytics /> : <OverviewSummary rows={rows} total={stats.data?.total ?? 0} migrated={stats.data?.migrated ?? 0} notMigrated={stats.data?.notMigrated ?? 0} />) : location === "/" ? <OverviewSummary rows={rows} total={stats.data?.total ?? 0} migrated={stats.data?.migrated ?? 0} notMigrated={stats.data?.notMigrated ?? 0} /> : <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
          <Card className="border-0 shadow-[0_16px_40px_rgba(0, 0, 0, 0.22)]"><CardHeader className="pb-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-xl text-[#e2e8f0]">{sectionTitle}</CardTitle><p className="mt-1 text-sm text-slate-400">Search by Router Name, site, city, contact, or any keyword.</p></div><div className="flex flex-wrap items-center gap-2"><Badge className="bg-[#0b2633] text-[#22c7a7] hover:bg-[#0b2633]">{rows.length} results</Badge><Button type="button" variant="outline" size="sm" onClick={exportCurrentCsv} disabled={!rows.length} className="border-[#bde4ca] bg-[#0b1527] text-[#22c7a7]"><Download size={14} className="mr-1" />CSV</Button><Button type="button" variant="outline" size="sm" onClick={exportCurrentExcel} disabled={!rows.length} className="border-[#bde4ca] bg-[#0b1527] text-[#22c7a7]"><FileDown size={14} className="mr-1" />Excel</Button>{user?.role === "admin" && <Button type="button" size="sm" onClick={() => window.location.href = "/editor"} className="bg-[#22c7a7] text-white hover:bg-[#0f6037]"><FileSpreadsheet size={14} className="mr-1" />Edit Database</Button>}</div></div><div className="mt-5 flex items-center gap-3 rounded-xl border border-[#dbece2] bg-[#091a2d] px-4 py-1 shadow-inner"><Search size={18} className="text-[#22c7a7]" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search router name, address, contact..." className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" /><kbd className="hidden rounded border bg-[#0b1527] px-2 py-1 text-[10px] text-slate-400 sm:block">⌘ K</kbd></div>{suggestions.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><Sparkles size={14} className="text-[#22c7a7]" /><span className="text-slate-400">Suggestions:</span>{suggestions.map((suggestion, index) => <button type="button" key={`${suggestion}-${index}`} onClick={() => setSearch(suggestion)} className="rounded-full border border-[#bde4ca] bg-[#f3fbf6] px-3 py-1 text-[#22c7a7] transition-colors hover:bg-[#e5f7eb]">{suggestion}</button>)}</div>}<div className="grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-4"><Select value={country} onValueChange={setCountry}><SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger><SelectContent><SelectItem value="all">All Countries</SelectItem>{(options.data?.countries ?? []).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><Select value={city} onValueChange={setCity}><SelectTrigger><SelectValue placeholder="City" /></SelectTrigger><SelectContent><SelectItem value="all">All Cities</SelectItem>{(options.data?.cities ?? []).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue placeholder="Migration Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Migrated">Migrated</SelectItem><SelectItem value="Not Migrated">Not Migrated</SelectItem></SelectContent></Select><Select value={circuit} onValueChange={setCircuit}><SelectTrigger><SelectValue placeholder="Circuit Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Circuit Types</SelectItem>{(options.data?.circuitTypes ?? []).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div></CardHeader><Separator /><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-[#091a2d] hover:bg-[#091a2d]"><TableHead className="pl-6">Router Name</TableHead><TableHead>Country / City</TableHead><TableHead>Site ID</TableHead><TableHead>Migration Status</TableHead><TableHead className="pr-6 text-right">Details</TableHead></TableRow></TableHeader><TableBody>{records.isLoading ? <TableRow><TableCell colSpan={5} className="h-32"><div className="space-y-3 px-6"><div className="h-4 w-2/3 animate-pulse rounded bg-[#0b2633]" /><div className="h-4 w-full animate-pulse rounded bg-[#f1f6f3]" /><div className="h-4 w-5/6 animate-pulse rounded bg-[#f1f6f3]" /><div className="flex items-center gap-2 pt-2 text-xs text-slate-400"><RefreshCw className="animate-spin" size={14} />Refreshing results...</div></div></TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400">No matching records found.</TableCell></TableRow> : rows.slice(0, 100).map((item, index) => <TableRow key={`${item.routerName}-${item.siteId}-${index}`} className="cursor-pointer transition-colors hover:bg-[#10243a]" onClick={() => setSelected(item)}><TableCell className="pl-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-[#0b2633] p-2 text-[#22c7a7]"><Server size={15} /></div><div><div className="font-semibold text-[#d8f3ff]">{display(item.routerName)}</div><div className="max-w-[260px] truncate text-xs text-slate-400">{display(item.oldRouterName)}</div></div></div></TableCell><TableCell><div className="font-medium text-slate-200">{display(item.country)}</div><div className="text-xs text-slate-400">{display(item.city)}</div></TableCell><TableCell className="font-mono text-xs text-slate-400">{display(item.siteId)}</TableCell><TableCell><Badge className={item.migrationStatus === "Migrated" ? "bg-[#0c2d38] text-[#22c7a7] hover:bg-[#0c2d38]" : "bg-[#332a12] text-[#f5c45e] hover:bg-[#332a12]"}>{item.migrationStatus}</Badge></TableCell><TableCell className="pr-6 text-right"><Button variant="ghost" size="icon" className="text-[#22c7a7]"><ChevronRight size={18} /></Button></TableCell></TableRow>)}</TableBody></Table></div>{rows.length > 100 && <div className="border-t px-6 py-3 text-xs text-slate-400">Showing the first 100 results. Refine your search to see a specific site.</div>}</CardContent></Card>

          <div className="space-y-6"><Card className="fd-interactive border-0 bg-[#071426] text-white shadow-[0_16px_40px_rgba(0, 0, 0, 0.28)]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 size={17} className="text-[#7de7ff]" /> Country Distribution</CardTitle></CardHeader><CardContent className="space-y-4">{(stats.data?.countries ?? []).slice(0, 8).map(item => <div key={item.country}><div className="mb-1.5 flex justify-between text-xs"><span className="text-white/75">{item.country}</span><span className="font-semibold text-[#7de7ff]">{item.count}</span></div><div className="h-1.5 rounded-full bg-[#0b1527]/10"><div className="h-1.5 rounded-full bg-[#65d892]" style={{ width: `${Math.max(8, (item.count / Math.max(1, stats.data?.total ?? 1)) * 100)}%` }} /></div></div>)}</CardContent></Card><Card className="border-0 bg-[#0b1527] shadow-[0_16px_40px_rgba(0, 0, 0, 0.22)]"><CardContent className="p-5"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#d8f3ff]"><ShieldCheck size={17} className="text-[#22c7a7]" /> Migration Logic</div><p className="text-sm leading-6 text-slate-400">Status is calculated by comparing <strong>Router Name</strong> between NewInventory and the 2024 Reference Sheet.</p><div className="mt-4 grid gap-2 text-xs"><div className="flex items-center gap-2 rounded-lg bg-[#0c2d38] px-3 py-2 text-[#22c7a7]"><CheckCircle2 size={14} /> Match → Migrated</div><div className="flex items-center gap-2 rounded-lg bg-[#332a12] px-3 py-2 text-[#f5c45e]"><XCircle size={14} /> No match → Not Migrated</div></div></CardContent></Card></div>
        </section>}
              </Suspense>
      </main>
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}><DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-[#17324b] bg-[#0b1527] text-[#e2e8f0] shadow-[0_24px_80px_rgba(0, 0, 0, 0.45)]"><DialogHeader><div className="mb-2 flex items-center gap-2"><Badge className={selected?.migrationStatus === "Migrated" ? "bg-[#0c2d38] text-[#22c7a7] hover:bg-[#0c2d38]" : "bg-[#332a12] text-[#f5c45e] hover:bg-[#332a12]"}>{selected?.migrationStatus}</Badge><span className="text-xs text-slate-400">{selected?.source}</span></div><DialogTitle className="text-2xl text-[#e2e8f0]">{display(selected?.routerName)}</DialogTitle><DialogDescription className="sr-only">Router details and migration information</DialogDescription><p className="flex items-center gap-1 text-sm text-slate-400"><MapPin size={14} /> {display(selected?.city)}, {display(selected?.country)} · {display(selected?.siteId)}</p></DialogHeader>{selected && <div className="mt-3 grid gap-4 sm:grid-cols-2">{[[labels?.contactDetails ?? "Contact Details", selected.contactDetails], [labels?.location ?? "Location", selected.location], [labels?.operationalHours ?? "Operational Hours", selected.operationalHours], [labels?.proactiveEmailContacts ?? "Proactive Email Contacts", selected.proactiveEmailContacts], [labels?.switchName ?? "Switch Name", selected.switchName], [labels?.subnetIp ?? "Subnet IP", selected.subnetIp], [labels?.mcsStatus ?? "MCS Status", selected.mcsStatus], ["Circuit Type", selected.circuitType]].map(([label, value], index) => <div key={`${label}-${index}`} className="rounded-xl border border-[#17324b] bg-[#091a2d] p-4"><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#22c7a7]">{label}</div><div className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{display(value)}</div></div>)}</div>}</DialogContent></Dialog>
    </div>
    
    <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {confirmAction?.type === "delete" ? "Delete Conversation?" : (confirmAction?.isArchived ? "Restore Conversation?" : "Archive Conversation?")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirmAction?.type === "delete" 
              ? `Are you sure you want to permanently delete the conversation "${confirmAction?.title}"? This action cannot be undone.` 
              : (confirmAction?.isArchived 
                  ? `Are you sure you want to restore the conversation "${confirmAction?.title}"?`
                  : `Are you sure you want to archive the conversation "${confirmAction?.title}"? It will be hidden from the active list.`
                )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={confirmAction?.type === "delete" ? "bg-red-600 hover:bg-red-700 focus:ring-red-600" : ""}
            onClick={() => {
              if (confirmAction?.type === "delete") {
                deleteConversation.mutate({ conversationId: confirmAction.id });
              } else if (confirmAction?.type === "archive") {
                archiveConversation.mutate({ conversationId: confirmAction.id, archived: !confirmAction.isArchived });
              }
            }}
          >
            {confirmAction?.type === "delete" ? "Delete" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </DashboardLayout>;
}
