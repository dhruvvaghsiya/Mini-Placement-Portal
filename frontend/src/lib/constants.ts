/**
 * Application-wide constants
 */

export const APP_NAME = 'Mini Placement Portal';
export const APP_DESCRIPTION =
  'A modern placement management system for students and TPOs.';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

// Navigation routes
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Student
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    PROFILE: '/student/profile',
    DRIVES: '/student/drives',
    APPLICATIONS: '/student/applications',
  },

  // TPO
  TPO: {
    DASHBOARD: '/tpo/dashboard',
    STUDENTS: '/tpo/students',
    COMPANIES: '/tpo/companies',
    DRIVES: '/tpo/drives',
    APPLICATIONS: '/tpo/applications',
  },
} as const;

// Drive status labels
export const DRIVE_STATUS_LABELS = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
} as const;

// Application status labels
export const APPLICATION_STATUS_LABELS = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  placed: 'Placed',
} as const;
