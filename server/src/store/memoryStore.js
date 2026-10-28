/**
 * memoryStore.js
 * Persistent State Store with disk backing in server/data/agentforce.db.json.
 * Automatically saves state across server restarts and provides full CRUD methods.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'agentforce.db.json');

// Initial Seed Data
const INITIAL_CONTACTS = [
  {
    id: 'cnt-101',
    name: 'Ananya Iyer',
    company: 'Apex Cloud Solutions',
    email: 'ananya.iyer@apexcloud.example',
    leadStatus: 'Qualified',
    leadScore: 88,
    lastActivity: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'cnt-102',
    name: 'Vikram Patel',
    company: 'FinVantage Systems',
    email: 'vikram.patel@finvantage.example',
    leadStatus: 'Proposal',
    leadScore: 92,
    lastActivity: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'cnt-103',
    name: 'Priya Nambiar',
    company: 'Zenith Logistics',
    email: 'priya.n@zenithlog.example',
    leadStatus: 'Contacted',
    leadScore: 65,
    lastActivity: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'cnt-104',
    name: 'Rohan Deshmukh',
    company: 'BlueWave Digital',
    email: 'rohan.d@bluewave.example',
    leadStatus: 'New',
    leadScore: 50,
    lastActivity: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

const INITIAL_TASKS = [
  {
    id: 'tsk-201',
    title: 'Review Q4 Cloud Migration Proposal with Ananya',
    description: 'Prepare architectural sizing sheet and schedule follow-up presentation.',
    priority: 'High',
    status: 'open',
    dueDate: '2026-10-30',
    dueDateFriendly: 'Fri, 30 Oct 2026',
    dueDatePhrase: 'Friday',
    assignedAgent: 'Task Agent',
    contactId: 'cnt-101',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'tsk-202',
    title: 'Send Revised Contract to Vikram Patel',
    description: 'Incorporate legal feedback on payment terms for FinVantage.',
    priority: 'Medium',
    status: 'in_progress',
    dueDate: '2026-10-31',
    dueDateFriendly: 'Sat, 31 Oct 2026',
    dueDatePhrase: 'in 3 days',
    assignedAgent: 'Task Agent',
    contactId: 'cnt-102',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'tsk-203',
    title: 'Introductory Discovery Call with Zenith Logistics',
    description: 'Discuss supply chain tracking requirements with Priya.',
    priority: 'Low',
    status: 'open',
    dueDate: '2026-11-02',
    dueDateFriendly: 'Mon, 2 Nov 2026',
    dueDatePhrase: 'next Monday',
    assignedAgent: 'Task Agent',
    contactId: 'cnt-103',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 30).toISOString()
  }
];

class PersistentStore {
  constructor() {
    this.activeAgents = new Set();
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.contacts = data.contacts || JSON.parse(JSON.stringify(INITIAL_CONTACTS));
        this.tasks = data.tasks || JSON.parse(JSON.stringify(INITIAL_TASKS));
        this.workflows = data.workflows || [];
        this.approvals = data.approvals || [];
        this.logs = data.logs || [];
        return;
      }
    } catch (err) {
      console.warn('[PersistentStore] Error loading from disk, initializing fresh:', err.message);
    }
    this.reset();
  }

  saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const state = {
        contacts: this.contacts,
        tasks: this.tasks,
        workflows: this.workflows,
        approvals: this.approvals,
        logs: this.logs
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[PersistentStore] Failed to save state to disk:', err.message);
    }
  }

  reset() {
    this.contacts = JSON.parse(JSON.stringify(INITIAL_CONTACTS));
    this.tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
    this.workflows = [];
    this.approvals = [];
    this.logs = [
      {
        id: 'log-init-1',
        timestamp: new Date().toISOString(),
        workflowId: null,
        agentName: 'System',
        action: 'system_initialized',
        toolName: 'store',
        status: 'info',
        message: 'AgentForce AI Persistent Store initialized with seed contacts and tasks',
        data: { contactsCount: INITIAL_CONTACTS.length, tasksCount: INITIAL_TASKS.length }
      }
    ];
    this.saveToDisk();
  }

  // --- Agent Activity State ---
  setActiveAgent(agentName) {
    if (agentName) this.activeAgents.add(agentName);
  }

  clearActiveAgent(agentName) {
    if (agentName) this.activeAgents.delete(agentName);
  }

  getActiveAgents() {
    return Array.from(this.activeAgents);
  }

  // --- Contacts ---
  getContacts() {
    return [...this.contacts];
  }

  findContactById(id) {
    return this.contacts.find((c) => c.id === id) || null;
  }

  findContactByEmail(email) {
    if (!email) return null;
    return this.contacts.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
  }

  findContactByNameAndCompany(name, company) {
    if (!name) return null;
    const cleanName = name.trim().toLowerCase();
    const cleanCompany = (company || '').trim().toLowerCase();
    return (
      this.contacts.find((c) => {
        const matchesName = c.name.toLowerCase() === cleanName;
        if (!cleanCompany) return matchesName;
        return matchesName && c.company.toLowerCase() === cleanCompany;
      }) || null
    );
  }

  createContact(contactData) {
    const contact = {
      id: `cnt-${crypto.randomUUID().slice(0, 8)}`,
      name: contactData.name,
      company: contactData.company || 'Independent',
      email: contactData.email,
      leadStatus: contactData.leadStatus || 'New',
      leadScore: contactData.leadScore ?? 50,
      lastActivity: new Date().toISOString()
    };
    this.contacts.unshift(contact);
    this.saveToDisk();
    return contact;
  }

  updateContact(id, updates) {
    const index = this.contacts.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.contacts[index] = {
      ...this.contacts[index],
      ...updates,
      lastActivity: new Date().toISOString()
    };
    this.saveToDisk();
    return this.contacts[index];
  }

  deleteContact(id) {
    const index = this.contacts.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.contacts.splice(index, 1);
    this.saveToDisk();
    return true;
  }

  // --- Tasks ---
  getTasks() {
    return [...this.tasks];
  }

  findTaskById(id) {
    return this.tasks.find((t) => t.id === id) || null;
  }

  createTask(taskData) {
    const task = {
      id: `tsk-${crypto.randomUUID().slice(0, 8)}`,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'open',
      dueDate: taskData.dueDate,
      dueDateFriendly: taskData.dueDateFriendly,
      dueDatePhrase: taskData.dueDatePhrase,
      assignedAgent: taskData.assignedAgent || 'Task Agent',
      contactId: taskData.contactId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.unshift(task);
    this.saveToDisk();
    return task;
  }

  updateTask(id, updates) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    this.saveToDisk();
    return task;
  }

  updateTaskStatus(id, status) {
    return this.updateTask(id, { status });
  }

  deleteTask(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.tasks.splice(index, 1);
    this.saveToDisk();
    return true;
  }

  // --- Workflows ---
  getWorkflows() {
    return [...this.workflows];
  }

  findWorkflowById(id) {
    return this.workflows.find((w) => w.id === id) || null;
  }

  createWorkflow(workflowData) {
    const workflow = {
      id: `wf-${crypto.randomUUID().slice(0, 8)}`,
      request: workflowData.request,
      status: 'pending',
      plannerMode: workflowData.plannerMode || 'fallback',
      plannerFallbackReason: workflowData.plannerFallbackReason || null,
      plan: workflowData.plan || [],
      steps: workflowData.steps || [],
      approvalId: null,
      summary: null,
      thoughts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.workflows.unshift(workflow);
    this.saveToDisk();
    return workflow;
  }

  addWorkflowThought(workflowId, thought) {
    const workflow = this.findWorkflowById(workflowId);
    if (!workflow) return;
    if (!workflow.thoughts) workflow.thoughts = [];
    workflow.thoughts.push({
      timestamp: new Date().toISOString(),
      agent: thought.agent || 'Supervisor',
      text: thought.text
    });
    this.saveToDisk();
  }

  updateWorkflow(id, updates) {
    const index = this.workflows.findIndex((w) => w.id === id);
    if (index === -1) return null;
    this.workflows[index] = {
      ...this.workflows[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return this.workflows[index];
  }

  updateWorkflowStep(workflowId, stepId, stepUpdates) {
    const workflow = this.findWorkflowById(workflowId);
    if (!workflow) return null;
    const step = workflow.steps.find((s) => s.id === stepId);
    if (!step) return null;
    Object.assign(step, stepUpdates, { updatedAt: new Date().toISOString() });
    workflow.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return step;
  }

  // --- Approvals ---
  getApprovals() {
    return [...this.approvals];
  }

  findApprovalById(id) {
    return this.approvals.find((a) => a.id === id) || null;
  }

  findApprovalByWorkflowId(workflowId) {
    return this.approvals.find((a) => a.workflowId === workflowId) || null;
  }

  createApproval(approvalData) {
    const approval = {
      id: `appr-${crypto.randomUUID().slice(0, 8)}`,
      workflowId: approvalData.workflowId,
      stepId: approvalData.stepId,
      actionType: approvalData.actionType || 'request_email_approval',
      recipient: approvalData.recipient,
      proposedSubject: approvalData.proposedSubject,
      proposedBody: approvalData.proposedBody,
      reason: approvalData.reason || 'Outbound customer email requires human verification before simulated dispatch.',
      status: 'pending', // pending, approved, rejected
      reviewer: null,
      decisionTimestamp: null,
      executionResult: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.approvals.unshift(approval);
    this.saveToDisk();
    return approval;
  }

  updateApproval(id, updates) {
    const index = this.approvals.findIndex((a) => a.id === id);
    if (index === -1) return null;
    this.approvals[index] = {
      ...this.approvals[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return this.approvals[index];
  }

  // --- Activity Logs ---
  getLogs() {
    return [...this.logs];
  }

  writeLog({ workflowId = null, agentName, action, toolName = 'none', status = 'info', message, data = null }) {
    const log = {
      id: `log-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      workflowId,
      agentName,
      action,
      toolName,
      status,
      message,
      data
    };
    this.logs.unshift(log);
    // Keep logs bounded to last 500 entries
    if (this.logs.length > 500) {
      this.logs.length = 500;
    }
    this.saveToDisk();
    return log;
  }
}

export const memoryStore = new PersistentStore();
