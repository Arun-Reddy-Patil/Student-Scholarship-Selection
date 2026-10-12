import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Student } from '../types/index.js';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Phone,
  Mail,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({
        search: search || undefined,
        department: departmentFilter !== 'All' ? departmentFilter : undefined,
      });
      setStudents(res.students);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const handleOpenCreate = () => {
    setCurrentStudent({
      studentId: `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      email: '',
      department: 'Computer Science',
      course: 'B.S. Computer Science',
      academicYear: '1st Year',
      gpa: 3.8,
      phone: '',
      householdIncome: 35000,
      familyMembers: 4,
    });
    setFormError(null);
    setModalMode('create');
  };

  const handleOpenEdit = (student: Student) => {
    setCurrentStudent({ ...student });
    setFormError(null);
    setModalMode('edit');
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    if (!currentStudent.name || !currentStudent.email || !currentStudent.studentId) {
      setFormError('Student ID, Name, and Email are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (modalMode === 'create') {
        await api.createStudent(currentStudent);
      } else if (modalMode === 'edit' && currentStudent._id) {
        await api.updateStudent(currentStudent._id, currentStudent);
      }
      setModalMode(null);
      setCurrentStudent(null);
      await loadStudents();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget?._id) return;
    try {
      await api.deleteStudent(deleteTarget._id);
      setDeleteTarget(null);
      await loadStudents();
    } catch (err: any) {
      alert(`Failed to delete student: ${err.message}`);
    }
  };

  const departments = ['All', 'Computer Science', 'Electrical Engineering', 'Economics', 'Biomedical Engineering', 'Mechanical Engineering', 'Data Science', 'Physics', 'Public Health', 'Architecture', 'Chemistry', 'Civil Engineering', 'Mathematics'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional database of enrolled candidates, academic status, and financial profiles
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student ID, name, email, or department..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Department:</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            onClick={loadStudents}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading student directory...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No student records found</p>
            <p className="text-slate-400 mt-1">Try adjusting your search criteria or add a student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 pl-4">Student ID & Name</th>
                  <th className="py-3">Department & Program</th>
                  <th className="py-3">Academic Year</th>
                  <th className="py-3">GPA</th>
                  <th className="py-3">Financial Profile</th>
                  <th className="py-3">Contact</th>
                  <th className="py-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student._id || student.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-4">
                      <span className="font-bold text-slate-900 block">{student.name}</span>
                      <span className="font-mono text-[11px] text-indigo-700 font-semibold">
                        {student.studentId}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-medium text-slate-800 block">{student.department}</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[200px] block">
                        {student.course}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700">{student.academicYear}</td>
                    <td className="py-3 font-mono font-bold text-slate-900">
                      {student.gpa.toFixed(2)}
                    </td>
                    <td className="py-3 text-slate-600 font-mono text-[11px]">
                      {student.householdIncome ? (
                        <span>${student.householdIncome.toLocaleString()} / yr</span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-600">
                      <span className="flex items-center gap-1 text-[11px] truncate max-w-[170px]">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{student.email}</span>
                      </span>
                      {student.phone && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{student.phone}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(student)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {modalMode && currentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">
                {modalMode === 'create' ? 'Register New Student' : `Edit Student (${currentStudent.studentId})`}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Student ID *</label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    value={currentStudent.studentId || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, studentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={currentStudent.name || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    disabled={modalMode === 'edit'}
                    value={currentStudent.email || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={currentStudent.phone || ''}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Department *</label>
                  <select
                    value={currentStudent.department || 'Computer Science'}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {departments.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Academic Year *</label>
                  <select
                    value={currentStudent.academicYear || '1st Year'}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, academicYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1st Year">1st Year (Freshman)</option>
                    <option value="2nd Year">2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                    <option value="Graduate 1st Year">Graduate 1st Year</option>
                    <option value="Graduate 2nd Year">Graduate 2nd Year</option>
                    <option value="Doctoral">Doctoral / Ph.D.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Course / Degree Program *</label>
                <input
                  type="text"
                  required
                  value={currentStudent.course || ''}
                  onChange={(e) => setCurrentStudent({ ...currentStudent, course: e.target.value })}
                  placeholder="e.g. B.S. in Computer Science & Artificial Intelligence"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cumulative GPA (0.0 - 4.0) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    required
                    value={currentStudent.gpa !== undefined ? currentStudent.gpa : 3.8}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, gpa: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Annual Household Income ($)</label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={currentStudent.householdIncome !== undefined ? currentStudent.householdIncome : 35000}
                    onChange={(e) => setCurrentStudent({ ...currentStudent, householdIncome: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Create Record' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Student Record</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete student <strong>{deleteTarget.name}</strong> ({deleteTarget.studentId})? This will also remove any active scholarship applications associated with this student.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
