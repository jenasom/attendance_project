// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  PYTHON_SERVER_URL: process.env.REACT_APP_PYTHON_SERVER_URL || 'http://localhost:5000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Authentication
export const AUTH_CONFIG = {
  TOKEN_KEY: 'authToken',
  REFRESH_TOKEN_KEY: 'refreshToken',
  USER_KEY: 'user',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

// Attendance Status Colors
export const ATTENDANCE_STATUS_COLORS = {
  [ATTENDANCE_STATUS.PRESENT]: 'success',
  [ATTENDANCE_STATUS.LATE]: 'warning',
  [ATTENDANCE_STATUS.ABSENT]: 'danger',
};

// Attendance Status Icons
export const ATTENDANCE_STATUS_ICONS = {
  [ATTENDANCE_STATUS.PRESENT]: 'fas fa-check-circle',
  [ATTENDANCE_STATUS.LATE]: 'fas fa-clock',
  [ATTENDANCE_STATUS.ABSENT]: 'fas fa-times-circle',
};

// Fingerprint Scanner Configuration
export const FINGERPRINT_CONFIG = {
  SCAN_TIMEOUT: 30000, // 30 seconds
  QUALITY_THRESHOLD: 0.6,
  MAX_RETRIES: 3,
  PROGRESS_UPDATE_INTERVAL: 100, // milliseconds
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  },
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]+$/,
  },
  STUDENT_ID: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 20,
    PATTERN: /^[A-Z0-9-]+$/,
  },
  COURSE_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 20,
    PATTERN: /^[A-Z0-9]+$/,
  },
  COURSE_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
  },
};

// Date and Time Formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM d, yyyy',
  DISPLAY_DATETIME: 'MMM d, yyyy h:mm a',
  DISPLAY_TIME: 'h:mm a',
  INPUT_DATE: 'yyyy-MM-dd',
  INPUT_DATETIME: "yyyy-MM-dd'T'HH:mm",
  API_DATE: 'yyyy-MM-dd',
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// File Upload
export const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FINGERPRINT_ERROR: 'Fingerprint scanning failed. Please ensure the scanner is connected and try again.',
  SCANNER_NOT_CONNECTED: 'Fingerprint scanner not connected. Please connect the DigitalPersona scanner.',
  MATCH_NOT_FOUND: 'No matching fingerprint found. Please ensure you are enrolled in this course.',
  ATTENDANCE_ALREADY_MARKED: 'Attendance has already been marked for this course today.',
  DUPLICATE_EMAIL: 'An account with this email address already exists.',
  DUPLICATE_STUDENT_ID: 'A student with this ID already exists.',
  DUPLICATE_COURSE_CODE: 'A course with this code already exists.',
  WEAK_PASSWORD: 'Password must contain at least one lowercase letter, one uppercase letter, and one number.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  COURSE_CREATED: 'Course created successfully',
  COURSE_UPDATED: 'Course updated successfully',
  COURSE_DELETED: 'Course deleted successfully',
  STUDENT_REGISTERED: 'Student registered successfully',
  STUDENT_UPDATED: 'Student updated successfully',
  STUDENT_DELETED: 'Student deleted successfully',
  ATTENDANCE_MARKED: 'Attendance marked successfully',
  FINGERPRINT_CAPTURED: 'Fingerprint captured successfully',
  DATA_EXPORTED: 'Data exported successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'bas_auth_token',
  REFRESH_TOKEN: 'bas_refresh_token',
  USER_DATA: 'bas_user_data',
  PREFERENCES: 'bas_user_preferences',
  LAST_COURSE: 'bas_last_course',
  THEME: 'bas_theme',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  CREATE_COURSE: '/courses/create',
  EDIT_COURSE: '/courses/:id/edit',
  STUDENTS: '/students',
  REGISTER_STUDENT: '/students/register',
  EDIT_STUDENT: '/students/:id/edit',
  MARK_ATTENDANCE: '/attendance/mark',
  ATTENDANCE_REPORT: '/attendance/report',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

// Scanner Status
export const SCANNER_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  SCANNING: 'SCANNING',
  ERROR: 'ERROR',
} as const;

export type ScannerStatus = typeof SCANNER_STATUS[keyof typeof SCANNER_STATUS];

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Theme Configuration
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: '#007bff',
    SECONDARY: '#6c757d',
    SUCCESS: '#28a745',
    DANGER: '#dc3545',
    WARNING: '#ffc107',
    INFO: '#17a2b8',
    LIGHT: '#f8f9fa',
    DARK: '#343a40',
  },
  BREAKPOINTS: {
    XS: '0px',
    SM: '576px',
    MD: '768px',
    LG: '992px',
    XL: '1200px',
    XXL: '1400px',
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_FINGERPRINT_SIMULATION: process.env.REACT_APP_ENABLE_FINGERPRINT_SIMULATION === 'true',
  ENABLE_DEBUG_MODE: process.env.NODE_ENV === 'development',
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  ENABLE_PWA: process.env.REACT_APP_ENABLE_PWA === 'true',
};

// Application Metadata
export const APP_METADATA = {
  NAME: 'Biometric Attendance System',
  VERSION: '1.0.0',
  DESCRIPTION: 'Secure attendance tracking with fingerprint technology',
  AUTHOR: 'Gideon Idoko',
  COPYRIGHT: '© 2023 Biometric Attendance System',
  GITHUB_URL: 'https://github.com/IamGideonIdoko/bio-attendance-sys',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  
  // Users
  USERS: {
    LIST: '/users',
    PROFILE: '/users/profile',
    UPDATE: '/users/profile',
  },
  
  // Courses
  COURSES: {
    LIST: '/courses',
    CREATE: '/courses',
    DETAIL: '/courses/:id',
    UPDATE: '/courses/:id',
    DELETE: '/courses/:id',
    STUDENTS: '/courses/:id/students',
  },
  
  // Students
  STUDENTS: {
    LIST: '/students',
    CREATE: '/students',
    DETAIL: '/students/:id',
    UPDATE: '/students/:id',
    DELETE: '/students/:id',
    COURSES: '/students/:id/courses',
    ENROLL: '/students/:id/courses/:courseId',
    UNENROLL: '/students/:id/courses/:courseId',
  },
  
  // Attendance
  ATTENDANCE: {
    LIST: '/attendance',
    MARK: '/attendance/mark',
    RECENT: '/attendance/recent',
    BY_STUDENT: '/attendance/student/:studentId',
    BY_COURSE: '/attendance/course/:courseId',
    TODAY_BY_COURSE: '/attendance/course/:courseId/today',
    UPDATE: '/attendance/:id',
    DELETE: '/attendance/:id',
  },
  
  // Fingerprint Service
  FINGERPRINT: {
    CAPTURE: '/capture',
    MATCH: '/match',
    VERIFY_QUALITY: '/verify-quality',
    EXTRACT_FEATURES: '/extract-features',
    SCANNER_STATUS: '/scanner/status',
  },
};
