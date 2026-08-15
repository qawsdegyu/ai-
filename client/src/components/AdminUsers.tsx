import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, ShieldCheck, Users, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminUsers() {
  const authUser = trpc.auth.me.useQuery();
  const users = trpc.admin.users.useQuery();
  const updateRole = trpc.admin.updateRole.useMutation({ onSuccess: () => { toast.success("User role updated"); void users.refetch(); }, onError: error => toast.error(error.message) });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => { toast.success("User deleted successfully"); void users.refetch(); }, onError: error => toast.error(error.message) });
  
  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      setIsDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "user" });
      void users.refetch();
    },
    onError: error => toast.error(error.message)
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "user" as "admin" | "user" });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(newUser);
  };
  
  return <Card className="border-0 shadow-[0_16px_40px_rgba(14,68,48,0.07)]">
    <CardHeader className="flex flex-row items-center justify-between pb-4">
      <div>
        <CardTitle className="flex items-center gap-2 text-xl text-[#123d2c]"><Users className="text-[#14804a]" /> Users & Permissions</CardTitle>
        <p className="mt-1 text-sm text-slate-500">Administrators can assign roles and manage accounts. Every change is recorded in Audit Trail.</p>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-[#14804a] text-white hover:bg-[#126b3e]"><Plus className="mr-2" size={16} /> Add User</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new account and assign permissions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email address</label>
              <Input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Password</label>
              <Input required type="password" minLength={6} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <Select value={newUser.role} onValueChange={role => setNewUser({ ...newUser, role: role as "admin" | "user" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-[#14804a] hover:bg-[#126b3e]" disabled={createUser.isPending}>
              {createUser.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Create User
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </CardHeader>
    <CardContent>
      {users.isLoading ? <div className="flex items-center gap-2 py-8 text-sm text-slate-400"><Loader2 className="animate-spin" size={16} /> Loading users...</div> : users.error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Administrator access is required to manage users.</div> : <div className="space-y-3">
        {(users.data ?? []).map(user => (
          <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e4eee8] bg-[#fbfefc] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf6ef] text-[#14804a]"><ShieldCheck size={18} /></div>
              <div>
                <div className="font-semibold text-[#1c4c38]">{user.name || "Unnamed user"}</div>
                <div className="text-xs text-slate-400">{user.email || "No email"}</div>
                <div className="mt-1 text-[10px] text-slate-400 space-x-2">
                  <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>Last Seen: {new Date(user.lastSignedIn).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={user.role === "admin" ? "bg-[#e7f7ed] text-[#14804a] hover:bg-[#e7f7ed]" : "bg-slate-100 text-slate-600 hover:bg-slate-100"}>{user.role}</Badge>
              <Select value={user.role} onValueChange={role => updateRole.mutate({ userId: user.id, role: role as "admin" | "user" })} disabled={updateRole.isPending || authUser.data?.id === user.id}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="user">user</SelectItem><SelectItem value="admin">admin</SelectItem></SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={deleteUser.isPending || authUser.data?.id === user.id}
                onClick={() => {
                  if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
                    deleteUser.mutate({ userId: user.id });
                  }
                }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>}
    </CardContent>
  </Card>;
}
