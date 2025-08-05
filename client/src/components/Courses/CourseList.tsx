import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Course } from '../../types';

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await apiService.get<Course[]>('/courses');
      if (response.success && response.data) {
        setCourses(response.data);
      } else {
        setError('Failed to fetch courses');
      }
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const response = await apiService.delete(`/courses/${courseId}`);
      if (response.success) {
        setCourses(courses.filter(course => course.id !== courseId));
      } else {
        alert('Failed to delete course');
      }
    } catch (err) {
      alert('Failed to delete course');
    }
  };

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
    <div className="courses-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Courses</h1>
          <p className="text-muted">Manage your courses</p>
        </div>
        <Link to="/courses/create" className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>
          Create Course
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fas fa-book fa-3x text-muted mb-3"></i>
            <h4>No Courses Found</h4>
            <p className="text-muted">Create your first course to get started</p>
            <Link to="/courses/create" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Create Course
            </Link>
          </div>
        </div>
      ) : (
        <div className="row">
          {courses.map((course) => (
            <div key={course.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title">{course.name}</h5>
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
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <i className="fas fa-trash me-2"></i>
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="card-text">
                    <strong>Code:</strong> {course.code}
                  </p>
                  
                  {course.description && (
                    <p className="card-text text-muted">
                      {course.description}
                    </p>
                  )}
                  
                  <div className="card-text">
                    <small className="text-muted">
                      Students: {course.students?.length || 0}
                    </small>
                  </div>
                  
                  <div className="card-text">
                    <small className="text-muted">
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                
                <div className="card-footer bg-transparent">
                  <div className="d-flex gap-2">
                    <Link
                      to={`/attendance/mark?courseId=${course.id}`}
                      className="btn btn-sm btn-primary flex-fill"
                    >
                      <i className="fas fa-fingerprint me-1"></i>
                      Mark Attendance
                    </Link>
                    <Link
                      to={`/attendance/report?courseId=${course.id}`}
                      className="btn btn-sm btn-outline-primary flex-fill"
                    >
                      <i className="fas fa-chart-bar me-1"></i>
                      Reports
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
