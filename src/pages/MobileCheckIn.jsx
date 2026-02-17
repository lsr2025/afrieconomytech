import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Clock,
  LogIn,
  LogOut,
  Loader2,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function MobileCheckIn() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ['today-attendance', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const today = new Date().toISOString().split('T')[0];
      const records = await base44.entities.Attendance.filter({ agent_email: user.email, date: today });
      return records[0] || null;
    },
    enabled: !!user?.email
  });

  const checkInMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Attendance.create({
        agent_email: user.email,
        agent_name: user.full_name,
        date: new Date().toISOString().split('T')[0],
        check_in_time: new Date().toISOString(),
        check_in_location: data.locationName,
        check_in_latitude: data.location.latitude,
        check_in_longitude: data.location.longitude,
        status: 'checked_in',
        notes: data.notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      setNotes('');
      setLocationName('');
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: async (data) => {
      const hoursWorked = ((new Date() - new Date(todayAttendance.check_in_time)) / (1000 * 60 * 60)).toFixed(2);
      return await base44.entities.Attendance.update(todayAttendance.id, {
        check_out_time: new Date().toISOString(),
        check_out_location: data.locationName,
        check_out_latitude: data.location.latitude,
        check_out_longitude: data.location.longitude,
        status: 'checked_out',
        hours_worked: parseFloat(hoursWorked),
        notes: todayAttendance.notes + (data.notes ? `\n${data.notes}` : '')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      setNotes('');
      setLocationName('');
    }
  });

  const captureGPS = () => {
    setGpsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy)
          });
          setGpsLoading(false);
        },
        (error) => {
          console.error('GPS error:', error);
          alert('Unable to get location. Please enable GPS.');
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  useEffect(() => {
    captureGPS();
  }, []);

  const handleCheckIn = () => {
    if (!location) {
      alert('Please capture your location first');
      return;
    }
    checkInMutation.mutate({ location, locationName, notes });
  };

  const handleCheckOut = () => {
    if (!location) {
      alert('Please capture your location first');
      return;
    }
    checkOutMutation.mutate({ location, locationName, notes });
  };

  const isCheckedIn = todayAttendance?.status === 'checked_in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-white mb-1">Attendance</h1>
          <p className="text-slate-400">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-6">
              <div className="text-center">
                {isCheckedIn ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 mb-3">
                      Checked In
                    </Badge>
                    <p className="text-white text-lg font-semibold mb-1">
                      {format(new Date(todayAttendance.check_in_time), 'h:mm a')}
                    </p>
                    <p className="text-slate-400 text-sm">{todayAttendance.check_in_location}</p>
                  </>
                ) : todayAttendance?.status === 'checked_out' ? (
                  <>
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-10 h-10 text-blue-400" />
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 mb-3">
                      Day Complete
                    </Badge>
                    <p className="text-white text-lg font-semibold mb-1">
                      {todayAttendance.hours_worked?.toFixed(1) || 0} hours
                    </p>
                    <p className="text-slate-400 text-sm">
                      {format(new Date(todayAttendance.check_in_time), 'h:mm a')} - {format(new Date(todayAttendance.check_out_time), 'h:mm a')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-10 h-10 text-slate-400" />
                    </div>
                    <Badge className="bg-slate-500/20 text-slate-400 mb-3">
                      Not Checked In
                    </Badge>
                    <p className="text-slate-400 text-sm">Ready to start your day?</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  Location
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={captureGPS}
                  disabled={gpsLoading}
                  className="border-slate-600 text-white"
                >
                  {gpsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {location ? (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-emerald-400 text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Location captured
                  </p>
                  <p className="text-slate-400 text-xs font-mono">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Accuracy: {location.accuracy}m
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-amber-400 text-sm">Waiting for GPS...</p>
                </div>
              )}

              <Input
                placeholder="Location name (e.g., KwaDukuza Office)"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />

              <Textarea
                placeholder="Add notes about your day..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-20"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {todayAttendance?.status === 'checked_out' ? (
            <div className="p-4 bg-blue-500/10 rounded-lg text-center">
              <p className="text-blue-400">You have completed your day. See you tomorrow!</p>
            </div>
          ) : isCheckedIn ? (
            <Button
              onClick={handleCheckOut}
              disabled={!location || checkOutMutation.isPending}
              className="w-full h-16 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg gap-3"
            >
              {checkOutMutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-6 h-6" />
                  Check Out
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCheckIn}
              disabled={!location || checkInMutation.isPending}
              className="w-full h-16 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-lg gap-3"
            >
              {checkInMutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-6 h-6" />
                  Check In
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}