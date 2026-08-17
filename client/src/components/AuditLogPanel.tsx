import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ClipboardList, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

export default function AuditLogPanel() {
  const [userName, setUserName] = useState("all");
  const [action, setAction] = useState("all");
  const filterInput = useMemo(() => ({ userName: userName === "all" ? undefined : userName, action: action === "all" ? undefined : action }), [userName, action]);
  const logs = trpc.audit.list.useQuery(filterInput);
  const allLogs = trpc.audit.list.useQuery({ limit: 500 });
  const users = Array.from(new Set((allLogs.data ?? []).map(log => log.userName).filter(Boolean))).sort();
  const actions = Array.from(new Set((allLogs.data ?? []).map(log => log.action).filter(Boolean))).sort();

  return <Card className="border-0 shadow-[0_16px_40px_rgba(0, 0, 0, 0.22)]"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg text-[#e2e8f0]"><ClipboardList size={18} className="text-[#22c7a7]" /> Audit Trail</CardTitle><p className="text-sm text-slate-400">Filter imports and administrative changes by user or action.</p></div><Button type="button" size="sm" variant="outline" onClick={() => { void logs.refetch(); void allLogs.refetch(); }}><RefreshCw size={14} className="mr-1" /> Refresh</Button></div><div className="grid gap-3 pt-4 sm:grid-cols-2"><Select value={userName} onValueChange={setUserName}><SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger><SelectContent><SelectItem value="all">All users</SelectItem>{users.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}</SelectContent></Select><Select value={action} onValueChange={setAction}><SelectTrigger><SelectValue placeholder="All actions" /></SelectTrigger><SelectContent><SelectItem value="all">All actions</SelectItem>{actions.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent>{logs.isLoading ? <div className="flex items-center gap-2 py-6 text-sm text-slate-400"><RefreshCw size={16} className="animate-spin" /> Loading audit trail...</div> : logs.error ? <p className="py-6 text-sm text-slate-400">Audit Trail is available to administrators only.</p> : <div className="space-y-3">{(logs.data ?? []).slice(0, 100).map(log => <div key={log.id} className="flex items-start justify-between gap-4 rounded-xl border border-[#17324b] bg-[#091a2d] p-3"><div><div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#d8f3ff]"><Badge className="bg-[#0c2d38] text-[#22c7a7] hover:bg-[#0c2d38]">{log.action}</Badge>{log.userName}</div><p className="mt-1 text-xs text-slate-400">{log.summary}</p></div><time className="whitespace-nowrap text-[11px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</time></div>)}{!logs.data?.length && <p className="py-6 text-sm text-slate-400">No activity matches the selected filters.</p>}</div>}</CardContent></Card>;
}
