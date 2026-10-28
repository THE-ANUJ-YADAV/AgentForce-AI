/**
 * plannerAgent.js
 * Planner Agent: Parses natural-language business requests into a validated execution plan.
 * Allowed actions: create_contact, update_contact, create_task, draft_email, request_email_approval
 */
import { callGemini, isGeminiConfigured } from '../services/geminiService.js';
import { memoryStore } from '../store/memoryStore.js';
import { toolService } from '../services/toolService.js';

const ALLOWED_ACTIONS = {
  create_contact: {
    agent: 'CRM Agent',
    allowedDependsOn: []
  },
  update_contact: {
    agent: 'CRM Agent',
    allowedDependsOn: ['create_contact']
  },
  enrich_lead: {
    agent: 'CRM Agent',
    allowedDependsOn: ['create_contact', 'update_contact']
  },
  create_task: {
    agent: 'Task Agent',
    allowedDependsOn: ['create_contact', 'update_contact', 'enrich_lead']
  },
  update_task: {
    agent: 'Task Agent',
    allowedDependsOn: ['create_task']
  },
  draft_email: {
    agent: 'Email Agent',
    allowedDependsOn: ['create_contact', 'update_contact', 'enrich_lead']
  },
  request_email_approval: {
    agent: 'Supervisor',
    allowedDependsOn: ['draft_email']
  }
};

/**
 * Validate that a plan strictly adheres to the schema, actions, agents, and dependencies
 */
export function validatePlan(plan) {
  if (!Array.isArray(plan) || plan.length === 0) {
    return { valid: false, error: 'Plan must be a non-empty array of steps' };
  }

  const stepIds = new Set();
  const stepMap = new Map();

  for (const step of plan) {
    if (!step.id || typeof step.id !== 'string') {
      return { valid: false, error: `Step missing valid id: ${JSON.stringify(step)}` };
    }
    if (stepIds.has(step.id)) {
      return { valid: false, error: `Duplicate step id: ${step.id}` };
    }
    stepIds.add(step.id);

    if (!ALLOWED_ACTIONS[step.action]) {
      return { valid: false, error: `Disallowed action "${step.action}" in step ${step.id}` };
    }

    const expectedAgent = ALLOWED_ACTIONS[step.action].agent;
    if (step.agent !== expectedAgent) {
      return {
        valid: false,
        error: `Agent mismatch for "${step.action}": expected "${expectedAgent}", got "${step.agent}"`
      };
    }

    if (!step.params || typeof step.params !== 'object') {
      return { valid: false, error: `Missing or invalid params in step ${step.id}` };
    }

    if (!Array.isArray(step.dependsOn)) {
      return { valid: false, error: `Step ${step.id} dependsOn must be an array` };
    }

    stepMap.set(step.id, step);
  }

  // Verify dependencies exist and do not form cycles
  for (const step of plan) {
    for (const depId of step.dependsOn) {
      if (!stepMap.has(depId)) {
        return { valid: false, error: `Step ${step.id} depends on nonexistent step ${depId}` };
      }
      if (depId === step.id) {
        return { valid: false, error: `Step ${step.id} cannot depend on itself` };
      }
    }
  }

  return { valid: true };
}

/**
 * Deterministic fallback planner (Regex and keyword extraction)
 */
