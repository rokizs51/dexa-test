import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, XCircle, Calendar, Download, LogOut } from 'lucide-react';
import { attendanceService } from '../services/api';
import type { Attendance } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import Button from '../components/Button';
import { Modal } from '../components/Modal';
import { formatDate, formatTime, getStatusColor } from '../lib/utils';

const AttendanceMonitoring = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<{ open: boolean; attendance: Attendance | null; newStatus: 'approved' | 'rejected' | null }>({
    open: false,
    attendance: null,
    newStatus: null,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadAttendances();
  }, [selectedDate]);

  const loadAttendances = async () => {
    setLoading(true);
    try {
      const response = await attendanceService.getAll();
      if (response.success && response.data) {
        // Filter by selected date
        const filtered = response.data.filter(a => a.date === selectedDate);
        setAttendances(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  const summaryData = {
    total: attendances.length,
    present: attendances.filter(a => a.status === 'approved').length,
    pending: attendances.filter(a => a.status === 'submitted').length,
    rejected: attendances.filter(a => a.status === 'rejected').length,
  };

  const stats = [
    {
      name: 'Total',
      value: summaryData.total,
      icon: Users,
      color: 'bg-brown-100 text-brown-600',
    },
    {
      name: 'Present',
      value: summaryData.present,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      name: 'Pending',
      value: summaryData.pending,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      name: 'Rejected',
      value: summaryData.rejected,
      icon: XCircle,
      color: 'bg-red-100 text-red-600',
    },
  ];

  const handleUpdateStatus = async () => {
    if (!statusModal.attendance || !statusModal.newStatus) return;

    setIsUpdating(true);
    try {
      let response;
      if (statusModal.newStatus === 'approved') {
        response = await attendanceService.approve(statusModal.attendance.id);
      } else {
        response = await attendanceService.reject(statusModal.attendance.id, '');
      }
      if (response.success) {
        loadAttendances();
        setStatusModal({ open: false, attendance: null, newStatus: null });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Code', 'Department', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status'];
    const rows = attendances.map(a => [
      a.employeeName,
      a.employeeCode,
      a.department,
      a.date,
      formatTime(a.checkInTime),
      a.checkOutTime ? formatTime(a.checkOutTime) : '',
      a.totalWorkingHours || '',
      a.status,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${selectedDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">Attendance Monitoring</h1>
          <p className="text-brown-500">Real-time attendance tracking and monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-4 pr-4 py-2 rounded-lg border border-brown-200 focus:outline-none focus:ring-2 focus:ring-brown-400 bg-white"
            />
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download size={18} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {selectedDate ? formatDate(selectedDate) : 'Select a date'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-brown-200 border-t-brown-600 rounded-full animate-spin" />
                </div>
              ) : attendances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-brown-50 border-b border-brown-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Employee</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Department</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Check In</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Check Out</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Working Hours</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brown-100">
                      {attendances.map((record) => (
                        <tr key={record.id} className="hover:bg-brown-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brown-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-brown-700">
                                  {record.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-brown-900">{record.employeeName}</p>
                                <p className="text-xs text-brown-500">{record.employeeCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-brown-600">{record.department}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-brown-400" />
                              <span className="text-brown-900">{formatTime(record.checkInTime)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <LogOut size={14} className="text-brown-400" />
                              <span className="text-brown-900">
                                {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-brown-600 font-medium">
                            {record.totalWorkingHours || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {record.status === 'submitted' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => setStatusModal({ open: true, attendance: record, newStatus: 'approved' })}
                                >
                                  <CheckCircle size={16} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => setStatusModal({ open: true, attendance: record, newStatus: 'rejected' })}
                                >
                                  <XCircle size={16} />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-brown-300 mb-4" />
                  <p className="text-brown-500">No attendance records for this date</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Department Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const departments = [...new Set(attendances.map(a => a.department))];
                return (
                  <div className="space-y-4">
                    {departments.map(dept => {
                      const deptAttendances = attendances.filter(a => a.department === dept);
                      const present = deptAttendances.filter(a => a.status === 'approved').length;
                      const percentage = deptAttendances.length > 0
                        ? Math.round((present / deptAttendances.length) * 100)
                        : 0;

                      return (
                        <div key={dept}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-brown-700">{dept}</span>
                            <span className="text-sm text-brown-500">
                              {present}/{deptAttendances.length} ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-brown-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentage >= 90 ? 'bg-green-500' :
                                percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, attendance: null, newStatus: null })}
        title={statusModal.newStatus === 'approved' ? 'Approve Attendance' : 'Reject Attendance'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStatusModal({ open: false, attendance: null, newStatus: null })}>
              Cancel
            </Button>
            <Button
              variant={statusModal.newStatus === 'approved' ? 'primary' : 'danger'}
              onClick={handleUpdateStatus}
              isLoading={isUpdating}
            >
              {statusModal.newStatus === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        }
      >
        <p className="text-brown-600">
          {statusModal.newStatus === 'approved'
            ? `Are you sure you want to approve ${statusModal.attendance?.employeeName}'s attendance?`
            : `Are you sure you want to reject ${statusModal.attendance?.employeeName}'s attendance?`
          }
        </p>
      </Modal>
    </div>
  );
};

export default AttendanceMonitoring;
