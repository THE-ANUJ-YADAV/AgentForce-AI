/**
 * api.js
 * Frontend API client targeting the Express backend.
 */

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = body?.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.code = body?.error?.code;
    throw err;
  }

  return body?.data;
}

export const api = {
  getHealth: () => request('/api/health'),
  getWorkflows: () => request('/api/workflows'),
  getWorkflow: (id) => request(`/api/workflows/${id}`),
  createWorkflow: (requestText) =>
    request('/api/workflows', {
      method: 'POST',
      body: JSON.stringify({ request: requestText })
    }),
  retryStep: (workflowId, stepId) =>
    request(`/api/workflows/${workflowId}/steps/${stepId}/retry`, {
      method: 'POST'
    }),
  getTasks: () => request('/api/tasks'),
  createTask: (taskData) =>
    request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    }),
  updateTask: (id, updates) =>
    request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  updateTaskStatus: (id, status) =>
    request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  deleteTask: (id) =>
    request(`/api/tasks/${id}`, {
      method: 'DELETE'
    }),
  getCrmContacts: () => request('/api/crm'),
  createContact: (contactData) =>
    request('/api/crm', {
      method: 'POST',
      body: JSON.stringify(contactData)
    }),
  updateContact: (id, updates) =>
    request(`/api/crm/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteContact: (id) =>
    request(`/api/crm/${id}`, {
      method: 'DELETE'
    }),
  getApprovals: () => request('/api/approvals'),
  approveAction: (id, reviewer = 'Demo Reviewer') =>
    request(`/api/approvals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewer })
    }),
  rejectAction: (id, reviewer = 'Demo Reviewer') =>
    request(`/api/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewer })
    }),
  getActivityLogs: () => request('/api/logs'),
  resetAdminData: () =>
    request('/api/admin/reset', {
      method: 'POST'
    })
};