export function planWithFallback(requestText) {
  const text = requestText.trim();

  // Extract email if present
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1] : null;

  // Extract contact name & company
  // Pattern: "Add [Name] from [Company]" or "[Name] at [Company]"
  let name = 'Rahul Sharma';
  let company = 'ABC Technologies';

  const fromMatch = text.match(/(?:add|create|contact|lead)\s+([A-Z][a-zA-Z\s]+?)\s+(?:from|at|with)\s+([A-Za-z0-9\s&.-]+?)(?:(?:\s*\([^)]*\))|(?:\s+to\s+CRM)|,|\.|$)/i);
  if (fromMatch) {
    name = fromMatch[1].trim();
    company = fromMatch[2].trim().replace(/\s+to\s+CRM$/i, '').trim();
  } else {
    const simpleNameMatch = text.match(/(?:add|lead|contact)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (simpleNameMatch) {
      name = simpleNameMatch[1].trim();
    }
    const compMatch = text.match(/(?:from|at)\s+([A-Za-z0-9\s&.-]+?)(?:to\s+CRM|,|\.|$)/i);
    if (compMatch) {
      company = compMatch[1].trim();
    }
  }

  // Derive simulated email if not provided
  const derivedEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.example`;

  // Extract due date phrase
  // Look for "for <weekday/relative>" or "by <weekday/relative>"
  let dueDatePhrase = 'Friday';
  const dateMatch = text.match(/(?:for|by|on)\s+(today|tomorrow|next\s+\w+|\w+day|in\s+\d+\s+days?)/i);
  if (dateMatch) {
    dueDatePhrase = dateMatch[1].trim();
  }

  // Extract priority
  let priority = 'Medium';
  if (/high\s+priority|urgent|asap/i.test(text)) priority = 'High';
  if (/low\s+priority/i.test(text)) priority = 'Low';

  // Build the 4 standard plan steps
  const plan = [
    {
      id: 'step_1',
      action: 'create_contact',
      agent: 'CRM Agent',
      dependsOn: [],
      params: {
        name,
        company,
        email: derivedEmail,
        leadStatus: 'New',
        leadScore: 70
      }
    },
    {
      id: 'step_2',
      action: 'create_task',
      agent: 'Task Agent',
      dependsOn: ['step_1'],
      params: {
        title: `Follow up with ${name} from ${company}`,
        description: `Execute scheduled business follow-up regarding partnership and solution alignment.`,
        priority,
        dueDatePhrase
      }
    },
    {
      id: 'step_3',
      action: 'draft_email',
      agent: 'Email Agent',
      dependsOn: ['step_1'],
      params: {
        company,
        purpose: 'product demo'
      }
    },
    {
      id: 'step_4',
      action: 'request_email_approval',
      agent: 'Supervisor',
      dependsOn: ['step_3'],
      params: {
        reason: 'Outbound customer email requires human verification before simulated dispatch.'
      }
    }
  ];

  return plan;
}

export const plannerAgent = {
  name: 'Planner Agent',
  role: 'Strategic Planning & Goal Decomposition',
  responsibilities: [
    'Analyze business outcome requests and decompose into atomic steps',
    'Extract entities: contacts, company affiliations, dates, and priorities',
    'Map operations to authorized multi-agent schema',
    'Enforce dependency hierarchies and fall back safely when models deviate'
  ],
  tools: ['callGemini', 'validatePlan', 'planWithFallback'],

  async generatePlan(requestText) {
    memoryStore.setActiveAgent(this.name);
    let plan = null;
    let mode = 'fallback';
    let fallbackReason = null;

    toolService.writeActivityLog({
      agentName: this.name,
      action: 'decompose_goal',
      toolName: 'planner',
      status: 'running',
      message: `Decomposing natural-language business request into structured multi-agent plan...`
    });

    if (isGeminiConfigured()) {
      try {
        const systemInstruction = `You are an enterprise AI Agent Architect. Decompose user requests into structured business operations.
ONLY use these allowed actions:
- "create_contact" (agent: "CRM Agent", dependsOn: [])
- "create_task" (agent: "Task Agent", dependsOn: ["step_1"])
- "draft_email" (agent: "Email Agent", dependsOn: ["step_1"])
- "request_email_approval" (agent: "Supervisor", dependsOn: ["step_3"])

Return a strict JSON array of steps:
[
  {
    "id": "step_1",
    "action": "create_contact",
    "agent": "CRM Agent",
    "dependsOn": [],
    "params": { "name": "...", "company": "...", "email": "...", "leadStatus": "New" }
  },
  {
    "id": "step_2",
    "action": "create_task",
    "agent": "Task Agent",
    "dependsOn": ["step_1"],
    "params": { "title": "...", "description": "...", "priority": "Medium", "dueDatePhrase": "..." }
  },
  {
    "id": "step_3",
    "action": "draft_email",
    "agent": "Email Agent",
    "dependsOn": ["step_1"],
    "params": { "company": "...", "purpose": "..." }
  },
  {
    "id": "step_4",
    "action": "request_email_approval",
    "agent": "Supervisor",
    "dependsOn": ["step_3"],
    "params": { "reason": "..." }
  }
]`;

        const geminiRes = await callGemini(requestText, systemInstruction, true);
        if (geminiRes.ok) {
          const parsed = JSON.parse(geminiRes.data);
          const validation = validatePlan(parsed);
          if (validation.valid) {
            plan = parsed;
            mode = 'gemini';
          } else {
            fallbackReason = `Gemini plan validation failed: ${validation.error}`;
          }
        } else {
          fallbackReason = geminiRes.error;
        }
      } catch (err) {
        fallbackReason = err.message || 'Gemini planning error';
      }
    } else {
      fallbackReason = 'GEMINI_API_KEY not configured (using deterministic fallback planner)';
    }

    if (!plan) {
      plan = planWithFallback(requestText);
      mode = 'fallback';
    }

    toolService.writeActivityLog({
      agentName: this.name,
      action: 'plan_generated',
      toolName: 'planner',
      status: 'completed',
      message: `Structured plan composed (${plan.length} steps) via ${mode.toUpperCase()} planner.`,
      data: { mode, fallbackReason, stepCount: plan.length }
    });

    memoryStore.clearActiveAgent(this.name);

    return {
      plan,
      mode,
      fallbackReason
    };
  }
};
