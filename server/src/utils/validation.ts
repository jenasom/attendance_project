interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateRegisterInput = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Email validation
  if (!data.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  // Password validation
  if (!data.password) {
    errors.push('Password is required');
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Name validation
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  // Role validation
  if (data.role && !['ADMIN', 'TEACHER'].includes(data.role)) {
    errors.push('Invalid role');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateLoginInput = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Email validation
  if (!data.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  // Password validation
  if (!data.password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCourseInput = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Course name is required');
  } else if (data.name.length > 255) {
    errors.push('Course name must be less than 255 characters');
  }

  // Code validation
  if (!data.code || data.code.trim().length === 0) {
    errors.push('Course code is required');
  } else if (data.code.length > 20) {
    errors.push('Course code must be less than 20 characters');
  }

  // Description validation (optional)
  if (data.description && data.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateStudentInput = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Name validation
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  // Email validation
  if (!data.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  // Student ID validation
  if (!data.studentId || data.studentId.trim().length === 0) {
    errors.push('Student ID is required');
  }

  // Fingerprint template validation
  if (!data.fingerprintTemplate || data.fingerprintTemplate.trim().length === 0) {
    errors.push('Fingerprint template is required');
  }

  // Course IDs validation (optional)
  if (data.courseIds && !Array.isArray(data.courseIds)) {
    errors.push('Course IDs must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAttendanceInput = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Course ID validation
  if (!data.courseId || data.courseId.trim().length === 0) {
    errors.push('Course ID is required');
  }

  // Fingerprint template validation
  if (!data.fingerprintTemplate || data.fingerprintTemplate.trim().length === 0) {
    errors.push('Fingerprint template is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
