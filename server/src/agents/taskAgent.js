/**
 * taskAgent.js
 * Task Agent: Manages actionable business items, schedules dates, and assigns follow-ups.
 */
import { toolService } from '../services/toolService.js';
import { memoryStore } from '../store/memoryStore.js';

export const taskAgent = {
  name: 'Task Agent',
  role: 'Workforce Operations & Task Scheduling',
  responsibilities: [
    'Parse relative business deadlines into deterministic IST calendar dates',
    'Generate actionable task records linked to CRM contacts',
    'Assign task priorities and manage operational queue',
    'Handle retries and operational exceptions'
  ],
  tools: ['createTask', 'resolveDate'],

  async executeStep(step, workflowContext) {
    const { params } = step;
    const { title, description, priority, dueDatePhrase, contactId } = params;

    memoryStore.setActiveAgent(this.name);
    toolService.writeActivityLog({
      workflowId: workflowContext.id,
      agentName: this.name,
      action: 'create_task',
      toolName: 'createTask',
      status: 'running',
      message: `Resolving deadline phrase "${dueDatePhrase || 'Friday'}" and creating task "${title}"...`
    });

    try {
      // Determine if demo fail trigger is active
      const requestText = workflowContext.request || '';
      const isDemoFailMarker = requestText.includes('[demo-fail]');
      const isFailEmail = workflowContext.steps.some(
        (s) => s.params?.email === 'fail@test.com' || s.output?.contact?.email === 'fail@test.com'
      );
      const isDemoFailTrigger = isDemoFailMarker || isFailEmail;

      // Associate contact ID from dependency if not directly in params
      let resolvedContactId = contactId;
      if (!resolvedContactId) {
        const contactStep = workflowContext.steps.find((s) => s.output?.contact?.id);
        if (contactStep) {
          resolvedContactId = contactStep.output.contact.id;
        }
      }

      const taskRes = toolService.createTask({
        title,
        description,
        priority: priority || 'Medium',
        dueDatePhrase: dueDatePhrase || 'Friday',
        contactId: resolvedContactId,
        retryCount: step.retryCount || 0,
        isDemoFailTrigger
      });

      if (!taskRes.ok) {
        toolService.writeActivityLog({
          workflowId: workflowContext.id,
          agentName: this.name,
          action: 'create_task',
          toolName: 'createTask',
          status: 'failed',
          message: `Task creation failed: ${taskRes.error}`,
          data: { error: taskRes.error, retryCount: step.retryCount || 0 }
        });
        throw new Error(taskRes.error);
      }

      toolService.writeActivityLog({
        workflowId: workflowContext.id,
        agentName: this.name,
        action: 'create_task',
        toolName: 'createTask',
        status: 'completed',
        message: `Task successfully scheduled for ${taskRes.data.resolvedDate.friendly} (${taskRes.data.resolvedDate.iso}) based on "${taskRes.data.resolvedDate.phrase}".`,
        data: taskRes.data
      });

      return {
        ok: true,
        task: taskRes.data.task,
        resolvedDate: taskRes.data.resolvedDate
      };
    } finally {
      memoryStore.clearActiveAgent(this.name);
    }
  }
};
