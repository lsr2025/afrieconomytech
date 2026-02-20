import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Store, Search, Filter, Trash2, CheckSquare, Square, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STATUS_COLORS = {
  compliant: 'bg-emerald-100 text-emerald-700',
  partially_compliant: 'bg-amber-100 text-amber-700',
  non_compliant: 'bg-red-100 text-red-700',
  pending: 'bg-slate-100 text-slate-600',
};

export default function AdminShopManagement({ currentUser }) {
  const [search, setSearch] = useState('');
  const [municipalityFilter, setMunicipalityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('pending');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState('');
  const queryClient = useQueryClient();

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.Shop.delete(id);
      }
    },
    onSuccess: async (_, ids) => {
      await base44.entities.AuditLog.create({
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        action: 'delete',
        entity_type: 'Shop',
        description: `Bulk deleted ${ids.length} shop(s)`,
        severity: 'critical',
      });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      setSelected([]);
    },
  });

  const handleBulkStatusUpdate = async () => {
    if (!selected.length) return;
    setBulkLoading(true);
    for (const id of selected) {
      await base44.entities.Shop.update(id, { compliance_status: bulkStatus });
    }
    await base44.entities.AuditLog.create({
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      action: 'bulk_update',
      entity_type: 'Shop',
      description: `Bulk updated ${selected.length} shop(s) to compliance_status="${bulkStatus}"`,
      severity: 'warning',
    });
    queryClient.invalidateQueries({ queryKey: ['shops'] });
    setBulkResult(`Updated ${selected.length} shops to "${bulkStatus}"`);
    setSelected([]);
    setBulkLoading(false);
  };

  const filtered = shops.filter(s => {
    const matchSearch =
      s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.ward?.toLowerCase().includes(search.toLowerCase());
    const matchMun = municipalityFilter === 'all' || s.municipality === municipalityFilter;
    const matchStatus = statusFilter === 'all' || s.compliance_status === statusFilter;
    return matchSearch && matchMun && matchStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every(s => selected.includes(s.id));

  const toggleAll = () => {
    setSelected(allSelected ? [] : filtered.map(s => s.id));
  };

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <div className="bg-[#e8ecf1] rounded-2xl shadow-[6px_6px_12px_#c5c9ce,-6px_-6px_12px_#ffffff] p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">{selected.length} selected</span>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#e8ecf1] shadow-[inset_3px_3px_6px_#c5c9ce,inset_-3px_-3px_6px_#ffffff] text-slate-700 border-0 outline-none text-sm"
            >
              <option value="pending">Set → Pending</option>
              <option value="compliant">Set → Compliant</option>
              <option value="partially_compliant">Set → Partial</option>
              <option value="non_compliant">Set → Non-Compliant</option>
            </select>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={bulkLoading}
              size="sm"
              className="bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white border-0 rounded-lg gap-1"
            >
              {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Apply
            </Button>
            <Button
              onClick={() => {
                if (confirm(`Delete ${selected.length} shop(s)? This cannot be undone.`)) {
                  deleteMutation.mutate(selected);
                }
              }}
              size="sm"
              variant="outline"
              className="text-red-500 border-red-200 rounded-lg gap-1"
            >
              <Trash2 className="w-3 h-3" /> Delete Selected
            </Button>
          </div>
        </div>
      )}

      {bulkResult && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
          ✓ {bulkResult}
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#0ea5e9]" /> Shop Data Management
            <Badge className="bg-slate-200 text-slate-600">{filtered.length}</Badge>
          </h2>
          <div className="ml-auto flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search shops…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-[#e8ecf1] border-0 shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff] rounded-xl w-44"
              />
            </div>
            <select
              value={municipalityFilter}
              onChange={e => setMunicipalityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#e8ecf1] shadow-[inset_3px_3px_6px_#c5c9ce,inset_-3px_-3px_6px_#ffffff] text-slate-700 border-0 outline-none text-sm"
            >
              <option value="all">All Municipalities</option>
              <option value="KwaDukuza">KwaDukuza</option>
              <option value="Mandeni">Mandeni</option>
              <option value="Ndwedwe">Ndwedwe</option>
              <option value="Maphumulo">Maphumulo</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#e8ecf1] shadow-[inset_3px_3px_6px_#c5c9ce,inset_-3px_-3px_6px_#ffffff] text-slate-700 border-0 outline-none text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="partially_compliant">Partial</option>
              <option value="non_compliant">Non-Compliant</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-slate-400 text-center py-10">Loading shops…</p>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {/* Select All */}
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#e8ecf1] shadow-[inset_2px_2px_4px_#c5c9ce,inset_-2px_-2px_4px_#ffffff] cursor-pointer"
              onClick={toggleAll}
            >
              {allSelected ? <CheckSquare className="w-4 h-4 text-[#0ea5e9]" /> : <Square className="w-4 h-4 text-slate-400" />}
              <span className="text-sm text-slate-500">Select all visible ({filtered.length})</span>
            </div>

            {filtered.map(shop => (
              <div
                key={shop.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                  selected.includes(shop.id)
                    ? 'bg-[#e8ecf1] shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff]'
                    : 'bg-[#e8ecf1] shadow-[3px_3px_6px_#c5c9ce,-3px_-3px_6px_#ffffff]'
                }`}
                onClick={() => toggleOne(shop.id)}
              >
                {selected.includes(shop.id)
                  ? <CheckSquare className="w-4 h-4 text-[#0ea5e9] flex-shrink-0" />
                  : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{shop.shop_name}</p>
                  <p className="text-xs text-slate-500 truncate">{shop.owner_name} · {shop.municipality || 'Unknown'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`text-xs ${STATUS_COLORS[shop.compliance_status] || 'bg-slate-100 text-slate-600'}`}>
                    {shop.compliance_status || 'pending'}
                  </Badge>
                  {(shop.risk_level === 'high' || shop.risk_level === 'critical') && (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="text-slate-400 text-center py-8">No shops match filters</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}