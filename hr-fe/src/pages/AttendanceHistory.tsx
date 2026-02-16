import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar, LogOut } from 'lucide-react';
import { attendanceService } from '../services/api';
import type { Attendance } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { formatDate, formatTime, getStatusColor } from '../lib/utils';
import Button from '../components/Button';

const ITEMS_PER_PAGE = 10;

const AttendanceHistory = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    loadAttendance(1);
  }, [currentMonth]);

  const loadAttendance = async (page: number = 1) => {
    setLoading(true);
    try {
      // Calculate start and end date for the current month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const response = await attendanceService.getMyAttendances({
        page,
        limit: ITEMS_PER_PAGE,
        startDate,
        endDate,
      });

      if (response.success && response.data) {
        setAttendances(response.data);

        // Update pagination
        if (response.pagination) {
          setPagination({
            currentPage: response.pagination.currentPage || 1,
            totalPages: response.pagination.totalPages || 1,
            total: response.pagination.total || 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const goToPage = (page: number) => {
    loadAttendance(page);
  };

  const monthName = currentMonth.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate summary from filtered data
  const totalPresent = attendances.filter(a => a.status === 'approved').length;
  const totalPending = attendances.filter(a => a.status === 'submitted').length;
  const totalRejected = attendances.filter(a => a.status === 'rejected').length;
  const totalDays = attendances.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">Attendance History</h1>
          <p className="text-brown-500">View your attendance records</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-brown-200 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="p-2"
          >
            <ChevronLeft size={20} />
          </Button>
          <span className="px-4 font-medium text-brown-700 min-w-[140px] text-center">
            {monthName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="p-2"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brown-500">Present</p>
                <p className="text-2xl font-bold text-green-600">{totalPresent}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brown-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brown-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{totalRejected}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brown-500">Total Days</p>
                <p className="text-2xl font-bold text-brown-600">{totalDays}</p>
              </div>
              <div className="w-10 h-10 bg-brown-100 rounded-full flex items-center justify-center">
                <Calendar size={20} className="text-brown-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-brown-200 border-t-brown-600 rounded-full animate-spin" />
            </div>
          ) : attendances.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brown-50 border-b border-brown-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Check In</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Check Out</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Working Hours</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Photo</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-brown-700">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-100">
                    {attendances.map((record) => (
                      <tr key={record.id} className="hover:bg-brown-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-brown-400" />
                            <span className="text-brown-900 font-medium">
                              {formatDate(record.date)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-brown-400" />
                            <span className="text-brown-900">
                              {formatTime(record.checkInTime)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <LogOut size={16} className="text-brown-400" />
                            <span className="text-brown-900">
                              {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-brown-600 font-medium">
                          {record.totalWorkingHours || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {record.photoUrl ? (
                            <img
                              src={record.photoUrl}
                              alt="Attendance"
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-brown-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-brown-600">{record.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-brown-200">
                  <div className="text-sm text-brown-500">
                    Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} records)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              pagination.currentPage === pageNum
                                ? 'bg-brown-600 text-white'
                                : 'text-brown-600 hover:bg-brown-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Next
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-brown-300 mb-4" />
              <p className="text-brown-500">No attendance records for this month</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceHistory;
