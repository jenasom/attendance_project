export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TEACHER';
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  teacherId: string;
  teacher?: User;
  students?: Student[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  fingerprintTemplate?: string;
  courses?: Course[];
  attendances?: Attendance[];
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  timestamp: string;
  student?: Student;
  course?: Course;
  createdAt: string;
  updatedAt: string;
}

export interface FingerprintScanResult {
  success: boolean;
  template?: string;
  image?: string;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TEACHER';
}

export interface CreateCourseRequest {
  name: string;
  code: string;
  description?: string;
}

export interface RegisterStudentRequest {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  fingerprintTemplate: string;
  courseIds: string[];
}

export interface MarkAttendanceRequest {
  courseId: string;
  fingerprintTemplate: string;
}
