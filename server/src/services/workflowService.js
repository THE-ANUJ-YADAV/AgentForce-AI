/**
 * workflowService.js
 * High-level workflow orchestration service connecting Planner and Supervisor.
 */
import { memoryStore } from '../store/memoryStore.js';
import { plannerAgent } from '../agents/plannerAgent.js';
import { supervisorAgent } from '../agents/supervisorAgent.js';
import { toolService } from './toolService.js';

export const workflowService = {
  async createAndStartWorkflow(requestText) {
    if (!requestText || typeof requestText !== 'string' || requestText.trim().length < 10) {
      throw new Error('Business request is required and must be at least 10 characters long.');
    }
    if (requestText.length > 1000) {
      throw new Error('Business request exceeds maximum allowed length of 1000 characters.');
    }

    // 1. Generate plan using Planner Agent
    const planResult = await plannerAgent.generatePlan(requestText);

    // 2. Prepare steps with execution tracking properties
    const steps = planResult.plan.map((step) => ({
      id: step.id,
      action: step.action,
      agent: step.agent,
      dependsOn: step.dependsOn,
      params: step.params,
      status: 'pending', // pending, running, completed, awaiting_approval, failed, rejected, blocked
      output: null,
      error: null,
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // 3. Create workflow record in memoryStore
    const workflow = memoryStore.createWorkflow({
      request: requestText.trim(),
      plannerMode: planResult.mode,
      plannerFallbackReason: planResult.fallbackReason,
      plan: planResult.plan,
      steps
    });

    toolService.writeActivityLog({
      workflowId: workflow.id,
      agentName: 'Supervisor',
      action: 'workflow_created',
      toolName: 'store',
      status: 'info',
      message: `Workflow ${workflow.id} registered with ${steps.length} operational steps. Launching asynchronous execution pipeline.`,
      data: { workflowId: workflow.id, stepCount: steps.length }
    });

    // 4. Asynchronously launch supervisor execution pipeline
    setImmediate(() => {
      supervisorAgent.runWorkflow(workflow.id).catch((err) => {
        console.error(`Error in background workflow execution for ${workflow.id}:`, err);
      });
    });

    return workflow;
  }
};
