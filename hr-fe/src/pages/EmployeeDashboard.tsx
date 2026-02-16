import { useEffect, useState } from 'react';
import { Clock, Calendar, CheckCircle, AlertCircle, CalendarCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService } from '../services/api';
import type { Attendance } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { formatDate, formatTime } from '../lib/utils';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        attendanceService.getTodayAttendance(),
        attendanceService.getMyAttendances(),
      ]);
      if (todayRes.success && todayRes.data) {
        setTodayAttendance(todayRes.data);
      }
      if (historyRes.success && historyRes.data) {
        setRecentAttendance(historyRes.data.slice(0, 5));
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      name: 'Present This Month',
      value: recentAttendance.filter(a => a.status !== 'rejected').length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      name: 'Pending Approval',
      value: recentAttendance.filter(a => a.status === 'submitted').length,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      name: 'Total Check-ins',
      value: recentAttendance.length,
      icon: CalendarCheck,
      color: 'bg-brown-100 text-brown-600',
    },
    {
      name: 'Avg Check-in Time',
      value: '09:05',
      icon: Clock,
      color: 'bg-blue-100 text-blue-600',
    },
  ];

  const isLate = () => {
    if (!todayAttendance) return false;
    const checkInHour = new Date(todayAttendance.checkInTime).getHours();
    return checkInHour >= 9;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brown-900">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-brown-500">{formatDate(new Date())}</p>
      </div>

      {/* Today's Status Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                todayAttendance
                  ? isLate()
                    ? 'bg-yellow-100'
                    : 'bg-green-100'
                  : 'bg-brown-100'
              }`}>
                {todayAttendance ? (
                  <Clock size={32} className={isLate() ? 'text-yellow-600' : 'text-green-600'} />
                ) : (
                  <Calendar size={32} className="text-brown-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brown-900">
                  {todayAttendance ? 'You have checked in today' : "You haven't checked in yet"}
                </h3>
                {todayAttendance && (
                  <p className="text-brown-500">
                    Check-in time: {formatTime(todayAttendance.checkInTime)}
                    {isLate() && (
                      <span className="ml-2 text-yellow-600 font-medium">(Late)</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            {todayAttendance ? (
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                isLate() ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>
                {todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1)}
              </div>
            ) : (
              <a
                href="/check-in"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors"
              >
                <Clock size={18} />
                Check In Now
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brown-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-brown-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Your recent check-in records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-brown-200 border-t-brown-600 rounded-full animate-spin" />
            </div>
          ) : recentAttendance.length > 0 ? (
            <div className="divide-y divide-brown-100">
              {recentAttendance.map((record) => (
                <div key={record.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      record.status === 'approved' ? 'bg-green-100' :
                      record.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <Clock size={18} className={
                        record.status === 'approved' ? 'text-green-600' :
                        record.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                      } />
                    </div>
                    <div>
                      <p className="font-medium text-brown-900">{formatDate(record.date)}</p>
                      <p className="text-sm text-brown-500">{formatTime(record.checkInTime)}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === 'approved' ? 'bg-green-100 text-green-700' :
                    record.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-brown-500">No attendance records found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
