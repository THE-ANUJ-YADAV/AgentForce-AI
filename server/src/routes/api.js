/**
 * api.js
 * Express router implementing all REST API endpoints for AgentForce AI.
 */
import { Router } from 'express';
import { memoryStore } from '../store/memoryStore.js';
import { workflowService } from '../services/workflowService.js';
import { supervisorAgent } from '../agents/supervisorAgent.js';
import { isGeminiConfigured, getGeminiModelName } from '../services/geminiService.js';
import { getCurrentIstTime } from '../services/dateService.js';

const router = Router();

// 1. System Health
router.get('/health', (req, res) => {
  const timeInfo = getCurrentIstTime();
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      time: timeInfo.formatted,
      isoTime: timeInfo.iso,
      timezone: timeInfo.timeZone,
      geminiConfigured: isGeminiConfigured(),
      mode: isGeminiConfigured() ? 'Gemini' : 'Fallback',
      model: getGeminiModelName(),
      activeAgents: memoryStore.getActiveAgents()
    }
  });
});

// 2. Workflows
router.post('/workflows', async (req, res, next) => {
  try {
    const { request } = req.body || {};
    if (!request || typeof request !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Field "request" is required in request body.' }
      });
    }

    if (request.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUEST_TOO_SHORT', message: 'Request must contain at least 10 characters.' }
      });
    }

    if (request.length > 1000) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUEST_TOO_LONG', message: 'Request cannot exceed 1000 characters.' }
      });
    }

    const workflow = await workflowService.createAndStartWorkflow(request);
    return res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (err) {
    next(err);
  }
});

router.get('/workflows', (req, res) => {
  const workflows = memoryStore.getWorkflows();
  res.status(200).json({
    success: true,
    data: workflows
  });
});

router.get('/workflows/:id', (req, res) => {
  const workflow = memoryStore.findWorkflowById(req.params.id);
  if (!workflow) {
    return res.status(404).json({
      success: false,
      error: { code: 'WORKFLOW_NOT_FOUND', message: `Workflow "${req.params.id}" not found.` }
    });
  }
  res.status(200).json({
    success: true,
    data: workflow
  });
});

// Step Retry Endpoint
router.post('/workflows/:id/steps/:stepId/retry', async (req, res, next) => {
  try {
    const { id, stepId } = req.params;
    const retryResult = await supervisorAgent.retryStep(id, stepId);

    if (!retryResult.ok) {
      return res.status(retryResult.status || 400).json({
        success: false,
        error: { code: 'RETRY_FAILED', message: retryResult.error }
      });
    }

    return res.status(200).json({
      success: true,
      data: retryResult.data
    });
  } catch (err) {
    next(err);
  }
});

// 3. Tasks
router.get('/tasks', (req, res) => {
  const tasks = memoryStore.getTasks();
  res.status(200).json({
    success: true,
    data: tasks
  });
});

router.post('/tasks', (req, res) => {
  const { title, description, priority, dueDatePhrase, dueDate, dueDateFriendly, contactId } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TITLE', message: 'Task title is required.' }
    });
  }

  const created = memoryStore.createTask({
    title: title.trim(),
    description: description || '',
    priority: priority || 'Medium',
    status: 'open',
    dueDate: dueDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    dueDateFriendly: dueDateFriendly || 'In 2 days',
    dueDatePhrase: dueDatePhrase || 'in 2 days',
    assignedAgent: 'Task Agent',
    contactId: contactId || null
  });

  res.status(201).json({
    success: true,
    data: created
  });
});

router.patch('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  const ALLOWED_TASK_STATUSES = ['open', 'in_progress', 'completed'];
  if (updates.status && !ALLOWED_TASK_STATUSES.includes(updates.status)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${ALLOWED_TASK_STATUSES.join(', ')}`
      }
    });
  }

  const updated = memoryStore.updateTask(id, updates);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: `Task "${id}" not found.` }
    });
  }

  res.status(200).json({
    success: true,
    data: updated
  });
});

router.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const deleted = memoryStore.deleteTask(id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: `Task "${id}" not found.` }
    });
  }
  res.status(200).json({
    success: true,
    data: { message: `Task ${id} deleted.` }
  });
});

// 4. CRM Contacts
router.get('/crm', (req, res) => {
  const contacts = memoryStore.getContacts();
  res.status(200).json({
    success: true,
    data: contacts
  });
});

router.post('/crm', (req, res) => {
  const { name, company, email, leadStatus, leadScore } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_NAME', message: 'Contact name is required.' }
    });
  }

  const newContact = memoryStore.createContact({
    name: name.trim(),
    company: (company || 'Independent').trim(),
    email: email ? email.trim() : `${name.toLowerCase().replace(/\s+/g, '.')}@${(company || 'example').toLowerCase().replace(/[^a-z0-9]/g, '')}.example`,
    leadStatus: leadStatus || 'New',
    leadScore: leadScore !== undefined ? parseInt(leadScore, 10) : 65
  });

  res.status(201).json({
    success: true,
    data: newContact
  });
});

router.patch('/crm/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  const updated = memoryStore.updateContact(id, updates);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { code: 'CONTACT_NOT_FOUND', message: `Contact "${id}" not found.` }
    });
  }

  res.status(200).json({
    success: true,
    data: updated
  });
});

router.delete('/crm/:id', (req, res) => {
  const { id } = req.params;
  const deleted = memoryStore.deleteContact(id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: { code: 'CONTACT_NOT_FOUND', message: `Contact "${id}" not found.` }
    });
  }

  res.status(200).json({
    success: true,
    data: { message: `Contact ${id} deleted.` }
  });
});

// 5. Approvals
router.get('/approvals', (req, res) => {
  const approvals = memoryStore.getApprovals();
  res.status(200).json({
    success: true,
    data: approvals
  });
});

router.post('/approvals/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewer = 'Demo Reviewer' } = req.body || {};

    const result = await supervisorAgent.resolveApproval(id, 'approve', reviewer);
    if (!result.ok) {
      return res.status(result.status || 400).json({
        success: false,
        error: { code: 'APPROVAL_ERROR', message: result.error }
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (err) {
    next(err);
  }
});

router.post('/approvals/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewer = 'Demo Reviewer' } = req.body || {};

    const result = await supervisorAgent.resolveApproval(id, 'reject', reviewer);
    if (!result.ok) {
      return res.status(result.status || 400).json({
        success: false,
        error: { code: 'REJECTION_ERROR', message: result.error }
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (err) {
    next(err);
  }
});

// 6. Activity Logs
router.get('/logs', (req, res) => {
  const logs = memoryStore.getLogs();
  res.status(200).json({
    success: true,
    data: logs
  });
});

// 7. Admin Reset
router.post('/admin/reset', (req, res) => {
  memoryStore.reset();
  res.status(200).json({
    success: true,
    data: {
      message: 'Demo state reset successfully. Contacts and tasks restored to initial seeds.'
    }
  });
});

export default router;
