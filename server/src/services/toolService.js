/**
 * toolService.js
 * Executable JavaScript business tools for AgentForce AI.
 * Each returns a structured result: { ok: boolean, data?: any, error?: string }
 */
import { memoryStore } from '../store/memoryStore.js';
import { resolveDate } from './dateService.js';
import { sendOutboundEmail } from './emailService.js';

export const toolService = {
  findContact({ email, name, company }) {
    try {
      let contact = null;
      if (email) {
        contact = memoryStore.findContactByEmail(email);
      }
      if (!contact && name) {
        contact = memoryStore.findContactByNameAndCompany(name, company);
      }
      return { ok: true, data: contact };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  createContact({ name, company, email, leadStatus = 'New', leadScore = 60 }) {
    try {
      if (!name) {
        return { ok: false, error: 'Contact name is required' };
      }
      const newContact = memoryStore.createContact({
        name,
        company: company || 'Independent',
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@${(company || 'example').toLowerCase().replace(/\s+/g, '')}.example`,
        leadStatus,
        leadScore
      });
      return { ok: true, data: newContact };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  updateContact({ id, updates }) {
    try {
      const updated = memoryStore.updateContact(id, updates);
      if (!updated) {
        return { ok: false, error: `Contact ${id} not found` };
      }
      return { ok: true, data: updated };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  enrichLead({ contactId, company, email }) {
    try {
      const contact = memoryStore.findContactById(contactId);
      if (!contact) {
        return { ok: false, error: `Contact ${contactId} not found for enrichment` };
      }

      // Deduce domain and industry metadata
      const domain = email ? email.split('@')[1] : `${(company || 'tech').toLowerCase().replace(/\s+/g, '')}.com`;
      let industry = 'Technology & Cloud Solutions';
      if (/fin|bank|pay/i.test(company || '')) industry = 'Financial Technology & Capital Systems';
      if (/log|supply|ship/i.test(company || '')) industry = 'Supply Chain & Global Logistics';
      if (/health|med|bio/i.test(company || '')) industry = 'Healthcare & Life Sciences';

      const enrichedScore = Math.min(100, (contact.leadScore || 50) + 15);
      const updated = memoryStore.updateContact(contactId, {
        leadScore: enrichedScore,
        industry,
        domain,
        leadStatus: contact.leadStatus === 'New' ? 'Qualified' : contact.leadStatus
      });

      return {
        ok: true,
        data: {
          contact: updated,
          enrichment: {
            domain,
            industry,
            scoreBoost: '+15',
            previousScore: contact.leadScore,
            newScore: enrichedScore
          }
        }
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  createTask({
    title,
    description = '',
    priority = 'Medium',
    dueDatePhrase,
    contactId = null,
    retryCount = 0,
    isDemoFailTrigger = false
  }) {
    try {
      if (!title) {
        return { ok: false, error: 'Task title is required' };
      }

      // Check deliberate demo failure trigger on first attempt (retryCount === 0)
      if (isDemoFailTrigger && retryCount === 0) {
        return {
          ok: false,
          error: 'Task service temporarily unavailable'
        };
      }

      // Resolve due date
      const dateInfo = resolveDate(dueDatePhrase || 'Friday');

      const task = memoryStore.createTask({
        title,
        description,
        priority,
        status: 'open',
        dueDate: dateInfo.iso,
        dueDateFriendly: dateInfo.friendly,
        dueDatePhrase: dateInfo.phrase,
        contactId
      });

      return {
        ok: true,
        data: {
          task,
          resolvedDate: dateInfo
        }
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  generateEmailDraft({ contact, company, purpose = 'product demo', customSubject, customBody }) {
    try {
      const recipientName = contact?.name || 'Valued Partner';
      const firstName = recipientName.split(' ')[0];
      const targetCompany = company || contact?.company || 'your team';

      const subject = customSubject || `Accelerating business operations for ${targetCompany} with AgentForce AI`;
      const body =
        customBody ||
        `Hi ${firstName},\n\n` +
        `I hope this email finds you well. I noticed the impressive work ${targetCompany} is doing in your market.\n\n` +
        `At AgentForce AI, we help high-growth enterprises automate repetitive business workflows across CRM, task delegation, and cross-functional operations using autonomous agent swarms.\n\n` +
        `I'd love to share a brief 15-minute product demonstration highlighting how our autonomous workforce can eliminate manual data entry and streamline team execution.\n\n` +
        `Please let me know if you would be open to a quick introductory discussion.\n\n` +
        `Best regards,\n` +
        `AgentForce AI Workforce Solutions`;

      return {
        ok: true,
        data: {
          recipient: {
            name: recipientName,
            email: contact?.email || `${firstName.toLowerCase()}@${targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.example`,
            company: targetCompany
          },
          subject,
          body
        }
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  requestApproval({ workflowId, stepId, recipient, proposedSubject, proposedBody, reason }) {
    try {
      const approval = memoryStore.createApproval({
        workflowId,
        stepId,
        actionType: 'request_email_approval',
        recipient,
        proposedSubject,
        proposedBody,
        reason: reason || 'Sensitive external communication requires human sign-off before dispatch.'
      });
      return { ok: true, data: approval };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async executeApprovedAction({ approvalId, reviewer = 'Demo Reviewer' }) {
    try {
      const approval = memoryStore.findApprovalById(approvalId);
      if (!approval) {
        return { ok: false, status: 404, error: 'Approval not found' };
      }
      if (approval.status !== 'pending') {
        return { ok: false, status: 409, error: `Approval already resolved with status "${approval.status}"` };
      }

      // Dispatch real email via Nodemailer / Ethereal test inbox
      const dispatchRes = await sendOutboundEmail({
        to: approval.recipient.email,
        toName: approval.recipient.name,
        subject: approval.proposedSubject,
        text: approval.proposedBody
      });

      const executionResult = {
        action: 'Simulated email execution',
        dispatchedAt: new Date().toISOString(),
        recipient: approval.recipient.email,
        subject: approval.proposedSubject,
        reviewer,
        status: 'DISPATCHED_SIMULATED',
        realDispatch: dispatchRes.data,
        previewUrl: dispatchRes.data?.previewUrl || null
      };

      const updated = memoryStore.updateApproval(approvalId, {
        status: 'approved',
        reviewer,
        decisionTimestamp: new Date().toISOString(),
        executionResult
      });

      return { ok: true, data: updated };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  writeActivityLog({ workflowId = null, agentName, action, toolName = 'none', status = 'info', message, data = null }) {
    try {
      const log = memoryStore.writeLog({
        workflowId,
        agentName,
        action,
        toolName,
        status,
        message,
        data
      });
      return { ok: true, data: log };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
};
