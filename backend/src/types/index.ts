// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'pharmacy' | 'lab' | 'hospital' | 'insurance';
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: Date;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

