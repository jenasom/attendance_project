import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../services/auth';
import { apiService } from '../../services/api';
import { Course, Student, Attendance } from '../../types';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  todayAttendance: number;
  recentAttendance: Attendance[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    todayAttendance: 0,
    recentAttendance: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [coursesRes, studentsRes, attendanceRes] = await Promise.all([
          apiService.get<Course[]>('/courses'),
          apiService.get<Student[]>('/students'),
          apiService.get<Attendance[]>('/attendance/recent')
        ]);

        const today = new Date().toDateString();
        const todayAttendance = attendanceRes.data?.filter(
          att => new Date(att.timestamp).toDateString() === today
        ).length || 0;

        setStats({
          totalCourses: coursesRes.data?.length || 0,
          totalStudents: studentsRes.data?.length || 0,
          todayAttendance,
          recentAttendance: attendanceRes.data?.slice(0, 10) || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
    <div className="dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.firstName}!</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.totalCourses}</h4>
                  <p className="card-text">Total Courses</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-book fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.totalStudents}</h4>
                  <p className="card-text">Total Students</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-users fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">{stats.todayAttendance}</h4>
                  <p className="card-text">Today's Attendance</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-fingerprint fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="card-title">
                    {new Date().toLocaleDateString()}
                  </h4>
                  <p className="card-text">Today's Date</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-calendar fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <Link to="/courses/create" className="btn btn-outline-primary w-100">
                    <i className="fas fa-plus-circle me-2"></i>
                    Create Course
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link to="/students/register" className="btn btn-outline-success w-100">
                    <i className="fas fa-user-plus me-2"></i>
                    Register Student
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link to="/attendance/mark" className="btn btn-outline-info w-100">
                    <i className="fas fa-fingerprint me-2"></i>
                    Mark Attendance
                  </Link>
                </div>
                <div className="col-md-3 mb-3">
                  <Link to="/attendance/report" className="btn btn-outline-warning w-100">
                    <i className="fas fa-chart-bar me-2"></i>
                    View Reports
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Recent Attendance</h5>
            </div>
            <div className="card-body">
              {stats.recentAttendance.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentAttendance.map((attendance) => (
                        <tr key={attendance.id}>
                          <td>
                            {attendance.student?.firstName} {attendance.student?.lastName}
                          </td>
                          <td>{attendance.course?.name}</td>
                          <td>
                            <span className={`badge ${
                              attendance.status === 'PRESENT' ? 'bg-success' :
                              attendance.status === 'LATE' ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {attendance.status}
                            </span>
                          </td>
                          <td>{new Date(attendance.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No recent attendance records</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
