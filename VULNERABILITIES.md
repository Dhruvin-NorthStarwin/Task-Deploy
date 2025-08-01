# Security Vulnerability Report

This document outlines potential security vulnerabilities found in the codebase.

## 1. Cross-Site Scripting (XSS)

**Location:** `frontend/src/components/admin/AdminTaskPanel.tsx`

**Description:**
User-provided content, specifically the `task.task` and `task.description` fields, is rendered directly into the DOM without proper sanitization. An attacker could potentially inject malicious HTML or script tags into these fields. When displayed on the admin panel, these scripts would execute in the browser of the admin user, leading to session hijacking, data theft, or other malicious actions.

**Example:**
A task with the name `<img src=x onerror=alert('XSS')>` would execute the `alert` script.

**Recommendation:**
Sanitize all user-provided input before rendering it in the DOM. A library like `DOMPurify` should be used to clean the HTML content.

**Example Fix:**
```tsx
// before
<h3>{task.task}</h3>

// after
import DOMPurify from 'dompurify';
<h3 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(task.task) }} />
```

## 2. Data Inconsistency on API Failure

**Location:** `frontend/src/components/admin/AdminTaskPanel.tsx` in `handleAddTask`

**Description:**
The `handleAddTask` function attempts to create a new task via an API call. If the API call fails, the code proceeds to create the task locally in the component's state. This creates a discrepancy between the frontend's view of the data and the actual data stored in the backend database. This can lead to a confusing user experience and potential data integrity issues.

**Recommendation:**
If the API call fails, the local state should not be updated with the new task. Instead, an error message should be displayed to the user, informing them that the task could not be created and that they should try again. The local state should remain consistent with the backend.

## 3. Potential for Insecure Direct Object Reference (IDOR)

**Location:** `frontend/src/services/apiService.ts` (e.g., `deleteTask`, `approveTask`, `declineTask`) and the corresponding backend implementation.

**Description:**
The frontend makes API calls to perform actions on tasks using their `taskId`. For example, `deleteTask(taskId)`. The backend needs to ensure that the authenticated user has the necessary permissions to perform the requested action on the *specific* task identified by `taskId`. Without this check, a malicious user could potentially manipulate API requests to delete, approve, or decline tasks they are not authorized to access, simply by guessing or obtaining valid `taskId`s.

**Recommendation:**
The backend API endpoints for all state-changing operations on tasks must implement strict authorization checks. Before performing any action, the backend should verify that the user associated with the request has the ownership or required privileges over the task object.

## 4. Missing Cross-Site Request Forgery (CSRF) Protection

**Location:** Throughout the application, especially in `frontend/src/services/apiService.ts`.

**Description:**
The application does not appear to use anti-CSRF tokens for state-changing requests (POST, PUT, DELETE, PATCH). A CSRF attack could trick an authenticated user into unknowingly submitting a malicious request. For example, an attacker could host a malicious website with a hidden form that, when visited by an authenticated admin, sends a request to delete a task.

**Recommendation:**
Implement CSRF protection. A common method is to use the double-submit cookie pattern. The server generates a CSRF token and sets it as a cookie. The frontend reads the token from the cookie and includes it in a custom HTTP header (e.g., `X-CSRF-Token`) for all state-changing requests. The server then validates that the token in the header matches the token in the cookie.

## 5. Sensitive Data Exposure in Logs

**Location:** `frontend/src/services/apiService.ts` in the `register` function.

**Description:**
The `register` function logs registration data. While the password is redacted, other Personally Identifiable Information (PII) like name, email, and phone number are logged when `config.DEBUG` is true. If debug logs are accidentally enabled in a production or staging environment, this could lead to the exposure of sensitive user data in the logs.

**Recommendation:**
Review all logging statements to ensure that no PII or other sensitive data is logged, even in debug mode. If logging is necessary for debugging, ensure that there are strict controls to prevent debug logging in production environments. Consider redacting more fields than just the password.
