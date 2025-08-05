import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Student } from '../../types';

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await apiService.get<Student[]>('/students');
      if (response.success && response.data) {
        setStudents(response.data);
      } else {
        setError('Failed to fetch students');
      }
    } catch (err) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const response = await apiService.delete(`/students/${studentId}`);
      if (response.success) {
        setStudents(students.filter(student => student.id !== studentId));
      } else {
        alert('Failed to delete student');
      }
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="students-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Students</h1>
          <p className="text-muted">Manage student registrations</p>
        </div>
        <Link to="/students/register" className="btn btn-primary">
          <i className="fas fa-user-plus me-2"></i>
          Register Student
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search students by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 text-end">
              <span className="text-muted">
                Showing {filteredStudents.length} of {students.length} students
              </span>
            </div>
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fas fa-users fa-3x text-muted mb-3"></i>
            <h4>
              {students.length === 0 ? 'No Students Registered' : 'No Students Found'}
            </h4>
            <p className="text-muted">
              {students.length === 0 
                ? 'Register your first student to get started'
                : 'Try adjusting your search criteria'
              }
            </p>
            {students.length === 0 && (
              <Link to="/students/register" className="btn btn-primary">
                <i className="fas fa-user-plus me-2"></i>
                Register Student
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Courses</th>
                  <th>Fingerprint</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.studentId}</strong>
                    </td>
                    <td>
                      <div>
                        <div className="fw-semibold">
                          {student.firstName} {student.lastName}
                        </div>
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>
                      <span className="badge bg-info">
                        {student.courses?.length || 0} courses
                      </span>
                    </td>
                    <td>
                      {student.fingerprintTemplate ? (
                        <span className="badge bg-success">
                          <i className="fas fa-check me-1"></i>
                          Enrolled
                        </span>
                      ) : (
                        <span className="badge bg-warning">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Missing
                        </span>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <Link
                              className="dropdown-item"
                              to={`/attendance/report?studentId=${student.id}`}
                            >
                              <i className="fas fa-chart-bar me-2"></i>
                              View Attendance
                            </Link>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => handleDeleteStudent(student.id)}
                            >
                              <i className="fas fa-trash me-2"></i>
                              Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
