import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Course, RegisterStudentRequest, FingerprintScanResult } from '../../types';
import FingerprintScanner from '../Common/FingerprintScanner';

const RegisterStudent: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    courseIds: [] as string[]
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [fingerprintTemplate, setFingerprintTemplate] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Fingerprint, 3: Courses
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCourseToggle = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId]
    }));
  };

  const handleFingerprintScan = (result: FingerprintScanResult) => {
    if (result.success && result.template) {
      setFingerprintTemplate(result.template);
      setError('');
    } else {
      setError(result.error || 'Failed to capture fingerprint');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fingerprintTemplate) {
      setError('Please capture fingerprint before registering student');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData: RegisterStudentRequest = {
        ...formData,
        fingerprintTemplate,
      };

      const response = await apiService.post('/students', requestData);
      
      if (response.success) {
        navigate('/students');
      } else {
        setError(response.error || 'Failed to register student');
      }
    } catch (err) {
      setError('Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.studentId) {
        setError('Please fill in all required fields');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  return (
    <div className="register-student-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Register Student</h1>
          <p className="text-muted">Add a new student to the system</p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate('/students')}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Back to Students
        </button>
      </div>

      {/* Progress Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="progress-container">
            <div className="d-flex justify-content-between mb-2">
              <span className={`step-label ${step >= 1 ? 'text-primary' : 'text-muted'}`}>
                1. Basic Information
              </span>
              <span className={`step-label ${step >= 2 ? 'text-primary' : 'text-muted'}`}>
                2. Fingerprint Capture
              </span>
              <span className={`step-label ${step >= 3 ? 'text-primary' : 'text-muted'}`}>
                3. Course Assignment
              </span>
            </div>
            <div className="progress">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${(step / 3) * 100}%` }}
                aria-valuenow={step}
                aria-valuemin={0}
                aria-valuemax={3}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Basic Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="firstName" className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="lastName" className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="studentId" className="form-label">Student ID *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                >
                  Next: Fingerprint Capture
                  <i className="fas fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Fingerprint Capture */}
        {step === 2 && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Fingerprint Capture</h5>
            </div>
            <div className="card-body">
              <div className="row justify-content-center">
                <div className="col-md-8">
                  <FingerprintScanner
                    onScanComplete={handleFingerprintScan}
                    isScanning={isScanning}
                    onStartScan={() => setIsScanning(true)}
                    onStopScan={() => setIsScanning(false)}
                  />
                  
                  {fingerprintTemplate && (
                    <div className="alert alert-success mt-3" role="alert">
                      <i className="fas fa-check-circle me-2"></i>
                      Fingerprint captured successfully!
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex justify-content-between mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={prevStep}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={!fingerprintTemplate}
                >
                  Next: Course Assignment
                  <i className="fas fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Course Assignment */}
        {step === 3 && (
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Course Assignment</h5>
            </div>
            <div className="card-body">
              {courses.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-book fa-3x text-muted mb-3"></i>
                  <h4>No Courses Available</h4>
                  <p className="text-muted">Create a course first before registering students</p>
                </div>
              ) : (
                <div>
                  <p className="text-muted mb-3">Select the courses this student will attend:</p>
                  <div className="row">
                    {courses.map((course) => (
                      <div key={course.id} className="col-md-6 col-lg-4 mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`course-${course.id}`}
                            checked={formData.courseIds.includes(course.id)}
                            onChange={() => handleCourseToggle(course.id)}
                          />
                          <label className="form-check-label" htmlFor={`course-${course.id}`}>
                            <div>
                              <strong>{course.name}</strong>
                              <div className="text-muted small">{course.code}</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={prevStep}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Previous
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading || courses.length === 0}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registering...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus me-2"></i>
                      Register Student
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default RegisterStudent;
