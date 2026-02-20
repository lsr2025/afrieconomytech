import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, Store, ClipboardCheck, Users, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#e8ecf1] rounded-2xl shadow-[6px_6px_12px_#c5c9ce,-6px_-6px_12px_#ffffff] p-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-[3px_3px_6px_#c5c9ce]`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminAnalytics() {
  const { data: shops = [] } = useQuery({ queryKey: ['shops'], queryFn: () => base44.entities.Shop.list() });
  const { data: inspections = [] } = useQuery({ queryKey: ['inspections'], queryFn: () => base44.entities.Inspection.list() });
  const { data: agents = [] } = useQuery({ queryKey: ['fieldAgents'], queryFn: () => base44.entities.FieldAgent.list() });
  const { data: auditLogs = [] } = useQuery({ queryKey: ['auditLogs'], queryFn: () => base44.entities.AuditLog.list('-created_date', 50) });

  // Compliance breakdown
  const compliance = ['compliant', 'partially_compliant', 'non_compliant', 'pending'].map(s => ({
    name: s.replace('_', ' '),
    value: shops.filter(sh => sh.compliance_status === s).length,
  }));

  // Municipality breakdown
  const municipalities = ['KwaDukuza', 'Mandeni', 'Ndwedwe', 'Maphumulo'].map(m => ({
    name: m,
    shops: shops.filter(sh => sh.municipality === m).length,
    compliant: shops.filter(sh => sh.municipality === m && sh.compliance_status === 'compliant').length,
  }));

  const fundingReady = shops.filter(s => s.funding_status === 'eligible').length;
  const criticalRisk = shops.filter(s => s.risk_level === 'critical' || s.risk_level === 'high').length;
  const avgScore = shops.length
    ? Math.round(shops.reduce((sum, s) => sum + (s.compliance_score || 0), 0) / shops.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Store} label="Total Shops" value={shops.length} color="from-[#0ea5e9] to-[#3b82f6]" />
        <StatCard icon={ClipboardCheck} label="Inspections" value={inspections.length} color="from-violet-500 to-purple-600" />
        <StatCard icon={CheckCircle2} label="Funding Ready" value={fundingReady} color="from-emerald-500 to-teal-500" />
        <StatCard icon={AlertTriangle} label="High Risk" value={criticalRisk} color="from-red-500 to-rose-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance Pie */}
        <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0ea5e9]" /> Compliance Distribution
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={compliance} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                  {compliance.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {compliance.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-slate-600 capitalize">{c.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Avg Compliance Score</span>
              <span className="font-bold text-slate-800">{avgScore}%</span>
            </div>
          </div>
        </div>

        {/* Municipality Bar Chart */}
        <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0ea5e9]" /> Shops by Municipality
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={municipalities} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#e8ecf1', border: 'none', borderRadius: 12, boxShadow: '4px 4px 8px #c5c9ce' }}
              />
              <Bar dataKey="shops" name="Total" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              <Bar dataKey="compliant" name="Compliant" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#0ea5e9]" /> Recent System Activity
        </h3>
        {auditLogs.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No activity logged yet</p>
        ) : (
          <div className="space-y-2">
            {auditLogs.slice(0, 8).map(log => (
              <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#e8ecf1] shadow-[inset_2px_2px_4px_#c5c9ce,inset_-2px_-2px_4px_#ffffff]">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                  background: log.severity === 'critical' ? '#ef4444' : log.severity === 'warning' ? '#f59e0b' : '#0ea5e9'
                }} />
                <p className="text-sm text-slate-600 flex-1 truncate">{log.description || `${log.action} on ${log.entity_type}`}</p>
                <span className="text-xs text-slate-400 flex-shrink-0">{log.user_email?.split('@')[0]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}