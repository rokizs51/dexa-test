import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Phone, Users } from 'lucide-react';
import { employeeService } from '../services/api';
import type { Employee } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import { Card, CardContent } from '../components/Card';
import { Modal } from '../components/Modal';
import { formatDate } from '../lib/utils';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    employeeCode: '',
    department: '',
    position: '',
    joinDate: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await employeeService.getAll();
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const departments = ['Engineering', 'Marketing', 'Finance', 'HR', 'Sales', 'Operations'];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        fullName: employee.fullName,
        email: employee.email,
        employeeCode: employee.employeeCode,
        department: employee.department,
        position: employee.position,
        joinDate: employee.joinDate,
        status: employee.status || 'active',
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        fullName: '',
        email: '',
        employeeCode: '',
        department: '',
        position: '',
        joinDate: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.department) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingEmployee) {
        const response = await employeeService.update(editingEmployee.id, formData);
        if (response.success) {
          loadEmployees();
          handleCloseModal();
        }
      } else {
        const response = await employeeService.create({
          userId: Math.random(),
          ...formData,
        });
        if (response.success) {
          loadEmployees();
          handleCloseModal();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.employee) return;

    setIsDeleting(true);
    try {
      const response = await employeeService.delete(deleteConfirm.employee.id);
      if (response.success) {
        loadEmployees();
        setDeleteConfirm({ open: false, employee: null });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBadgeClass = (status: 'active' | 'inactive') => {
    return status === 'active'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brown-900">Employee Management</h1>
          <p className="text-brown-500">Manage employee records and information</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} className="mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brown-200 focus:outline-none focus:ring-2 focus:ring-brown-400"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-brown-200 focus:outline-none focus:ring-2 focus:ring-brown-400 bg-white"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brown-200 flex items-center justify-center">
                    <span className="text-lg font-semibold text-brown-700">
                      {getInitials(employee.fullName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-brown-900">{employee.fullName}</h3>
                    <p className="text-sm text-brown-500">{employee.position}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(employee.status || 'active')}`}>
                  {employee.status || 'active'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-brown-600">
                  <Mail size={16} />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-brown-600">
                  <Phone size={16} />
                  <span>{employee.employeeCode}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-brown-100">
                <div>
                  <p className="text-xs text-brown-500">Department</p>
                  <p className="text-sm font-medium text-brown-700">{employee.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brown-500">Joined</p>
                  <p className="text-sm font-medium text-brown-700">{formatDate(employee.joinDate)}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenModal(employee)}
                >
                  <Edit2 size={16} className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteConfirm({ open: true, employee })}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users size={48} className="mx-auto text-brown-300 mb-4" />
            <p className="text-brown-500">No employees found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-brown-200 border-t-brown-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isSaving}>
              {editingEmployee ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Enter full name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Employee Code"
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
              placeholder="EMP001"
              required
            />
            <Input
              label="Join Date"
              type="date"
              value={formData.joinDate}
              onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={departments.map(d => ({ value: d, label: d }))}
              required
            />
            <Input
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Job title"
              required
            />
          </div>
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, employee: null })}
        title="Delete Employee"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, employee: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-brown-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{deleteConfirm.employee?.fullName}</span>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
