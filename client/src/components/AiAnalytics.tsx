import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, User, Download, FileDown, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { toCsv, inventoryToExcelBuffer } from "@shared/export";
import { jsPDF } from "jspdf";

const downloadFile = (content: BlobPart, fileName: string, type: string) => { 
  const url = URL.createObjectURL(new Blob([content], { type })); 
  const anchor = document.createElement("a"); 
  anchor.href = url; 
  anchor.download = fileName; 
  anchor.click(); 
  URL.revokeObjectURL(url); 
};

export default function AiAnalytics() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>("all");
  
  const { data: messages, isLoading } = trpc.admin.aiHistory.useQuery();

  const uniqueUsers = useMemo(() => {
    if (!messages) return [];
    return Array.from(new Set(messages.map(m => m.userEmail).filter(Boolean))) as string[];
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (selectedUser === "all") return messages;
    return messages.filter(m => m.userEmail === selectedUser);
  }, [messages, selectedUser]);

  const handleExportCsv = () => {
    if (!filteredMessages.length) return;
    const data = filteredMessages.map(m => ({
      "Date & Time": new Date(m.createdAt).toLocaleString(),
      "User Name": m.userName || "Unknown",
      "User Email": m.userEmail || "Unknown",
      "Role": m.role === "assistant" ? "AI" : "User",
      "Message Content": m.content
    }));
    downloadFile("\uFEFF" + toCsv(data as any), "ai_analytics.csv", "text/csv;charset=utf-8");
    toast.success("Downloaded CSV report");
  };

  const handleExportExcel = () => {
    if (!filteredMessages.length) return;
    const data = filteredMessages.map(m => ({
      "Date & Time": new Date(m.createdAt).toLocaleString(),
      "User Name": m.userName || "Unknown",
      "User Email": m.userEmail || "Unknown",
      "Role": m.role === "assistant" ? "AI" : "User",
      "Message Content": m.content
    }));
    downloadFile(inventoryToExcelBuffer(data as any), "ai_analytics.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    toast.success("Downloaded Excel report");
  };

  const handleExportPdf = () => {
    if (!filteredMessages.length) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("AI Analytics Report", 14, 20);
    doc.setFontSize(10);
    
    let y = 30;
    filteredMessages.forEach((msg, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`[${new Date(msg.createdAt).toLocaleString()}] ${msg.role === 'assistant' ? 'AI' : (msg.userName || 'User')}:`, 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      
      const lines = doc.splitTextToSize(msg.content, 180);
      doc.text(lines, 14, y);
      y += (lines.length * 5) + 5;
    });

    doc.save("ai_analytics.pdf");
    toast.success("Downloaded PDF report");
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-white shadow-sm">
        <div className="text-center text-red-500 font-semibold">Access Denied. Admins only.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center bg-[#123d2c] p-4 rounded-xl text-white shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 text-[#a7f3c6]">
          <MessageSquare size={18} /> 
          <span className="font-semibold">AI Assistant Analytics</span>
        </div>
      </div>

      <Card className="border-0 shadow-[0_16px_40px_rgba(14,68,48,0.07)] flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-[#123d2c]">Conversation History</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Monitor questions asked by students/users and the AI's responses across the platform.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 border border-slate-100 rounded-lg p-2 bg-slate-50">
              <div className="w-56">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Filter by User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map(email => (
                      <SelectItem key={email} value={email}>{email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={!filteredMessages.length} className="border-[#bde4ca] bg-white text-[#14804a]">
                  <Download size={14} className="mr-1" /> CSV
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={!filteredMessages.length} className="border-[#bde4ca] bg-white text-[#14804a]">
                  <FileDown size={14} className="mr-1" /> Excel
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportPdf} disabled={!filteredMessages.length} className="border-[#bde4ca] bg-white text-[#14804a]">
                  <FileText size={14} className="mr-1" /> PDF
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto bg-slate-50">
          <Table className="bg-white">
            <TableHeader className="sticky top-0 bg-[#fbfefc] shadow-sm z-10">
              <TableRow>
                <TableHead className="w-[150px]">Date & Time</TableHead>
                <TableHead className="w-[180px]">User</TableHead>
                <TableHead className="w-[100px]">Role</TableHead>
                <TableHead>Message Content</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-8 text-slate-400">Loading AI history...</TableCell>
                </TableRow>
              ) : !filteredMessages || filteredMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-8 text-slate-400">No AI conversations found.</TableCell>
                </TableRow>
              ) : (
                filteredMessages.map((msg) => (
                  <TableRow key={msg.id} className="hover:bg-slate-50">
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-700 text-sm">{msg.userName || "Unknown"}</div>
                          <div className="text-xs text-slate-500">{msg.userEmail || ""}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${msg.role === "assistant" ? "bg-[#eaf6ef] text-[#14804a]" : "bg-slate-100 text-slate-600"}`}>
                        {msg.role === "assistant" ? "AI" : "User"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md whitespace-pre-wrap text-sm text-slate-700">
                      {msg.content}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
