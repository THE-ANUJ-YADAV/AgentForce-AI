/**
 * supervisorAgent.js
 * Supervisor / Orchestrator Agent: Coordinates multi-agent execution, manages dependencies,
 * enforces human approval gates, and calculates workflow summaries.
 */
import { memoryStore } from '../store/memoryStore.js';
import { toolService } from '../services/toolService.js';
import { crmAgent } from './crmAgent.js';
import { taskAgent } from './taskAgent.js';
import { emailAgent } from './emailAgent.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const supervisorAgent = {
  name: 'Supervisor',
  role: 'Workforce Orchestrator & Governance',
  responsibilities: [
    'Supervise multi-agent step transitions and enforce execution dependencies',
    'Execute independent operations in parallel or sequential pipeline',
    'Gate high-stakes external actions behind human-in-the-loop approvals',
    'Track operational metrics, retries, and synthesize executive summaries'
  ],
  tools: ['requestApproval', 'executeApprovedAction', 'writeActivityLog'],

  /**
   * Calculate final workflow summary
   */
  generateWorkflowSummary(workflow) {
    const totalSteps = workflow.steps.length;
    const completed = workflow.steps.filter((s) => s.status === 'completed').length;
    const failed = workflow.steps.filter((s) => s.status === 'failed').length;
    const blocked = workflow.steps.filter((s) => s.status === 'blocked').length;
    const awaiting = workflow.steps.filter((s) => s.status === 'awaiting_approval').length;
    const rejected = workflow.steps.filter((s) => s.status === 'rejected').length;

    let resolvedDueDate = null;
    const taskStep = workflow.steps.find((s) => s.action === 'create_task');
    if (taskStep?.output?.resolvedDate) {
      resolvedDueDate = `${taskStep.output.resolvedDate.friendly} (${taskStep.output.resolvedDate.iso})`;
    }

    let approvalOutcome = 'none';
    const approval = memoryStore.findApprovalByWorkflowId(workflow.id);
    if (approval) {
      approvalOutcome = approval.status;
    }

    let outcomeText = '';
    if (workflow.status === 'completed') {
      outcomeText = `All ${totalSteps} operations executed successfully. Business request fully satisfied.`;
    } else if (workflow.status === 'awaiting_approval') {
      outcomeText = `Execution paused. 1 action requires human approval in the Approval Queue before final dispatch.`;
    } else if (workflow.status === 'partially_completed') {
      outcomeText = `Completed with exceptions: ${completed} passed, ${failed} failed, ${blocked} blocked. Retry available on failed operations.`;
    } else if (workflow.status === 'rejected') {
      outcomeText = `Workflow terminated because outbound action was rejected by human reviewer.`;
    } else if (workflow.status === 'failed') {
      outcomeText = `Workflow halted due to operational failure in core dependencies.`;
    } else {
      outcomeText = `Workflow in progress (${completed}/${totalSteps} complete).`;
    }

    return {
      totalSteps,
      completedSteps: completed,
      failedSteps: failed,
      blockedSteps: blocked,
      awaitingApprovalSteps: awaiting,
      rejectedSteps: rejected,
      approvalOutcome,
      resolvedDueDate,
      outcomeText
    };
  },

  /**
   * Determine the current aggregate workflow status based on step states
   */
  calculateWorkflowStatus(workflow) {
    const hasAwaiting = workflow.steps.some((s) => s.status === 'awaiting_approval');
    if (hasAwaiting) return 'awaiting_approval';

    const hasRunning = workflow.steps.some((s) => s.status === 'running' || s.status === 'pending');
    if (hasRunning) return 'running';

    const hasRejected = workflow.steps.some((s) => s.status === 'rejected');
    const hasFailed = workflow.steps.some((s) => s.status === 'failed');
    const hasBlocked = workflow.steps.some((s) => s.status === 'blocked');
    const allCompleted = workflow.steps.every((s) => s.status === 'completed');

    if (allCompleted) return 'completed';
    if (hasRejected) return 'rejected';
    if (hasFailed || hasBlocked) {
      const anyCompleted = workflow.steps.some((s) => s.status === 'completed');
      return anyCompleted ? 'partially_completed' : 'failed';
    }
    return 'pending';
  },

  /**
   * Execute an individual step by dispatching to the responsible agent
   */
  async executeStep(step, workflow) {
    memoryStore.updateWorkflowStep(workflow.id, step.id, {
      status: 'running',
      error: null
    });

    memoryStore.addWorkflowThought(workflow.id, {
      agent: step.agent,
      text: `Dispatching action "${step.action}" with parameters: ${JSON.stringify(step.params)}. Checking state preconditions.`
    });

    try {
      let output = null;

      if (step.agent === 'CRM Agent') {
        output = await crmAgent.executeStep(step, workflow);
      } else if (step.agent === 'Task Agent') {
        output = await taskAgent.executeStep(step, workflow);
      } else if (step.agent === 'Email Agent') {
        output = await emailAgent.executeStep(step, workflow);
      } else if (step.agent === 'Supervisor' && step.action === 'request_email_approval') {
        memoryStore.setActiveAgent(this.name);
        try {
          // Find draft from previous draft_email step
          const emailStep = workflow.steps.find((s) => s.action === 'draft_email');
          const draftData = emailStep?.output?.draft;

          const recipient = draftData?.recipient || {
            name: 'Contact',
            email: 'contact@example.com',
            company: 'Company'
          };

          const apprRes = toolService.requestApproval({
            workflowId: workflow.id,
            stepId: step.id,
            recipient,
            proposedSubject: draftData?.subject || 'Product Demonstration',
            proposedBody: draftData?.body || 'Follow-up email',
            reason: step.params?.reason || 'Outbound email requires human sign-off'
          });

          if (!apprRes.ok) {
            throw new Error(apprRes.error);
          }

          memoryStore.updateWorkflow(workflow.id, { approvalId: apprRes.data.id });

          toolService.writeActivityLog({
            workflowId: workflow.id,
            agentName: this.name,
            action: 'request_email_approval',
            toolName: 'requestApproval',
            status: 'completed',
            message: `Created approval gate (${apprRes.data.id}) for outbound email to ${recipient.email}. Pausing execution for human review.`,
            data: apprRes.data
          });

          // Mark step awaiting_approval
          memoryStore.updateWorkflowStep(workflow.id, step.id, {
            status: 'awaiting_approval',
            output: { approval: apprRes.data }
          });

          memoryStore.addWorkflowThought(workflow.id, {
            agent: 'Supervisor',
            text: `Approval gate established (${apprRes.data.id}) for outbound communication to ${recipient.email}. Execution paused awaiting human sign-off.`
          });

          return { awaitingApproval: true, approval: apprRes.data };
        } finally {
          memoryStore.clearActiveAgent(this.name);
        }
      } else {
        throw new Error(`Unsupported agent "${step.agent}" or action "${step.action}"`);
      }

      memoryStore.updateWorkflowStep(workflow.id, step.id, {
        status: 'completed',
        output
      });

      memoryStore.addWorkflowThought(workflow.id, {
        agent: step.agent,
        text: `Operation "${step.action}" completed successfully. Produced output: ${JSON.stringify(output?.operation || 'ok')}.`
      });

      return { completed: true, output };
    } catch (err) {
      memoryStore.updateWorkflowStep(workflow.id, step.id, {
        status: 'failed',
        error: err.message
      });

      memoryStore.addWorkflowThought(workflow.id, {
        agent: step.agent,
        text: `Error during "${step.action}": ${err.message}. Ready for human inspection and isolated retry.`
      });

      return { failed: true, error: err.message };
    }
  },

  /**
   * Run the workflow orchestration loop asynchronously
   */
  async runWorkflow(workflowId) {
    const workflow = memoryStore.findWorkflowById(workflowId);
    if (!workflow) return;

    memoryStore.updateWorkflow(workflowId, { status: 'running' });

    // Step-by-step orchestration
    for (const step of workflow.steps) {
      // Check dependencies
      let depsSatisfied = true;
      let failedDep = null;

      for (const depId of step.dependsOn) {
        const depStep = workflow.steps.find((s) => s.id === depId);
        if (!depStep || depStep.status !== 'completed') {
          depsSatisfied = false;
          failedDep = depStep;
          break;
        }
      }

      if (!depsSatisfied) {
        // Mark step as blocked
        const reason = failedDep
          ? `Blocked: dependent step "${failedDep.id}" (${failedDep.action}) has status "${failedDep.status}"`
          : `Blocked: missing dependent step`;
        memoryStore.updateWorkflowStep(workflowId, step.id, {
          status: 'blocked',
          error: reason
        });
        toolService.writeActivityLog({
          workflowId,
          agentName: this.name,
          action: 'dependency_check',
          status: 'failed',
          message: reason
        });
        continue;
      }

      // Artificial delay (300-600ms) for realistic agent activity visualization
      await delay(450);

      // Execute step
      const result = await this.executeStep(step, workflow);

      // If awaiting approval, stop sequential execution until human reviews
      if (result.awaitingApproval) {
        break;
      }
    }

    // Refresh workflow record and update status & summary
    const refreshed = memoryStore.findWorkflowById(workflowId);
    const newStatus = this.calculateWorkflowStatus(refreshed);
    refreshed.status = newStatus;
    const summary = this.generateWorkflowSummary(refreshed);

    memoryStore.updateWorkflow(workflowId, {
      status: newStatus,
      summary
    });
  },

  /**
   * Handle human approval resolution
   */
  async resolveApproval(approvalId, decision, reviewer = 'Demo Reviewer') {
    const approval = memoryStore.findApprovalById(approvalId);
    if (!approval) {
      return { ok: false, status: 404, error: 'Approval request not found' };
    }

    if (approval.status !== 'pending') {
      return { ok: false, status: 409, error: `Approval is already ${approval.status}` };
    }

    const workflow = memoryStore.findWorkflowById(approval.workflowId);
    if (!workflow) {
      return { ok: false, status: 404, error: 'Associated workflow not found' };
    }

    if (decision === 'approve') {
      // Execute approved action
      const execRes = await toolService.executeApprovedAction({ approvalId, reviewer });
      if (!execRes.ok) {
        return execRes;
      }

      // Mark the corresponding step as completed
      memoryStore.updateWorkflowStep(workflow.id, approval.stepId, {
        status: 'completed',
        output: {
          execution: execRes.data.executionResult
        }
      });

      toolService.writeActivityLog({
        workflowId: workflow.id,
        agentName: this.name,
        action: 'executeApprovedAction',
        toolName: 'executeApprovedAction',
        status: 'completed',
        message: `Approved action executed by ${reviewer}: Simulated email dispatched to ${approval.recipient.email}.`,
        data: execRes.data.executionResult
      });
    } else {
      // Rejection
      memoryStore.updateApproval(approvalId, {
        status: 'rejected',
        reviewer,
        decisionTimestamp: new Date().toISOString()
      });

      memoryStore.updateWorkflowStep(workflow.id, approval.stepId, {
        status: 'rejected',
        error: `Action rejected by human reviewer (${reviewer})`
      });

      toolService.writeActivityLog({
        workflowId: workflow.id,
        agentName: this.name,
        action: 'reject_action',
        toolName: 'rejectApproval',
        status: 'completed',
        message: `Outbound action rejected by ${reviewer}. Email transmission halted.`,
        data: { approvalId, reviewer }
      });
    }

    // Recalculate workflow status and summary
    const updatedWf = memoryStore.findWorkflowById(workflow.id);
    const finalStatus = this.calculateWorkflowStatus(updatedWf);
    updatedWf.status = finalStatus;
    const summary = this.generateWorkflowSummary(updatedWf);

    memoryStore.updateWorkflow(workflow.id, {
      status: finalStatus,
      summary
    });

    return {
      ok: true,
      data: {
        approval: memoryStore.findApprovalById(approvalId),
        workflow: updatedWf
      }
    };
  },

  /**
   * Retry a failed step
   */
  async retryStep(workflowId, stepId) {
    const workflow = memoryStore.findWorkflowById(workflowId);
    if (!workflow) {
      return { ok: false, status: 404, error: 'Workflow not found' };
    }

    const step = workflow.steps.find((s) => s.id === stepId);
    if (!step) {
      return { ok: false, status: 404, error: 'Step not found' };
    }

    if (step.status !== 'failed') {
      return {
        ok: false,
        status: 409,
        error: `Only steps with "failed" status can be retried. Current step status: "${step.status}".`
      };
    }

    const currentRetryCount = step.retryCount || 0;
    if (currentRetryCount >= 3) {
      return {
        ok: false,
        status: 422,
        error: `Maximum retry limit (3) exceeded for step "${stepId}".`
      };
    }

    const nextRetryCount = currentRetryCount + 1;
    memoryStore.updateWorkflowStep(workflowId, stepId, {
      retryCount: nextRetryCount,
      status: 'running'
    });

    toolService.writeActivityLog({
      workflowId,
      agentName: this.name,
      action: 'retry_step',
      toolName: 'retryStep',
      status: 'running',
      message: `Retrying step "${stepId}" (${step.action}) [Attempt ${nextRetryCount}/3]...`,
      data: { stepId, nextRetryCount }
    });

    // Execute step
    const result = await this.executeStep(step, workflow);

    // After step execution, check if any dependent steps were blocked and can now run
    if (result.completed) {
      // Look for blocked dependent steps
      const blockedDependents = workflow.steps.filter(
        (s) => s.status === 'blocked' && s.dependsOn.includes(stepId)
      );

      for (const depStep of blockedDependents) {
        // Check if all its deps are now completed
        const allDepsReady = depStep.dependsOn.every(
          (d) => workflow.steps.find((s) => s.id === d)?.status === 'completed'
        );
        if (allDepsReady) {
          await delay(300);
          await this.executeStep(depStep, workflow);
        }
      }
    }

    // Refresh workflow status & summary
    const refreshed = memoryStore.findWorkflowById(workflowId);
    const newStatus = this.calculateWorkflowStatus(refreshed);
    refreshed.status = newStatus;
    const summary = this.generateWorkflowSummary(refreshed);

    memoryStore.updateWorkflow(workflowId, {
      status: newStatus,
      summary
    });

    return {
      ok: true,
      data: {
        step: memoryStore.findWorkflowById(workflowId).steps.find((s) => s.id === stepId),
        workflow: memoryStore.findWorkflowById(workflowId)
      }
    };
  }
};
