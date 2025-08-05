import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Header';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import CourseList from './components/Courses/CourseList';
import CreateCourse from './components/Courses/CreateCourse';
import StudentList from './components/Students/StudentList';
import RegisterStudent from './components/Students/RegisterStudent';
import MarkAttendance from './components/Attendance/MarkAttendance';
import AttendanceReport from './components/Attendance/AttendanceReport';
import { AuthProvider } from './services/auth';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/courses" element={<CourseList />} />
                  <Route path="/courses/create" element={<CreateCourse />} />
                  <Route path="/students" element={<StudentList />} />
                  <Route path="/students/register" element={<RegisterStudent />} />
                  <Route path="/attendance/mark" element={<MarkAttendance />} />
                  <Route path="/attendance/report" element={<AttendanceReport />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;
