import { User, LoginRequest, RegisterRequest, ApiResponse } from '../types';
import { apiService } from './api';

/**
 * Authentication service for handling user authentication operations
 * This provides a TypeScript-only interface for auth operations
 * The main auth context is handled in auth.tsx
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface AuthUser extends User {
  permissions?: string[];
  lastLogin?: string;
}

/**
 * Authentication service class
 */
export class AuthService {
  private static instance: AuthService;
  private readonly TOKEN_KEY = 'authToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'userData';

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with email and password
   */
  public async login(credentials: LoginRequest): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
    try {
      const response = await apiService.post<{ user: AuthUser; token: string }>('/auth/login', credentials);
      
      if (response.success && response.data) {
        this.setAuthData(response.data.token, response.data.user);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Login failed. Please check your credentials and try again.'
      };
    }
  }

  /**
   * Register new user
   */
  public async register(userData: RegisterRequest): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
    try {
      const response = await apiService.post<{ user: AuthUser; token: string }>('/auth/register', userData);
      
      if (response.success && response.data) {
        this.setAuthData(response.data.token, response.data.user);
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Get current user information
   */
  public async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    try {
      return await apiService.get<AuthUser>('/auth/me');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user information'
      };
    }
  }

  /**
   * Refresh authentication token
   */
  public async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post<{ token: string }>('/auth/refresh', {
        refreshToken
      });

      if (response.success && response.data) {
        this.setToken(response.data.token);
      }

      return response;
    } catch (error) {
      this.logout();
      return {
        success: false,
        error: 'Session expired. Please log in again.'
      };
    }
  }

  /**
   * Logout user
   */
  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  /**
   * Get stored authentication token
   */
  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  public getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get stored user data
   */
  public getStoredUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set authentication token
   */
  public setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Set authentication data
   */
  private setAuthData(token: string, user: AuthUser, refreshToken?: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Check if token is expired or about to expire
   */
  public isTokenExpired(bufferMinutes: number = 5): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = this.decodeToken(token);
      const bufferMs = bufferMinutes * 60 * 1000;
      return payload.exp * 1000 < Date.now() + bufferMs;
    } catch {
      return true;
    }
  }

  /**
   * Auto-refresh token if needed
   */
  public async ensureValidToken(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    if (this.isTokenExpired()) {
      const refreshResult = await this.refreshToken();
      return refreshResult.success;
    }

    return true;
  }

  /**
   * Get user permissions
   */
  public getUserPermissions(): string[] {
    const user = this.getStoredUser();
    return user?.permissions || [];
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: string): boolean {
    const permissions = this.getUserPermissions();
    return permissions.includes(permission);
  }

  /**
   * Check if user has specific role
   */
  public hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  }

  /**
   * Get user role
   */
  public getUserRole(): string | null {
    const user = this.getStoredUser();
    return user?.role || null;
  }

  /**
   * Check if user is admin
   */
  public isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Check if user is teacher
   */
  public isTeacher(): boolean {
    return this.hasRole('TEACHER');
  }

  /**
   * Update stored user data
   */
  public updateStoredUser(userData: Partial<AuthUser>): void {
    const currentUser = this.getStoredUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    }
  }

  /**
   * Clear all authentication data
   */
  public clearAuthData(): void {
    this.logout();
  }

  /**
   * Get authentication headers for API requests
   */
  public getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Validate token format
   */
  public isValidTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      return parts.length === 3;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export utility functions
export const isAuthenticated = () => authService.isAuthenticated();
export const getToken = () => authService.getToken();
export const getStoredUser = () => authService.getStoredUser();
export const logout = () => authService.logout();
export const hasRole = (role: string) => authService.hasRole(role);
export const isAdmin = () => authService.isAdmin();
export const isTeacher = () => authService.isTeacher();

// Default export
export default authService;
