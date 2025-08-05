import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Course, FingerprintScanResult, MarkAttendanceRequest } from '../../types';
import FingerprintScanner from '../Common/FingerprintScanner';

const MarkAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(preselectedCourseId || '');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchCourses();
    if (selectedCourseId) {
      fetchTodayAttendance(selectedCourseId);
    }
  }, [selectedCourseId]);

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

  const fetchTodayAttendance = async (courseId: string) => {
    try {
      const response = await apiService.get(`/attendance/course/${courseId}/today`);
      if (response.success && response.data) {
        setAttendanceHistory(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch today\'s attendance:', err);
    }
  };

  const handleFingerprintScan = async (result: FingerprintScanResult) => {
    if (!result.success || !result.template) {
      setError(result.error || 'Failed to capture fingerprint');
      return;
    }

    if (!selectedCourseId) {
      setError('Please select a course first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestData: MarkAttendanceRequest = {
        courseId: selectedCourseId,
        fingerprintTemplate: result.template
      };

      const response = await apiService.post('/attendance/mark', requestData);
      
      if (response.success) {
        setSuccess(`Attendance marked successfully for ${response.data?.student?.firstName} ${response.data?.student?.lastName}`);
        // Refresh today's attendance
        await fetchTodayAttendance(selectedCourseId);
      } else {
        setError(response.error || 'Failed to mark attendance');
      }
    } catch (err) {
      setError('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mark-attendance-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Mark Attendance</h1>
          <p className="text-muted">Use fingerprint scanner to mark student attendance</p>
        </div>
        <div className="text-end">
          <div className="text-muted">
            <i className="fas fa-calendar me-2"></i>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <div className="row">
        {/* Scanner Section */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Fingerprint Scanner</h5>
            </div>
            <div className="card-body">
              {/* Course Selection */}
              <div className="mb-4">
                <label htmlFor="courseSelect" className="form-label">Select Course *</label>
                <select
                  className="form-select"
                  id="courseSelect"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  required
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCourseId && (
                <FingerprintScanner
                  onScanComplete={handleFingerprintScan}
                  isScanning={isScanning}
                  onStartScan={() => setIsScanning(true)}
                  onStopScan={() => setIsScanning(false)}
                />
              )}

              {!selectedCourseId && (
                <div className="text-center py-5">
                  <i className="fas fa-hand-pointer fa-3x text-muted mb-3"></i>
                  <h5>Select a Course</h5>
                  <p className="text-muted">Choose a course before scanning fingerprints</p>
                </div>
              )}

              {loading && (
                <div className="text-center mt-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Verifying fingerprint...</span>
                  </div>
                  <p className="mt-2 text-muted">Verifying fingerprint...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Today's Attendance</h5>
              {selectedCourseId && (
                <span className="badge bg-primary">
                  {attendanceHistory.length} recorded
                </span>
              )}
            </div>
            <div className="card-body">
              {!selectedCourseId ? (
                <div className="text-center py-5">
                  <i className="fas fa-list fa-3x text-muted mb-3"></i>
                  <h5>No Course Selected</h5>
                  <p className="text-muted">Select a course to view today's attendance</p>
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <h5>No Attendance Yet</h5>
                  <p className="text-muted">Start scanning fingerprints to mark attendance</p>
                </div>
              ) : (
                <div className="attendance-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {attendanceHistory.map((attendance, index) => (
                    <div key={attendance.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <div className="fw-semibold">
                          {attendance.student?.firstName} {attendance.student?.lastName}
                        </div>
                        <small className="text-muted">
                          ID: {attendance.student?.studentId}
                        </small>
                      </div>
                      <div className="text-end">
                        <span className={`badge ${
                          attendance.status === 'PRESENT' ? 'bg-success' :
                          attendance.status === 'LATE' ? 'bg-warning' : 'bg-danger'
                        }`}>
                          {attendance.status}
                        </span>
                        <div>
                          <small className="text-muted">
                            {new Date(attendance.timestamp).toLocaleTimeString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCourseId && attendanceHistory.length > 0 && (
              <div className="card-footer">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => fetchTodayAttendance(selectedCourseId)}
                >
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Instructions</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="text-center">
                <i className="fas fa-hand-pointer fa-2x text-primary mb-3"></i>
                <h6>1. Select Course</h6>
                <p className="text-muted small">Choose the course for which you want to mark attendance</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <i className="fas fa-fingerprint fa-2x text-success mb-3"></i>
                <h6>2. Scan Fingerprint</h6>
                <p className="text-muted small">Students place their finger on the DigitalPersona scanner</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <i className="fas fa-check-circle fa-2x text-info mb-3"></i>
                <h6>3. Verify & Record</h6>
                <p className="text-muted small">System verifies identity and marks attendance automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
