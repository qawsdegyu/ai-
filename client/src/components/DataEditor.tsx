import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DataEditor() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sourceType, setSourceType] = useState<string | null>(null);

  const { data: records = [], isLoading, refetch } = trpc.inventory.list.useQuery({ search });

  const sources = useMemo(() => Array.from(new Set(records.map(r => r.source))).filter(Boolean), [records]);

  useEffect(() => {
    if (!sourceType && sources.length > 0) {
      setSourceType(sources[0]);
    }
  }, [sources, sourceType]);

  const updateMutation = trpc.inventory.updateRecord.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => toast.error(`Failed to update: ${err.message}`)
  });

  const addMutation = trpc.inventory.addRecord.useMutation({
    onSuccess: () => { refetch(); toast.success("Row added"); },
    onError: (err) => toast.error(`Failed to add: ${err.message}`)
  });

  const deleteMutation = trpc.inventory.deleteRecord.useMutation({
    onSuccess: () => { refetch(); toast.success("Row deleted"); },
    onError: (err) => toast.error(`Failed to delete: ${err.message}`)
  });

  const handleCellChange = async (id: number, field: string, value: string, originalValue: string) => {
    if (value === originalValue) return;
    const promise = updateMutation.mutateAsync({ id, data: { [field]: value } });
    toast.promise(promise, { loading: "Saving...", success: "Saved automatically", error: "Failed to save" });
  };

  const displayRecords = records.filter(row => row.source === sourceType);

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center bg-[#18553d] px-4 py-3 rounded-lg text-white shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4 text-[#a7f3c6]">
          <FileSpreadsheet size={18} /> 
          <select 
            className="bg-white/10 border border-white/20 text-white rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-[#a7f3c6] text-sm font-semibold"
            value={sourceType || ""}
            onChange={e => setSourceType(e.target.value)}
          >
            {sources.length === 0 && <option value="">No files uploaded</option>}
            {sources.map(src => <option key={src} value={src} className="text-black">{src}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search rows..." 
            className="h-8 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30" 
          />
          <Button size="sm" variant="outline" className="h-8 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white" onClick={() => addMutation.mutate({ source: sourceType || "Reference", routerName: "New Router" })}>
            <Plus size={16} className="mr-1" /> Add Row
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-300 shadow-sm overflow-hidden flex flex-col">
        <div className="bg-[#f3f3f3] border-b border-slate-300 px-3 py-1.5 flex gap-1 flex-shrink-0">
           <div className="text-xs font-mono text-slate-500 bg-white border border-slate-300 px-2 py-0.5 shadow-inner">
             {displayRecords.length} rows
           </div>
           <div className="text-xs font-mono text-slate-500 px-2 py-0.5">
             Autosave is ON
           </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 relative">
          <table className="w-full border-collapse text-sm font-sans whitespace-nowrap bg-white">
            <thead className="sticky top-0 z-10 bg-[#f3f3f3] shadow-sm">
              <tr>
                <th className="border border-slate-300 px-3 py-1.5 font-normal text-slate-600 w-12 text-center bg-[#e6e6e6]">#</th>
                <th className="border border-slate-300 px-3 py-1.5 font-normal text-slate-600 text-left min-w-[200px]">Router Name</th>
                <th className="border border-slate-300 px-3 py-1.5 font-normal text-slate-600 text-left min-w-[120px]">Site ID</th>
                <th className="border border-slate-300 px-3 py-1.5 font-normal text-slate-600 text-left min-w-[150px]">Country</th>
                <th className="border border-slate-300 px-3 py-1.5 font-normal text-slate-600 text-left min-w-[150px]">City</th>
                <th className="border border-slate-300 px-3 py-1.5 font-normal text-slate-600 text-left min-w-[250px]">Location</th>
                <th className="border border-slate-300 px-3 py-1.5 font-normal text-slate-600 text-left min-w-[200px]">Subnet IP</th>
                <th className="border border-slate-300 px-3 py-1.5 font-normal text-slate-600 text-left min-w-[150px]">Circuit Type</th>
                <th className="border border-slate-300 px-3 py-1.5 font-normal text-slate-600 w-12 text-center bg-[#e6e6e6]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">Loading data...</td>
                </tr>
              ) : displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">No records found.</td>
                </tr>
              ) : (
                displayRecords.map((row: any, index: number) => (
                  <tr key={row.id} className="hover:bg-[#f5f9f6] focus-within:bg-[#eaf5ef] transition-colors group">
                    <td className="border border-slate-200 px-2 text-center text-slate-400 bg-[#f9f9f9] group-focus-within:bg-[#e0e0e0]">{index + 1}</td>
                    <td className="border border-slate-200 p-0 relative"><input type="text" defaultValue={row.routerName || ""} onBlur={(e) => handleCellChange(row.id, "routerName", e.target.value, row.routerName || "")} className="w-full h-8 px-2 outline-none border-2 border-transparent focus:border-[#14804a] bg-transparent" /></td>
                    <td className="border border-slate-200 p-0 relative"><input type="text" defaultValue={row.siteId || ""} onBlur={(e) => handleCellChange(row.id, "siteId", e.target.value, row.siteId || "")} className="w-full h-8 px-2 outline-none border-2 border-transparent focus:border-[#14804a] bg-transparent" /></td>
                    <td className="border border-slate-200 p-0 relative"><input type="text" defaultValue={row.country || ""} onBlur={(e) => handleCellChange(row.id, "country", e.target.value, row.country || "")} className="w-full h-8 px-2 outline-none border-2 border-transparent focus:border-[#14804a] bg-transparent" /></td>
                    <td className="border border-slate-200 p-0 relative"><input type="text" defaultValue={row.city || ""} onBlur={(e) => handleCellChange(row.id, "city", e.target.value, row.city || "")} className="w-full h-8 px-2 outline-none border-2 border-transparent focus:border-[#14804a] bg-transparent" /></td>
                    <td className="border border-slate-200 p-0 relative"><input type="text" defaultValue={row.location || ""} onBlur={(e) => handleCellChange(row.id, "location", e.target.value, row.location || "")} className="w-full h-8 px-2 outline-none border-2 border-transparent focus:border-[#14804a] bg-transparent" /></td>
                    <td className="border border-slate-200 p-0 relative"><input type="text" defaultValue={row.subnetIp || ""} onBlur={(e) => handleCellChange(row.id, "subnetIp", e.target.value, row.subnetIp || "")} className="w-full h-8 px-2 outline-none border-2 border-transparent focus:border-[#14804a] bg-transparent" /></td>
                    <td className="border border-slate-200 p-0 relative"><input type="text" defaultValue={row.circuitType || ""} onBlur={(e) => handleCellChange(row.id, "circuitType", e.target.value, row.circuitType || "")} className="w-full h-8 px-2 outline-none border-2 border-transparent focus:border-[#14804a] bg-transparent" /></td>
                    <td className="border border-slate-200 p-0 text-center bg-[#f9f9f9] group-focus-within:bg-[#e0e0e0]">
                      <button type="button" onClick={() => { if(confirm("Delete this row?")) deleteMutation.mutate({ id: row.id }) }} className="text-red-500 hover:text-red-700 mx-auto block p-1">
                        <Trash2 size={15} />
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
