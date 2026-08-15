import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { OneDriveConnector } from "./OneDriveConnector";

export default function ImportCenter() {
  const [_, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState("Reference");
  const [isReading, setIsReading] = useState(false);

  const importMutation = trpc.inventory.importExcel.useMutation({
    onSuccess: (result) => {
      setIsReading(false);
      setFile(null);
      if (result.isRawFile) {
        toast.success(`Successfully uploaded full file '${result.fileName}' for the AI Assistant!`);
      } else {
        toast.success(`Successfully added ${result.count} router records to the database.`);
      }
    },
    onError: (error) => {
      setIsReading(false);
      toast.error(error.message || "Failed to process the file.");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const submitDatabaseFile = async () => {
    if (!file) return toast.error("Choose a file first.");
    setIsReading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const fileBase64 = dataUrl.split(",")[1] ?? "";
        importMutation.mutate({
          fileName: file.name,
          fileBase64,
          sourceType
        });
      };
      reader.onerror = () => {
        setIsReading(false);
        toast.error("Failed to read the file.");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsReading(false);
      toast.error(err.message || "An error occurred.");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start max-w-6xl mx-auto">
      {/* DB Router Records Card */}
      <Card className="border-0 shadow-[0_16px_40px_rgba(20,128,74,0.07)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Database size={120} />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-[#123d2c]">
            <Database className="text-[#14804a]" /> Router Records
          </CardTitle>
          <p className="text-sm text-slate-500">
            Upload Excel files to update the database for the Router Search page. This will only update the system database.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 relative pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-[#14804a]">1. Select Data Type</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger className="border-[#dbece2] bg-[#fbfefc] shadow-inner text-sm h-11">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reference">Reference (Base Inventory)</SelectItem>
                <SelectItem value="NewInventory">New Inventory (Migrated)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-[#14804a]">2. Select File</Label>
            <div className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${file ? "border-[#14804a] bg-[#f3fbf6]" : "border-[#bde4ca] bg-[#fbfefc] hover:bg-[#f3fbf6]"}`}>
              <input type="file" className="absolute inset-0 cursor-pointer opacity-0" accept=".xlsx,.xls,.csv,.xlsm" onChange={handleFileChange} />
              <div className="flex flex-col items-center text-center text-sm">
                <UploadCloud size={32} className={`mb-3 ${file ? "text-[#14804a]" : "text-[#80cda3]"}`} />
                {file ? <div className="font-semibold text-[#14804a]">{file.name}</div> : <div className="font-medium text-slate-500">Click to browse or drag and drop<br /><span className="text-xs text-slate-400 mt-1 block">Supports .xlsx, .xls, .xlsm, .csv</span></div>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="button" onClick={submitDatabaseFile} disabled={isReading || importMutation.isPending || !file} className="w-full h-11 bg-[#14804a] text-white hover:bg-[#0f6037]">
              {isReading || importMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Import into Database</>}
            </Button>
            
            <Button type="button" variant="outline" onClick={() => setLocation("/editor")} className="w-full h-11 border-[#14804a] text-[#14804a] hover:bg-[#f3fbf6]">
              <Database className="mr-2 h-4 w-4" /> Open Data Editor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Knowledge Base (OneDrive) Card */}
      <Card className="border-0 shadow-[0_16px_40px_rgba(26,101,194,0.07)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <FileText size={120} />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-[#0b3366]">
            <FileText className="text-[#1a65c2]" /> AI Knowledge Base
          </CardTitle>
          <p className="text-sm text-slate-500">
            Connect your OneDrive to securely sync Excel files directly into the AI's Knowledge Base. The AI will instantly have access to read and answer from the active files.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 relative pt-4">
          <OneDriveConnector />
        </CardContent>
      </Card>
    </div>
  );
}
