import {
  User,
  Student,
  ScholarshipApplication,
  Budget,
  Allocation,
  DashboardStats,
  TestCaseResult,
} from '../types/index.js';

const TOKEN_KEY = 'scholarselect_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(data: any): Promise<{ token: string; user: User }> {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ user: User & { studentProfile?: Student } }> {
    return request('/api/auth/me');
  },

  async getDemoAccounts(): Promise<{ accounts: any[] }> {
    return request('/api/auth/demo-accounts');
  },

  // Students
  async getStudents(params?: { search?: string; department?: string; sort?: string; order?: string }): Promise<{ students: Student[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.department) query.set('department', params.department);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.order) query.set('order', params.order);
    return request(`/api/students?${query.toString()}`);
  },

  async getStudent(id: string): Promise<{ student: Student; applications: ScholarshipApplication[] }> {
    return request(`/api/students/${id}`);
  },

  async createStudent(data: Partial<Student>): Promise<{ student: Student }> {
    return request('/api/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<{ student: Student }> {
    return request(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteStudent(id: string): Promise<{ message: string }> {
    return request(`/api/students/${id}`, {
      method: 'DELETE',
    });
  },

  // Applications
  async getApplications(params?: { status?: string; department?: string; search?: string; cycleYear?: string }): Promise<{ applications: ScholarshipApplication[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.department) query.set('department', params.department);
    if (params?.search) query.set('search', params.search);
    if (params?.cycleYear) query.set('cycleYear', params.cycleYear);
    return request(`/api/applications?${query.toString()}`);
  },

  async getApplication(id: string): Promise<{ application: ScholarshipApplication }> {
    return request(`/api/applications/${id}`);
  },

  async createApplication(data: Partial<ScholarshipApplication>): Promise<{ application: ScholarshipApplication }> {
    return request('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApplication(id: string, data: Partial<ScholarshipApplication>): Promise<{ application: ScholarshipApplication }> {
    return request(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteApplication(id: string): Promise<{ message: string }> {
    return request(`/api/applications/${id}`, {
      method: 'DELETE',
    });
  },

  // Budget
  async getBudget(academicYear?: string): Promise<{ budget: Budget }> {
    const query = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
    return request(`/api/budget${query}`);
  },

  async createBudget(data: Partial<Budget>): Promise<{ budget: Budget }> {
    return request('/api/budget', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBudget(id: string, data: { totalBudget: number; title?: string; notes?: string }): Promise<{ budget: Budget }> {
    return request(`/api/budget/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Selection
  async runSelection(params?: {
    academicYear?: string;
    customBudget?: number;
    departmentFilter?: string;
    minimumScore?: number;
    candidateStatusFilter?: string[];
  }): Promise<{
    allocationId: string;
    availableBudget: number;
    totalCost: number;
    remainingBudget: number;
    totalPriorityScore: number;
    budgetUtilizationRate: number;
    selectedStudents: any[];
    unselectedStudents: any[];
    algorithmSummary: any;
    message: string;
  }> {
    return request('/api/selection/run', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  },

  async getAllocations(academicYear?: string): Promise<{ results: Allocation[] }> {
    const query = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
    return request(`/api/selection/results${query}`);
  },

  async getAllocation(id: string): Promise<{ allocation: Allocation }> {
    return request(`/api/selection/results/${id}`);
  },

  async finalizeAllocation(allocationId: string, notes?: string): Promise<{ allocation: Allocation; message: string }> {
    return request('/api/selection/finalize', {
      method: 'POST',
      body: JSON.stringify({ allocationId, notes }),
    });
  },

  // Dashboard & Reports
  async getDashboardStats(academicYear?: string): Promise<{ stats: DashboardStats }> {
    const query = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
    return request(`/api/dashboard/stats${query}`);
  },

  async getSelectionReport(academicYear?: string): Promise<any> {
    const query = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
    return request(`/api/reports/selection${query}`);
  },

  getExportCsvUrl(academicYear: string = '2025-2026'): string {
    return `/api/reports/selection/export?academicYear=${encodeURIComponent(academicYear)}`;
  },

  // Automated Tests
  async runTestSuite(): Promise<{
    allPassed: boolean;
    totalTests: number;
    passedCount: number;
    failedCount: number;
    tests: TestCaseResult[];
  }> {
    return request('/api/tests/run-suite');
  },
};
