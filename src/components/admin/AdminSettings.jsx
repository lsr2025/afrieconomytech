import React, { useState } from 'react';
import { Settings, Shield, Database, Bell, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SECTIONS = [
  {
    key: 'general', label: 'General', icon: Settings,
    fields: [
      { key: 'app_name', label: 'Application Name', type: 'text', default: 'Yami Mine Spaza Management' },
      { key: 'compliance_threshold', label: 'Compliance Threshold (%)', type: 'number', default: '70' },
      { key: 'inspection_interval_days', label: 'Inspection Interval (days)', type: 'number', default: '90' },
    ],
  },
  {
    key: 'popia', label: 'POPIA & Retention', icon: Shield,
    fields: [
      { key: 'active_shop_retention', label: 'Active Shop Data Retention', type: 'text', default: 'Indefinite (while operating)' },
      { key: 'inactive_shop_retention', label: 'Inactive Shop Retention (years)', type: 'number', default: '7' },
      { key: 'audit_log_retention', label: 'Audit Log Retention (years)', type: 'number', default: '5' },
      { key: 'user_account_retention', label: 'Inactive User Retention (years)', type: 'number', default: '1' },
    ],
  },
  {
    key: 'notifications', label: 'Notifications', icon: Bell,
    fields: [
      { key: 'notify_on_export', label: 'Notify admins on data export', type: 'checkbox', default: true },
      { key: 'notify_on_delete', label: 'Notify admins on bulk delete', type: 'checkbox', default: true },
      { key: 'notify_on_new_shop', label: 'Notify on new shop registration', type: 'checkbox', default: false },
    ],
  },
  {
    key: 'security', label: 'Security', icon: Database,
    fields: [
      { key: 'require_2fa_admin', label: 'Require 2FA for Admin accounts', type: 'checkbox', default: false },
      { key: 'session_timeout_mins', label: 'Session Timeout (minutes)', type: 'number', default: '60' },
      { key: 'max_login_attempts', label: 'Max Login Attempts', type: 'number', default: '5' },
    ],
  },
];

export default function AdminSettings() {
  const [values, setValues] = useState(() => {
    const defaults = {};
    SECTIONS.forEach(s => s.fields.forEach(f => { defaults[f.key] = f.default; }));
    return defaults;
  });
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const currentSection = SECTIONS.find(s => s.key === activeSection);

  return (
    <div className="space-y-6">
      <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#0ea5e9]" /> System Settings
        </h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.key} onClick={() => setActiveSection(s.key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeSection === s.key ? 'bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white shadow-[4px_4px_8px_#c5c9ce]' : 'text-slate-600 bg-[#e8ecf1] shadow-[3px_3px_6px_#c5c9ce,-3px_-3px_6px_#ffffff]'}`}>
                <Icon className="w-4 h-4" /> {s.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-4">
          {currentSection?.fields.map(field => (
            <div key={field.key} className="flex items-center gap-4 flex-wrap">
              <label className="w-64 text-sm font-medium text-slate-700 flex-shrink-0">{field.label}</label>
              {field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-10 h-6 rounded-full relative transition-all ${values[field.key] ? 'bg-[#0ea5e9]' : 'bg-slate-300'}`} onClick={() => setValues(v => ({ ...v, [field.key]: !v[field.key] }))}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${values[field.key] ? 'left-5' : 'left-1'}`} />
                  </div>
                  <span className="text-sm text-slate-500">{values[field.key] ? 'Enabled' : 'Disabled'}</span>
                </label>
              ) : (
                <Input type={field.type} value={values[field.key] ?? ''} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} className="max-w-xs bg-[#e8ecf1] border-0 shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff] rounded-xl" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} className="bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white border-0 rounded-xl shadow-[4px_4px_8px_#c5c9ce] gap-2">
            <FileText className="w-4 h-4" /> Save Settings
          </Button>
          {saved && <span className="text-sm text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4" /> Saved</span>}
        </div>
      </div>

      <div className="bg-[#e8ecf1] rounded-3xl shadow-[8px_8px_16px_#c5c9ce,-8px_-8px_16px_#ffffff] p-6">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" /> POPIA Compliance Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Consent management', 'Data minimization', 'Purpose specification', 'Security safeguards', 'Data subject rights', 'Audit logging & accountability'].map(item => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}