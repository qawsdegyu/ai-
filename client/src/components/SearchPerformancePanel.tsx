import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Database, Gauge, GitCompareArrows, TimerReset } from "lucide-react";

type SearchPerformancePanelProps = {
  compact?: boolean;
};

const strategyItems = [
  {
    icon: GitCompareArrows,
    title: "Exact match first",
    detail: "Router name → old name → Site ID → text fallback",
    status: "ACTIVE",
  },
  {
    icon: TimerReset,
    title: "Router search cache",
    detail: "5 min TTL · 256 entries · invalidated on data changes",
    status: "ACTIVE",
  },
  {
    icon: Database,
    title: "PostgreSQL indexes",
    detail: "Router, Old Router, Site ID, GIN/trigram search paths",
    status: "5 INDEXES",
  },
];

export default function SearchPerformancePanel({ compact = false }: SearchPerformancePanelProps) {
  return (
    <Card className="border border-[#1e293b] bg-[#071426] text-white shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
      <CardHeader className={compact ? "pb-3" : "pb-4"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base text-[#e2e8f0]">
            <Gauge size={17} className="text-[#38bdf8]" />
            Search Performance
          </CardTitle>
          <Badge className="bg-[#0c2d38] text-[#65d892] hover:bg-[#0c2d38]">
            <CheckCircle2 size={13} className="mr-1" /> Production Ready
          </Badge>
        </div>
        {!compact && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">The search path is optimized to return verified inventory data before invoking the AI model.</p>}
      </CardHeader>
      <CardContent className={compact ? "grid gap-2 pt-0" : "grid gap-3 pt-0 md:grid-cols-3"}>
        {strategyItems.map(({ icon: Icon, title, detail, status }) => (
          <div key={title} className="border border-[#1e293b] bg-[#0b1527] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#d8f3ff]"><Icon size={15} className="text-[#38bdf8]" />{title}</div>
              <span className="font-mono text-[10px] font-bold tracking-wide text-[#65d892]">{status}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
