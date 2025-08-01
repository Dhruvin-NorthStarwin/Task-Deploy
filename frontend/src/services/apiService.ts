// API Service for communicating with the backend
import type { Task, User } from '../types';
import config from '../config/environment';
import { fetchWithRetryAndAuth, storeAuthTokenReliably } from '../utils/productionFetch';
import { getAuthToken, getUserData } from '../utils/iosStorage';
import { getCSRFToken, shouldIncludeCSRFToken } from '../utils/csrfProtection';

const API_BASE_URL = config.API_BASE_URL;

// Helper function to handle HTTP errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }
  return response.json();
};

// Helper to get headers with auth token and CSRF protection
const getHeaders = async (includeAuth = true, method = 'GET', url = '') => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  
  if (includeAuth) {
    // Use enhanced storage utility for iOS compatibility
    const token = await getAuthToken();
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    } else {
      console.warn('⚠️ No auth token found. Request will be unauthenticated.');
    }
  }
  
  // Add CSRF token for state-changing requests
  if (shouldIncludeCSRFToken(method, url)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.append('X-CSRF-Token', csrfToken);
    } else {
      console.warn('⚠️ No CSRF token found for state-changing request.');
    }
  }
  
  return headers;
};

// Authentication APIs
export const login = async (restaurant_code: string, password: string): Promise<any> => {
  // Enhanced iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOSSafari = isIOS && isSafari;
  
  if (config.DEBUG) {
    console.log('🔥 LOGIN: Attempting login with code:', restaurant_code);
    console.log('🔥 LOGIN: API URL:', API_BASE_URL);
    console.log('🔥 LOGIN: User Agent:', navigator.userAgent);
    console.log('🔥 LOGIN: Platform:', navigator.platform);
    console.log('🔥 LOGIN: iOS Device:', isIOS);
    console.log('🔥 LOGIN: Safari Browser:', isSafari);
    console.log('🔥 LOGIN: iOS Safari:', isIOSSafari);
  }

  try {
    // Enhanced localStorage check for iOS
    try {
      const testKey = 'ios_storage_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved !== 'test') {
        throw new Error('Storage verification failed');
      }
    } catch (storageError) {
      console.error('🔥 LOGIN: localStorage not available:', storageError);
      if (isSafari) {
        throw new Error('Safari Private Mode detected. Please disable Private Mode and try again.');
      } else {
        throw new Error('Browser storage is disabled. Please check your browser settings.');
      }
    }

    // iOS-specific timeout and retry logic handled by fetchWithRetryAndAuth
    
    // Enhanced headers for iOS
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
    // Add iOS-specific headers
    if (isIOS) {
      headers['X-Requested-With'] = 'XMLHttpRequest';
      headers['Upgrade-Insecure-Requests'] = '1';
    }
    
    // Force HTTPS for iOS if not already
    let apiUrl = API_BASE_URL;
    if (isIOS && apiUrl.startsWith('http://')) {
      apiUrl = apiUrl.replace('http://', 'https://');
      console.log('🔒 iOS: Forced HTTPS URL:', apiUrl);
    }
    
    const response = await fetchWithRetryAndAuth(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add iOS/Safari specific headers (now allowed by CORS)
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify({ restaurant_code, password }),
      // iOS-specific fetch options
      mode: 'cors',
      credentials: 'omit', // Don't send cookies for iOS compatibility
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (config.DEBUG) {
        console.error('🔥 LOGIN ERROR:', response.status, response.statusText, errorData);
        console.error('🔥 LOGIN: Response headers:', [...response.headers.entries()]);
      }
      
      // Provide more specific error messages
      let errorMessage = 'Login failed';
      if (response.status === 401) {
        errorMessage = 'Invalid restaurant code or password';
      } else if (response.status === 403) {
        errorMessage = 'Access denied';
      } else if (response.status === 404) {
        errorMessage = 'Restaurant not found';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = errorData.detail || errorData.message || `Login failed: ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    if (config.DEBUG) {
      console.log('🔥 LOGIN: Response data:', data);
    }
    
    // Store the token using enhanced storage for production reliability
    if (data && data.access_token) {
      try {
        // Use enhanced storage that works reliably in production
        await storeAuthTokenReliably(data.access_token);
        if (config.DEBUG) {
          console.log('🔥 LOGIN: Token saved using enhanced production storage');
        }
      } catch (storageError) {
        console.error('🔥 LOGIN: Failed to save token:', storageError);
        throw new Error('Failed to save authentication. Please check your browser settings.');
      }
    } else {
      throw new Error('Invalid response from server - no token received');
    }
    
    return data;
  } catch (error: any) {
    if (config.DEBUG) {
      console.error('🔥 LOGIN: Exception occurred:', error);
      console.error('🔥 LOGIN: Error stack:', error.stack);
    }
    
    // Re-throw with iOS/Mac specific guidance
    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    
    if (error.message.includes('timeout')) {
      throw new Error('Connection timeout. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

export const checkAuth = async (): Promise<User> => {
  // Check if we have a token using enhanced storage
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  // Get user info using enhanced storage
  const userData = await getUserData();
  if (userData) {
    return userData;
  }
  
  throw new Error('No user information found');
};

export const register = async (registrationData: {
  name: string;
  cuisine_type: string;
  contact_email: string;
  contact_phone: string;
  password: string;
  locations: Array<{
    address_line1: string;
    town_city: string;
    postcode: string;
  }>;
}): Promise<any> => {
  if (config.DEBUG) {
    console.log('🔥 REGISTER: Attempting registration with data:', { 
      ...registrationData, 
      password: '[HIDDEN]' 
    });
  }
  
  const response = await fetchWithRetryAndAuth(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registrationData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (config.DEBUG) {
      console.error('🔥 REGISTER ERROR:', response.status, response.statusText, errorData);
    }
    throw new Error(errorData.detail || errorData.message || `Registration failed: ${response.status}`);
  }
  
  const data = await response.json();
  if (config.DEBUG) {
    console.log('🔥 REGISTER: Registration successful:', data);
  }
  
  return data;
};

// Task APIs
export const getTasks = async (filters?: Record<string, any>): Promise<Task[]> => {
  let url = `${API_BASE_URL}/tasks/`;
  
  if (config.DEBUG) {
    console.log('🔥 DEBUGGING: getTasks called with filters:', filters);
    console.log('🔥 DEBUGGING: API_BASE_URL:', API_BASE_URL);
    console.log('🔥 DEBUGGING: Full URL:', url);
  }
  
  if (filters && Object.keys(filters).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    url += `?${queryParams.toString()}`;
  }
  
  if (config.DEBUG) {
    console.log('🔥 DEBUGGING: Fetching tasks from:', url);
  }
  
  try {
    if (config.DEBUG) {
      console.log('🔥 DEBUGGING: About to fetch...');
    }
    const response = await fetchWithRetryAndAuth(url, {
      headers: await getHeaders(true), // Always include auth for this endpoint
    });
    
    if (config.DEBUG) {
      console.log('🔥 DEBUGGING: Response received:', response.status, response.statusText);
    }
    
    if (!response.ok) {
      if (config.DEBUG) {
        console.error('🔥 ERROR: Error fetching tasks:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('🔥 ERROR: Error details:', errorText);
      }
      // Throw an error to be caught by the calling component
      throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (config.DEBUG) {
      console.log('🔥 SUCCESS: Raw tasks data:', data);
      console.log('🔥 SUCCESS: Number of raw tasks:', data.length);
    }
    
    // Transform backend data to match frontend Task interface
    const transformedTasks: Task[] = data.map((backendTask: any) => ({
      id: backendTask.id,
      task: backendTask.task,
      description: backendTask.description,
      category: backendTask.category,
      day: backendTask.day,
      status: backendTask.status,
      imageRequired: backendTask.image_required || false,
      videoRequired: backendTask.video_required || false,
      taskType: backendTask.task_type,
      imageUrl: backendTask.image_url,
      videoUrl: backendTask.video_url,
      declineReason: backendTask.decline_reason,
      initials: backendTask.initials,
    }));
    
    if (config.DEBUG) {
      console.log('🔥 SUCCESS: Transformed tasks:', transformedTasks);
      console.log('🔥 SUCCESS: Number of transformed tasks:', transformedTasks.length);
      console.log('🔥 SUCCESS: First transformed task:', transformedTasks[0]);
    }
    
    return transformedTasks;
  } catch (error) {
    if (config.DEBUG) {
      console.error('🔥 FATAL ERROR: Error in getTasks:', error);
    }
    // Re-throw the error so the UI can handle it (e.g., show an error message)
    throw error;
  }
};

export const createTask = async (task: Omit<Task, 'id' | 'status'>): Promise<Task> => {
  // Transform frontend task model to match backend expectations
  const backendTask = {
    task: task.task,
    description: task.description || "",
    category: task.category,
    day: task.day,
    task_type: task.taskType,
    image_required: task.imageRequired || false,
    video_required: task.videoRequired || false,
    initials: task.initials,
  };
  
  if (config.DEBUG) {
    console.log('Creating task with auth:', backendTask);
  }
  
  const response = await fetchWithRetryAndAuth(`${API_BASE_URL}/tasks/`, {
    method: 'POST',
    headers: await getHeaders(true, 'POST', `${API_BASE_URL}/tasks/`), // Include CSRF token
    body: JSON.stringify(backendTask),
  });

  return handleResponse(response);
};

export const updateTaskStatus = async (taskId: number, status: string): Promise<Task> => {
  // Note: Backend doesn't have a general /status endpoint
  // Instead use specific endpoints: /submit, /approve, /decline
  let endpoint: string;
  
  switch (status.toLowerCase()) {
    case 'submitted':
    case 'submit':
      endpoint = `${API_BASE_URL}/tasks/${taskId}/submit`;
      break;
    case 'approved':
    case 'approve':
      endpoint = `${API_BASE_URL}/tasks/${taskId}/approve`;
      break;
    case 'declined':
    case 'decline':
      endpoint = `${API_BASE_URL}/tasks/${taskId}/decline`;
      break;
    default:
      throw new Error(`Unsupported status update: ${status}. Use 'submit', 'approve', or 'decline'`);
  }
  
  const response = await fetchWithRetryAndAuth(endpoint, {
    method: 'PATCH',
    headers: await getHeaders(true, 'PATCH', endpoint), // Include CSRF token
    body: JSON.stringify({}), // Most status endpoints don't need additional data
  });
  
  return handleResponse(response);
};

export const submitTask = async (taskId: number, imageUrl?: string, videoUrl?: string, initials?: string): Promise<Task> => {
  if (config.DEBUG) {
    console.log('🔥 SUBMIT: Submitting task', taskId, 'with media:', { imageUrl, videoUrl, initials });
  }
  
  // Prepare the submission data
  const submissionData: any = {
    initials: initials,
  };
  
  // Only include media URLs if they are provided
  if (imageUrl) {
    submissionData.image_url = imageUrl;
  }
  if (videoUrl) {
    submissionData.video_url = videoUrl;
  }
  
  const response = await fetchWithRetryAndAuth(`${API_BASE_URL}/tasks/${taskId}/submit`, {
    method: 'PATCH',
    headers: await getHeaders(true, 'PATCH', `${API_BASE_URL}/tasks/${taskId}/submit`), // Include CSRF token
    body: JSON.stringify(submissionData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to submit task: ${response.status}`;
    console.error('🔥 SUBMIT ERROR:', errorMessage, errorData);
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  if (config.DEBUG) {
    console.log('🔥 SUBMIT: Task submitted successfully:', data);
  }
  return data;
};

export const approveTask = async (taskId: number): Promise<Task> => {
  if (config.DEBUG) {
    console.log('🔥 APPROVE: Approving task', taskId);
  }
  
  const response = await fetchWithRetryAndAuth(`${API_BASE_URL}/tasks/${taskId}/approve`, {
    method: 'PATCH',
    headers: await getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to approve task: ${response.status}`);
  }
  
  const data = await response.json();
  if (config.DEBUG) {
    console.log('🔥 APPROVE: Task approved successfully:', data);
  }
  return data;
};

export const declineTask = async (taskId: number, reason: string): Promise<Task> => {
  if (config.DEBUG) {
    console.log('🔥 DECLINE: Declining task', taskId, 'with reason:', reason);
  }
  
  const response = await fetchWithRetryAndAuth(`${API_BASE_URL}/tasks/${taskId}/decline`, {
    method: 'PATCH',
    headers: await getHeaders(),
    body: JSON.stringify({
      reason: reason,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to decline task: ${response.status}`);
  }
  
  const data = await response.json();
  if (config.DEBUG) {
    console.log('🔥 DECLINE: Task declined successfully:', data);
  }
  return data;
};

export const deleteTask = async (taskId: number): Promise<void> => {
  if (config.DEBUG) {
    console.log('🔥 DELETE: Deleting task', taskId);
  }
  
  const response = await fetchWithRetryAndAuth(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: await getHeaders(true, 'DELETE', `${API_BASE_URL}/tasks/${taskId}`), // Include CSRF token
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete task: ${response.status}`);
  }
  
  if (config.DEBUG) {
    console.log('🔥 DELETE: Task deleted successfully');
  }
};

export const assignTask = async (taskId: number, userId: number): Promise<Task> => {
  // Note: Backend doesn't have /assign endpoint
  // This functionality may need to be implemented in the backend first
  console.warn(`Attempted to assign task ${taskId} to user ${userId}, but backend doesn't support this yet`);
  throw new Error('Task assignment functionality not yet implemented in backend');
  
  // When backend implements this, use:
  // const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/assign`, {
  //   method: 'PATCH',
  //   headers: getHeaders(),
  //   body: JSON.stringify({ user_id: userId }),
  // });
  // return handleResponse(response);
};

export const updateTaskInitials = async (taskId: number, initials: string): Promise<Task> => {
  if (config.DEBUG) {
    console.log('🔥 UPDATE INITIALS: Updating task', taskId, 'with initials:', initials);
  }
  
  const response = await fetchWithRetryAndAuth(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: await getHeaders(true, 'PUT', `${API_BASE_URL}/tasks/${taskId}`), // Include CSRF token
    body: JSON.stringify({
      initials: initials,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update task initials: ${response.status}`);
  }
  
  const data = await response.json();
  if (config.DEBUG) {
    console.log('🔥 UPDATE INITIALS: Task initials updated successfully:', data);
  }
  return data;
};

// File upload API
export const uploadFile = async (taskId: number, file: File, type: 'image' | 'video'): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('task_id', taskId.toString());
  
  // Use enhanced token retrieval
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('⚠️ No auth token found for file upload');
  }
  
  // Don't set Content-Type for FormData - let browser set it with boundary
  const response = await fetchWithRetryAndAuth(`${API_BASE_URL}/upload/${type}`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error('File upload failed:', response.status, errorText);
    throw new Error(`File upload failed: ${response.status} - ${errorText}`);
  }
  
  return handleResponse(response);
};

// Default export for easy imports
const apiService = {
  login,
  register,
  checkAuth,
  getTasks,
  createTask,
  updateTaskStatus,
  submitTask,
  approveTask,
  declineTask,
  deleteTask,
  assignTask,
  updateTaskInitials,
  uploadFile,
};

export default apiService;
