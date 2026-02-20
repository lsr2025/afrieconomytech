import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Search, Download, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

const SEVERITY_STYLES = {
  info: 'bg-blue-50 text-blue-600 border-blue-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  critical: 'bg-red-50 text-red-600 border-red-100',
};
const SEVERITY_ICONS = { info: Info, warning: AlertTriangle, critical: ShieldAlert };
const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  export: 'bg-purple-100 text-purple-700',
  login: 'bg-slate-100 text-slate-600',
  bulk_update: 'bg-orange-100 text-orange-700',
  import: 'bg-teal-100 text-teal-700',
};

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = v => { const s = String(v ?? ''); return s.includes(',') ? `"${s}"` : s; };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

export default function AdminAuditLogs({ currentUser }) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 200),
  });

  const filtered = logs.filter(l => {
    const matchSearch =
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_name?.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    const matchSeverity = severityFilter === 'all' || l.severity === severityFilter;
    return matchSearch && matchAction && matchSeverity;
  });

  const handleExportAudit = () => {
    const rows = filtered.map(l => ({
      date: l.created_date ? format(new Date(l.created_date), 'yyyy-MM-dd HH:mm') : '',
      user: l.user_email,
      action: l.action,
      entity_type: l.entity_type,
      entity_name: l.entity_name || '',
      description: l.description || '',
      severity: l.severity || 'info',
    }));
    const blob = new Blob([toCSV(rows)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0ea5e9]" /> Audit Trail
            <Badge className="bg-slate-200 text-slate-600">{filtered.length}</Badge>
          </h2>
          <button onClick={handleExportAudit} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e8ecf1] shadow-[4px_4px_8px_#c5c9ce,-4px_-4px_8px_#ffffff] text-sm text-slate-700 hover:shadow-[2px_2px_4px_#c5c9ce] transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-[#e8ecf1] border-0 shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff] rounded-xl w-full" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-[#e8ecf1] shadow-[inset_3px_3px_6px_#c5c9ce,inset_-3px_-3px_6px_#ffffff] text-slate-700 border-0 outline-none text-sm">
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="export">Export</option>
            <option value="login">Login</option>
            <option value="import">Import</option>
          </select>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-[#e8ecf1] shadow-[inset_3px_3px_6px_#c5c9ce,inset_-3px_-3px_6px_#ffffff] text-slate-700 border-0 outline-none text-sm">
            <option value="all">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
        {isLoading ? (
          <p className="text-slate-400 text-center py-10">Loading audit logs…</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-center py-10">No audit records found</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map(log => {
              const SevIcon = SEVERITY_ICONS[log.severity || 'info'] || Info;
              const isExpanded = expanded === log.id;
              return (
                <div key={log.id} className={`rounded-2xl border p-4 cursor-pointer transition-all ${SEVERITY_STYLES[log.severity || 'info']}`} onClick={() => setExpanded(isExpanded ? null : log.id)}>
                  <div className="flex items-start gap-3">
                    <SevIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}>{log.action}</Badge>
                        <span className="font-medium text-sm truncate">{log.entity_type}</span>
                        {log.entity_name && <span className="text-xs text-slate-500 truncate">— {log.entity_name}</span>}
                      </div>
                      <p className="text-sm truncate">{log.description || `${log.action} on ${log.entity_type}`}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs opacity-70">
                        <span>{log.user_email}</span>
                        {log.created_date && <span>{format(new Date(log.created_date), 'dd MMM yyyy HH:mm')}</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (log.old_values || log.new_values) && (
                    <div className="mt-3 pt-3 border-t border-current/20 grid grid-cols-2 gap-3">
                      {log.old_values && <div><p className="text-xs font-semibold mb-1">Previous Values</p><pre className="text-xs bg-white/50 rounded-lg p-2 overflow-auto max-h-32">{JSON.stringify(log.old_values, null, 2)}</pre></div>}
                      {log.new_values && <div><p className="text-xs font-semibold mb-1">New Values</p><pre className="text-xs bg-white/50 rounded-lg p-2 overflow-auto max-h-32">{JSON.stringify(log.new_values, null, 2)}</pre></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}