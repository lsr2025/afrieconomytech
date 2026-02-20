import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, FileSpreadsheet, FileText, Filter, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

function flattenShop(s) {
  return {
    id: s.id,
    shop_name: s.shop_name,
    owner_name: s.owner_name,
    owner_nationality: s.owner_nationality || '',
    owner_gender: s.owner_gender || '',
    owner_age_group: s.owner_age_group || '',
    phone_number: s.phone_number || '',
    physical_address: s.physical_address || '',
    ward: s.ward || '',
    municipality: s.municipality || '',
    gps_latitude: s.gps_latitude || '',
    gps_longitude: s.gps_longitude || '',
    is_cipc_registered: s.is_cipc_registered ? 'Yes' : 'No',
    cipc_number: s.cipc_number || '',
    has_coa: s.has_coa ? 'Yes' : 'No',
    coa_number: s.coa_number || '',
    coa_expiry: s.coa_expiry || '',
    structure_type: s.structure_type || '',
    shop_size: s.shop_size || '',
    years_operating: s.years_operating || '',
    monthly_turnover: s.monthly_turnover || '',
    num_employees: s.num_employees || 0,
    compliance_status: s.compliance_status || '',
    compliance_score: s.compliance_score || '',
    funding_status: s.funding_status || '',
    risk_level: s.risk_level || '',
    last_inspection_date: s.last_inspection_date || '',
    consent_given: s.consent_given ? 'Yes' : 'No',
    created_date: s.created_date ? format(new Date(s.created_date), 'yyyy-MM-dd') : '',
  };
}

function flattenInspection(i) {
  return {
    id: i.id,
    shop_id: i.shop_id,
    inspection_type: i.inspection_type || '',
    inspector_name: i.inspector_name || '',
    inspector_email: i.inspector_email || '',
    check_in_time: i.check_in_time ? format(new Date(i.check_in_time), 'yyyy-MM-dd HH:mm') : '',
    check_out_time: i.check_out_time ? format(new Date(i.check_out_time), 'yyyy-MM-dd HH:mm') : '',
    total_score: i.total_score || '',
    status: i.status || '',
    hygiene_handwashing: i.hygiene_handwashing || '',
    coldchain_fridge_temp: i.coldchain_fridge_temp || '',
    waste_disposal: i.waste_disposal || '',
    water_supply: i.water_supply || '',
    inventory_expired_count: i.inventory_expired_count || 0,
    risk_flags: Array.isArray(i.risk_flags) ? i.risk_flags.join('; ') : '',
    ehp_verified: i.ehp_verified ? 'Yes' : 'No',
    created_date: i.created_date ? format(new Date(i.created_date), 'yyyy-MM-dd') : '',
  };
}

function flattenAttendance(a) {
  return {
    id: a.id,
    agent_name: a.agent_name || '',
    agent_email: a.agent_email || '',
    date: a.date || '',
    check_in_time: a.check_in_time ? format(new Date(a.check_in_time), 'yyyy-MM-dd HH:mm') : '',
    check_out_time: a.check_out_time ? format(new Date(a.check_out_time), 'yyyy-MM-dd HH:mm') : '',
    municipality: a.municipality || '',
    ward: a.ward || '',
    activity_type: a.activity_type || '',
    shops_profiled: a.shops_profiled || 0,
    inspections_completed: a.inspections_completed || 0,
    hours_worked: a.hours_worked || '',
    status: a.status || '',
    notes: a.notes || '',
  };
}

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const EXPORT_OPTIONS = [
  { key: 'shops', label: 'Shops / Shop Profiles', icon: FileSpreadsheet, description: 'All shop data with compliance & funding status', color: 'from-emerald-500 to-teal-500' },
  { key: 'inspections', label: 'Inspections', icon: FileText, description: 'All inspection records with scores and risk flags', color: 'from-blue-500 to-indigo-500' },
  { key: 'attendance', label: 'Attendance Records', icon: FileSpreadsheet, description: 'Field agent attendance, check-ins and activities', color: 'from-violet-500 to-purple-500' },
  { key: 'funding', label: 'Funding Eligible Shops', icon: FileText, description: 'Shops meeting NEF funding eligibility criteria', color: 'from-amber-500 to-orange-500' },
  { key: 'non_compliant', label: 'Non-Compliant Shops', icon: FileText, description: 'Shops requiring urgent compliance attention', color: 'from-red-500 to-rose-500' },
];

