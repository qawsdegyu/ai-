import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Folder, FileSpreadsheet, Cloud, CloudOff, RefreshCw, Database } from "lucide-react";
import { toast } from "sonner";

export function OneDriveConnector() {
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const utils = trpc.useUtils();
  
  const status = trpc.onedrive.status.useQuery();
  const files = trpc.onedrive.listFiles.useQuery(
    { folderId: currentFolder },
    { enabled: !!status.data?.connected, refetchInterval: 2000 } // Poll to get syncing updates
  );
  
  const syncFile = trpc.onedrive.syncFile.useMutation({
    onSuccess: () => files.refetch()
  });
  
  const removeSync = trpc.onedrive.removeSync.useMutation({
    onSuccess: () => files.refetch()
  });
  
  const disconnect = trpc.onedrive.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Disconnected from OneDrive");
      utils.onedrive.status.invalidate();
    }
  });

  const handleConnect = () => {
    window.location.href = "/api/auth/microsoft";
  };

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect OneDrive?")) {
      disconnect.mutate();
    }
  };

  const handleNavigate = (folderId: string) => {
    setFolderHistory([...folderHistory, currentFolder || ""]);
    setCurrentFolder(folderId);
  };

  const handleGoBack = () => {
    if (folderHistory.length > 0) {
      const prev = folderHistory[folderHistory.length - 1];
      setFolderHistory(folderHistory.slice(0, -1));
      setCurrentFolder(prev === "" ? undefined : prev);
    }
  };

  const handleSyncFile = (fileId: string, fileName: string) => {
    toast.info(`Started indexing "${fileName}". Please wait...`);
    syncFile.mutate({ fileId, fileName });
  };

  const handleRemoveSync = (fileId: string, fileName: string) => {
    toast.success(`Removed "${fileName}" from AI Context.`);
    removeSync.mutate({ fileId });
  };

  if (status.isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>;
  }

  if (!status.data?.connected) {
    return (
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="bg-blue-50/50 pb-4">
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Cloud className="text-blue-600" /> Microsoft OneDrive
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600 mb-6">
            Connect your Microsoft account to securely sync Excel files directly from your OneDrive or SharePoint into the AI Knowledge Base.
          </p>
          <Button onClick={handleConnect} className="w-full bg-[#0078D4] hover:bg-[#005A9E] text-white">
            <Cloud className="mr-2" size={16} /> Connect Microsoft OneDrive
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-100 shadow-sm">
      <CardHeader className="bg-green-50/50 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-green-900 flex items-center gap-2">
          <Cloud className="text-green-600" /> OneDrive Connected
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-red-600 hover:bg-red-50 hover:text-red-700">
          <CloudOff size={14} className="mr-1" /> Disconnect
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
            {status.data.email}
          </p>
          {folderHistory.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleGoBack}>Back</Button>
          )}
        </div>

        {files.isLoading ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : files.error ? (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded border border-red-100">Failed to load files: {files.error.message}</div>
        ) : (
          <div className="border rounded-md divide-y overflow-hidden">
            {files.data?.map((item: any) => (
              <div key={item.id} className="flex flex-col border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {item.folder ? (
                      <Folder className="text-blue-400 shrink-0" size={18} />
                    ) : (
                      <FileSpreadsheet className="text-green-500 shrink-0" size={18} />
                    )}
                    <span className="text-sm truncate font-medium text-slate-700">{item.name}</span>
                  </div>
                  
                  <div>
                    {item.folder ? (
                      <Button variant="ghost" size="sm" onClick={() => handleNavigate(item.id)}>Open</Button>
                    ) : item.name.toLowerCase().endsWith('.xlsx') || item.name.toLowerCase().endsWith('.xlsm') || item.name.toLowerCase().endsWith('.xls') ? (
                      item.syncStatus === "syncing" || item.syncStatus === "processing" ? (
                        <Button variant="outline" size="sm" disabled className="h-7 text-xs text-orange-600 border-orange-200 bg-orange-50">
                          <Loader2 size={12} className="mr-1 animate-spin" /> {item.syncStatus}
                        </Button>
                      ) : item.syncStatus === "failed" ? (
                        <Button variant="outline" size="sm" onClick={() => handleSyncFile(item.id, item.name)} className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50">
                          <RefreshCw size={12} className="mr-1" /> Retry
                        </Button>
                      ) : item.syncStatus === "active" ? (
                        <Button variant="default" size="sm" onClick={() => handleRemoveSync(item.id, item.name)} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                          <Database size={12} className="mr-1" /> Active
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => handleSyncFile(item.id, item.name)} className="h-7 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">
                          <Database size={12} className="mr-1" /> Use for AI
                        </Button>
                      )
                    ) : (
                      <span className="text-xs text-slate-400 px-2">Unsupported</span>
                    )}
                  </div>
                </div>
                {item.syncStatus && item.syncStatus !== "discovered" && !item.folder && (
                  <div className="px-10 pb-3 -mt-1 flex items-center gap-4 text-[10px] text-slate-500">
                    {item.syncStatus === "active" && (
                      <>
                        <span><strong className="text-slate-700">{item.sheetCount}</strong> sheets</span>
                        <span><strong className="text-slate-700">{item.indexedCells}</strong> cells indexed</span>
                        {item.lastSyncTime && <span>Last sync: {new Date(item.lastSyncTime).toLocaleString()}</span>}
                      </>
                    )}
                    {item.syncStatus === "failed" && item.lastError && (
                      <span className="text-red-500">Error: {item.lastError}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {files.data?.length === 0 && (
              <div className="p-4 text-center text-sm text-slate-500">This folder is empty.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
