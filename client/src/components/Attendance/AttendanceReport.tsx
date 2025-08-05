import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Course, Student, Attendance } from '../../types';

const AttendanceReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  const preselectedStudentId = searchParams.get('studentId');

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [filteredData, setFilteredData] = useState<Attendance[]>([]);
  
  const [filters, setFilters] = useState({
    courseId: preselectedCourseId || '',
    studentId: preselectedStudentId || '',
    startDate: '',
    endDate: '',
    status: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (filters.courseId || filters.studentId) {
      fetchAttendanceData();
    }
  }, [filters.courseId, filters.studentId]);

  useEffect(() => {
    applyFilters();
  }, [attendanceData, filters]);

  const fetchCourses = async () => {
    try {
      const response = await apiService.get<Course[]>('/courses');
      if (response.success && response.data) {
        setCourses(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiService.get<Student[]>('/students');
      if (response.success && response.data) {
        setStudents(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError('');

    try {
      let url = '/attendance';
      const params = new URLSearchParams();
      
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.studentId) params.append('studentId', filters.studentId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiService.get<Attendance[]>(url);
      if (response.success && response.data) {
        setAttendanceData(response.data);
      } else {
        setError('Failed to fetch attendance data');
      }
    } catch (err) {
      setError('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attendanceData];

    // Date filters
    if (filters.startDate) {
      filtered = filtered.filter(att => 
        new Date(att.timestamp) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(att => 
        new Date(att.timestamp) <= new Date(filters.endDate + 'T23:59:59')
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(att => att.status === filters.status);
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      courseId: '',
      studentId: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    setAttendanceData([]);
    setFilteredData([]);
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ['Student Name', 'Student ID', 'Course', 'Status', 'Date', 'Time'];
    const csvData = filteredData.map(att => [
      `${att.student?.firstName} ${att.student?.lastName}`,
      att.student?.studentId || '',
      att.course?.name || '',
      att.status,
      new Date(att.timestamp).toLocaleDateString(),
      new Date(att.timestamp).toLocaleTimeString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusStats = () => {
    const stats = {
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0
    };

    filteredData.forEach(att => {
      stats[att.status as keyof typeof stats]++;
    });

    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="attendance-report-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Attendance Reports</h1>
          <p className="text-muted">View and analyze attendance data</p>
        </div>
        {filteredData.length > 0 && (
          <button className="btn btn-outline-primary" onClick={exportToCSV}>
            <i className="fas fa-download me-2"></i>
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3">
              <label htmlFor="courseId" className="form-label">Course</label>
              <select
                className="form-select"
                id="courseId"
                name="courseId"
                value={filters.courseId}
                onChange={handleFilterChange}
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 mb-3">
              <label htmlFor="studentId" className="form-label">Student</label>
              <select
                className="form-select"
                id="studentId"
                name="studentId"
                value={filters.studentId}
                onChange={handleFilterChange}
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 mb-3">
              <label htmlFor="startDate" className="form-label">From Date</label>
              <input
                type="date"
                className="form-control"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="col-md-2 mb-3">
              <label htmlFor="endDate" className="form-label">To Date</label>
              <input
                type="date"
                className="form-control"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="col-md-2 mb-3">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                className="form-select"
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={fetchAttendanceData}
              disabled={!filters.courseId && !filters.studentId}
            >
              <i className="fas fa-search me-2"></i>
              Apply Filters
            </button>
            <button className="btn btn-outline-secondary" onClick={clearFilters}>
              <i className="fas fa-times me-2"></i>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {filteredData.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h4>{stats.PRESENT}</h4>
                <p className="mb-0">Present</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h4>{stats.LATE}</h4>
                <p className="mb-0">Late</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body text-center">
                <h4>{stats.ABSENT}</h4>
                <p className="mb-0">Absent</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h4>{filteredData.length}</h4>
                <p className="mb-0">Total Records</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Attendance Records</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading attendance data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
              <h4>No Data Found</h4>
              <p className="text-muted">
                {!filters.courseId && !filters.studentId
                  ? 'Select a course or student to view attendance reports'
                  : 'No attendance records match your filter criteria'
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((attendance) => (
                    <tr key={attendance.id}>
                      <td>
                        {attendance.student?.firstName} {attendance.student?.lastName}
                      </td>
                      <td>{attendance.student?.studentId}</td>
                      <td>
                        {attendance.course?.name}
                        <br />
                        <small className="text-muted">{attendance.course?.code}</small>
                      </td>
                      <td>
                        <span className={`badge ${
                          attendance.status === 'PRESENT' ? 'bg-success' :
                          attendance.status === 'LATE' ? 'bg-warning' : 'bg-danger'
                        }`}>
                          {attendance.status}
                        </span>
                      </td>
                      <td>
                        {new Date(attendance.timestamp).toLocaleDateString()}
                      </td>
                      <td>
                        {new Date(attendance.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;