export default function AdminDataExport({ currentUser }) {
  const [filters, setFilters] = useState({ municipality: 'all', status: 'all', dateFrom: '', dateTo: '' });
  const [exporting, setExporting] = useState(null);
  const [lastExported, setLastExported] = useState(null);

  const { data: shops = [] } = useQuery({ queryKey: ['shops'], queryFn: () => base44.entities.Shop.list() });
  const { data: inspections = [] } = useQuery({ queryKey: ['inspections'], queryFn: () => base44.entities.Inspection.list() });
  const { data: attendance = [] } = useQuery({ queryKey: ['attendance'], queryFn: () => base44.entities.Attendance.list() });

  const handleExport = async (key) => {
    setExporting(key);
    const today = format(new Date(), 'yyyy-MM-dd');

    let rows = [];
    let filename = '';

    // Apply municipality filter
    const filterByMunicipality = (arr) =>
      filters.municipality === 'all' ? arr : arr.filter(s => s.municipality === filters.municipality);

    if (key === 'shops') {
      let data = filterByMunicipality(shops);
      if (filters.status !== 'all') data = data.filter(s => s.compliance_status === filters.status);
      rows = data.map(flattenShop);
      filename = `shops_export_${today}.csv`;
    } else if (key === 'inspections') {
      rows = inspections.map(flattenInspection);
      filename = `inspections_export_${today}.csv`;
    } else if (key === 'attendance') {
      let data = filters.municipality !== 'all' ? attendance.filter(a => a.municipality === filters.municipality) : attendance;
      rows = data.map(flattenAttendance);
      filename = `attendance_export_${today}.csv`;
    } else if (key === 'funding') {
      const data = filterByMunicipality(shops).filter(s => s.funding_status === 'eligible');
      rows = data.map(flattenShop);
      filename = `funding_eligible_${today}.csv`;
    } else if (key === 'non_compliant') {
      const data = filterByMunicipality(shops).filter(s => s.compliance_status === 'non_compliant' || s.risk_level === 'critical');
      rows = data.map(flattenShop);
      filename = `non_compliant_shops_${today}.csv`;
    }

    if (rows.length === 0) {
      alert('No records match the current filters.');
      setExporting(null);
      return;
    }

    const csv = toCSV(rows);
    downloadCSV(csv, filename);

    // Audit log
    await base44.entities.AuditLog.create({
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      action: 'export',
      entity_type: key,
      description: `Exported ${rows.length} ${key} records to CSV`,
      severity: 'info',
    });

    setLastExported({ key, count: rows.length, filename });
    setExporting(null);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#0ea5e9]" /> Export Filters
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Municipality</label>
            <select
              value={filters.municipality}
              onChange={e => setFilters(f => ({ ...f, municipality: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[#e8ecf1] shadow-[inset_3px_3px_6px_#c5c9ce,inset_-3px_-3px_6px_#ffffff] text-slate-700 border-0 outline-none text-sm"
            >
              <option value="all">All Municipalities</option>
              <option value="KwaDukuza">KwaDukuza</option>
              <option value="Mandeni">Mandeni</option>
              <option value="Ndwedwe">Ndwedwe</option>
              <option value="Maphumulo">Maphumulo</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Compliance Status</label>
            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-[#e8ecf1] shadow-[inset_3px_3px_6px_#c5c9ce,inset_-3px_-3px_6px_#ffffff] text-slate-700 border-0 outline-none text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="partially_compliant">Partially Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {lastExported && (
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Exported <strong>{lastExported.count}</strong> records → <code className="text-xs bg-emerald-100 px-1 rounded">{lastExported.filename}</code></span>
        </div>
      )}

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORT_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isExporting = exporting === opt.key;
          return (
            <div key={opt.key} className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center shadow-[3px_3px_6px_#c5c9ce]`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-slate-100 text-slate-500 text-xs">CSV</Badge>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{opt.label}</h3>
              <p className="text-sm text-slate-500 mb-4">{opt.description}</p>
              <Button
                onClick={() => handleExport(opt.key)}
                disabled={isExporting}
                className="w-full bg-[#e8ecf1] text-slate-700 border-0 shadow-[4px_4px_8px_#c5c9ce,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#c5c9ce,-2px_-2px_4px_#ffffff] rounded-xl transition-all gap-2"
              >
                {isExporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</> : <><Download className="w-4 h-4" /> Export CSV</>}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">All exports are logged in the audit trail for POPIA compliance.</p>
    </div>
  );
}