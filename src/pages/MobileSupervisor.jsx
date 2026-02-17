import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-slate-400 text-xs">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function MobileSupervisor() {
  const [selectedMunicipality, setSelectedMunicipality] = useState('all');

  const { data: agents = [] } = useQuery({
    queryKey: ['field-agents'],
    queryFn: () => base44.entities.FieldAgent.list('-created_date', 100)
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return await base44.entities.Attendance.filter({ date: today });
    }
  });

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list('-created_date', 500)
  });

  const filteredAgents = selectedMunicipality === 'all' 
    ? agents 
    : agents.filter(a => a.municipality === selectedMunicipality);

  const activeAgents = filteredAgents.filter(a => a.employment_status === 'active').length;
  const checkedIn = attendance.filter(a => a.status === 'checked_in').length;
  const todayShops = attendance.reduce((sum, a) => sum + (a.shops_profiled || 0), 0);
  const todayInspections = attendance.reduce((sum, a) => sum + (a.inspections_completed || 0), 0);

  const municipalities = ['KwaDukuza', 'Mandeni', 'Ndwedwe', 'Maphumulo'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white mb-1">Team Dashboard</h1>
          <p className="text-slate-400">Monitor your team's activity</p>
          
          <div className="mt-4">
            <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Municipalities</SelectItem>
                {municipalities.map(mun => (
                  <SelectItem key={mun} value={mun}>{mun}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            icon={Users}
            label="Active Agents"
            value={activeAgents}
            color="bg-cyan-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="Checked In"
            value={checkedIn}
            color="bg-emerald-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Shops Today"
            value={todayShops}
            color="bg-amber-500"
          />
          <StatCard
            icon={Calendar}
            label="Inspections"
            value={todayInspections}
            color="bg-red-500"
          />
        </div>

        {/* Today's Attendance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Today's Attendance
          </h2>
          <div className="space-y-3">
            {attendance.length === 0 ? (
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardContent className="p-6 text-center">
                  <p className="text-slate-400">No attendance records for today</p>
                </CardContent>
              </Card>
            ) : (
              attendance.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">{record.agent_name}</p>
                          <p className="text-slate-400 text-xs">{record.agent_email}</p>
                        </div>
                        <Badge className={
                          record.status === 'checked_in' 
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }>
                          {record.status === 'checked_in' ? 'Active' : 'Complete'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs">Check In</p>
                          <p className="text-white">
                            {format(new Date(record.check_in_time), 'h:mm a')}
                          </p>
                        </div>
                        {record.check_out_time && (
                          <div>
                            <p className="text-slate-400 text-xs">Check Out</p>
                            <p className="text-white">
                              {format(new Date(record.check_out_time), 'h:mm a')}
                            </p>
                          </div>
                        )}
                      </div>

                      {record.municipality && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                          <p className="text-slate-400 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {record.municipality}
                            {record.ward && ` - Ward ${record.ward}`}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="p-2 bg-slate-800/50 rounded">
                          <p className="text-slate-400 text-[10px]">Shops</p>
                          <p className="text-white font-semibold">{record.shops_profiled || 0}</p>
                        </div>
                        <div className="p-2 bg-slate-800/50 rounded">
                          <p className="text-slate-400 text-[10px]">Inspections</p>
                          <p className="text-white font-semibold">{record.inspections_completed || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Team Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-white font-semibold mb-4">Team Members</h2>
          <div className="space-y-3">
            {filteredAgents.slice(0, 10).map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{agent.full_name}</p>
                        <p className="text-slate-400 text-xs">{agent.municipality}</p>
                      </div>
                      <Badge className={
                        agent.employment_status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }>
                        {agent.employment_status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}