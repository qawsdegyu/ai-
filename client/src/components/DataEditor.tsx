import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Database, LayoutGrid, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export default function DataEditor() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sheetName, setSheetName] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 25; // Reduced from 50 to 25 to fix UI hanging/freezing during re-renders

  const { data: sheets = [] } = trpc.inventory.getReferenceSheets.useQuery();
  
  useEffect(() => {
    if (!sheetName && sheets.length > 0) {
      setSheetName(sheets[0]);
    }
  }, [sheets, sheetName]);

  const { data: response, isLoading, refetch, isFetching } = trpc.inventory.getReferenceData.useQuery(
    { sheetName: sheetName || undefined, page, limit, search: search || undefined }, 
    { enabled: !!sheetName, placeholderData: (prev) => prev }
  );

  const records = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateMutation = trpc.inventory.updateReferenceData.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => toast.error(`Failed to update: ${err.message}`)
  });

  const deleteMutation = trpc.inventory.deleteReferenceData.useMutation({
    onSuccess: () => { refetch(); toast.success("Row deleted"); },
    onError: (err) => toast.error(`Failed to delete: ${err.message}`)
  });

  // Calculate dynamic columns based on fullData keys of current page
  const columns = useMemo(() => {
    if (!records.length) return [];
    const keys = new Set<string>();
    records.forEach(r => {
      if (r.fullData && typeof r.fullData === 'object') {
        Object.keys(r.fullData).forEach(k => keys.add(k));
      }
    });
    // Sort columns exactly like Excel: A, B.. Z, AA, AB...
    return Array.from(keys).sort((a, b) => a.length - b.length || a.localeCompare(b));
  }, [records]);

  const handleCellChange = async (id: number, field: string, newValue: string, record: any) => {
    const fullData = { ...(record.fullData || {}) };
    const originalValue = String(fullData[field] || "");
    if (newValue === originalValue) return;
    
    fullData[field] = newValue;
    const promise = updateMutation.mutateAsync({ id, fullData });
    toast.promise(promise, { loading: "Saving...", success: "Saved automatically", error: "Failed to save" });
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] relative">
      <div className="absolute inset-0 bg-[#061124]/40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.1),rgba(255,255,255,0))] rounded-xl pointer-events-none" />
      
      <div className="relative flex justify-between items-center bg-[#0b1527] border border-[#1e293b] px-5 py-4 rounded-xl text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-[#0f172a] p-2.5 rounded-lg border border-[#38bdf8]/20 text-[#38bdf8]">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#e2e8f0] tracking-tight">Imcan Data Grid</h2>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Live Database Connection</p>
          </div>
          
          <div className="h-8 w-px bg-[#1e293b] mx-2" />
          
          <select 
            className="bg-[#0f172a] border border-[#1e293b] text-[#e2e8f0] rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-[#38bdf8] text-sm font-medium cursor-pointer shadow-inner appearance-none pr-8 relative min-w-[200px]"
            value={sheetName}
            onChange={e => { setSheetName(e.target.value); setPage(1); }}
          >
            {sheets.length === 0 && <option value="">No sheets found</option>}
            {sheets.map((src: string) => <option key={src} value={src}>{src}</option>)}
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <Input 
            value={searchInput} 
            onChange={e => setSearchInput(e.target.value)} 
            placeholder="Search in database..." 
            className="h-10 w-64 bg-[#0f172a] border-[#1e293b] text-white placeholder:text-slate-500 focus-visible:ring-[#38bdf8] shadow-inner" 
          />
        </div>
      </div>

      <div className="relative flex-1 bg-[#0b1527] border border-[#1e293b] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col z-10">
        <div className="bg-[#061124] border-b border-[#1e293b] px-4 py-2.5 flex items-center justify-between flex-shrink-0">
           <div className="flex gap-3 items-center">
             <div className="text-xs font-semibold uppercase tracking-wider text-[#38bdf8] bg-[#0f172a] border border-[#38bdf8]/20 px-3 py-1 rounded-md shadow-inner flex items-center gap-2">
               <LayoutGrid size={14} /> Total Rows: {total}
             </div>
             <div className="text-xs font-medium text-slate-400 px-2 py-0.5">
               Autosave is <span className="text-[#22c7a7] font-bold">ON</span>
             </div>
             {isFetching && <div className="text-xs text-[#38bdf8] animate-pulse">Fetching...</div>}
           </div>

           {/* Pagination Controls */}
           <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="mr-2 text-xs">Page {page} of {totalPages || 1}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 bg-[#0f172a] border-[#1e293b] hover:bg-[#1e293b] hover:text-white"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 bg-[#0f172a] border-[#1e293b] hover:bg-[#1e293b] hover:text-white"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
              >
                <ChevronRight size={14} />
              </Button>
           </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#0b1527] custom-scrollbar" style={{ scrollbarColor: '#1e293b #0b1527' }}>
          <table className="w-full border-collapse text-sm whitespace-nowrap bg-[#0b1527]">
            <thead className="sticky top-0 z-20 bg-[#061124] shadow-md">
              <tr>
                <th className="border-b border-r border-[#1e293b] px-4 py-3 font-semibold text-slate-400 w-16 text-center tracking-wide uppercase text-[11px]">#</th>
                {columns.map(col => (
                  <th key={col} className="border-b border-r border-[#1e293b] px-4 py-3 font-semibold text-[#e2e8f0] text-left min-w-[200px] tracking-wide text-[11px] uppercase">{col}</th>
                ))}
                <th className="border-b border-[#1e293b] px-4 py-3 font-semibold text-slate-400 w-20 text-center tracking-wide uppercase text-[11px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#38bdf8]"></div>
                    <div className="mt-3 text-slate-400 text-sm font-medium">Loading deep data matrices...</div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-12 text-center text-slate-400 text-sm font-medium">
                    No data vectors found for the current query.
                  </td>
                </tr>
              ) : (
                records.map((row: any, index: number) => (
                  <tr key={row.id} className="hover:bg-[#0f172a]/60 focus-within:bg-[#0f172a] transition-colors group">
                    <td className="border-b border-r border-[#1e293b] px-3 text-center text-slate-500 bg-[#061124] group-focus-within:bg-[#0b1527] font-mono text-xs">
                      {row.rowIndex || ((page - 1) * limit + index + 1)}
                    </td>
                    {columns.map(col => {
                      const val = (row.fullData && typeof row.fullData === 'object') ? (row.fullData[col] || "") : "";
                      return (
                        <td key={col} className="border-b border-r border-[#1e293b] p-0 relative h-10">
                          <input 
                            key={`${row.id}-${col}`}
                            type="text" 
                            defaultValue={String(val)} 
                            onBlur={(e) => handleCellChange(row.id, col, e.target.value, row)} 
                            className="w-full h-full px-4 outline-none border-2 border-transparent focus:border-[#38bdf8] focus:bg-[#061124] focus:shadow-[inset_0_0_10px_rgba(56,189,248,0.1)] bg-transparent text-[#e2e8f0] placeholder:text-slate-600 transition-all font-medium text-[13px]" 
                          />
                        </td>
                      );
                    })}
                    <td className="border-b border-[#1e293b] p-0 text-center bg-[#061124] group-focus-within:bg-[#0b1527]">
                      <button 
                        type="button" 
                        onClick={() => { if(confirm("Permanently delete this row from the database?")) deleteMutation.mutate({ id: row.id }) }} 
                        className="text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors mx-auto p-2 rounded-lg"
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
