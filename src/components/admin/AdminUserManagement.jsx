import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, Plus, Shield, UserCheck, Mail, Edit2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-blue-100 text-blue-700',
};

export default function AdminUserManagement({ currentUser }) {
  const [search, setSearch] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allUsers'] }),
  });

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true); setInviteError(''); setInviteSuccess('');
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      await base44.entities.AuditLog.create({ user_email: currentUser.email, user_name: currentUser.full_name, action: 'create', entity_type: 'User', entity_name: inviteEmail, description: `Invited ${inviteEmail} as ${inviteRole}`, severity: 'info' });
    } catch (e) {
      setInviteError(e.message || 'Failed to send invitation');
    }
    setInviting(false);
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#0ea5e9]" /> Invite New User
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 bg-[#e8ecf1] border-0 shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff] rounded-xl" />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="px-4 py-2 rounded-xl bg-[#e8ecf1] shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff] text-slate-700 border-0 outline-none">
            <option value="user">User (Agent)</option>
            <option value="admin">Admin</option>
          </select>
          <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white rounded-xl border-0 shadow-[4px_4px_8px_#c5c9ce]">
            {inviting ? 'Sending…' : 'Send Invite'}
          </Button>
        </div>
        {inviteSuccess && <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4" />{inviteSuccess}</p>}
        {inviteError && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><X className="w-4 h-4" />{inviteError}</p>}
      </div>

      <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0ea5e9]" /> All Users <Badge className="ml-1 bg-slate-200 text-slate-600">{users.length}</Badge>
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-[#e8ecf1] border-0 shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff] rounded-xl w-56" />
          </div>
        </div>
        {isLoading ? (
          <p className="text-slate-400 text-center py-8">Loading users…</p>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(u => (
              <div key={u.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[#e8ecf1] shadow-[inset_3px_3px_6px_#c5c9ce,inset_-3px_-3px_6px_#ffffff]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">{u.full_name?.[0] || u.email?.[0] || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{u.full_name || 'No name'}</p>
                  <p className="text-sm text-slate-500 truncate flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}>
                    {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                    {u.role || 'user'}
                  </Badge>
                  {u.id !== currentUser?.id && (
                    <button onClick={() => updateRoleMutation.mutate({ id: u.id, role: u.role === 'admin' ? 'user' : 'admin' })} title="Toggle role" className="p-2 rounded-xl text-slate-500 hover:text-[#0ea5e9] hover:shadow-[3px_3px_6px_#c5c9ce,-3px_-3px_6px_#ffffff] transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && <p className="text-slate-400 text-center py-6">No users found</p>}
          </div>
        )}
      </div>
    </div>
  );
}