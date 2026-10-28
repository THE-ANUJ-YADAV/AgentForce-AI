/**
 * crmAgent.js
 * CRM Agent: Manages lead records, contact deduplication, and CRM synchronization.
 */
import { toolService } from '../services/toolService.js';
import { memoryStore } from '../store/memoryStore.js';

export const crmAgent = {
  name: 'CRM Agent',
  role: 'Customer Relationship & Lead Intelligence',
  responsibilities: [
    'Resolve existing contacts by email or name/company',
    'Prevent duplicate records across marketing and sales leads',
    'Calculate initial lead scores and update CRM lead status',
    'Sync enterprise customer profiles with workflow context'
  ],
  tools: ['findContact', 'createContact', 'updateContact', 'enrichLead'],

  async executeStep(step, workflowContext) {
    const { action, params } = step;
    const { name, company, email, leadStatus, leadScore } = params;

    memoryStore.setActiveAgent(this.name);

    if (action === 'enrich_lead') {
      toolService.writeActivityLog({
        workflowId: workflowContext.id,
        agentName: this.name,
        action,
        toolName: 'enrichLead',
        status: 'running',
        message: `Analyzing corporate intelligence, market domain, and enrichment profile for "${company || 'lead'}"...`
      });

      try {
        let targetContactId = params.contactId;
        if (!targetContactId) {
          const contactStep = workflowContext.steps.find((s) => s.output?.contact?.id);
          targetContactId = contactStep?.output?.contact?.id;
        }

        const enrichRes = toolService.enrichLead({
          contactId: targetContactId,
          company,
          email
        });

        if (!enrichRes.ok) throw new Error(enrichRes.error);

        toolService.writeActivityLog({
          workflowId: workflowContext.id,
          agentName: this.name,
          action,
          toolName: 'enrichLead',
          status: 'completed',
          message: `Lead enriched: Industry set to "${enrichRes.data.enrichment.industry}", Lead score boosted to ${enrichRes.data.enrichment.newScore}.`,
          data: enrichRes.data
        });

        return {
          ok: true,
          operation: 'enriched',
          contact: enrichRes.data.contact,
          enrichment: enrichRes.data.enrichment
        };
      } finally {
        memoryStore.clearActiveAgent(this.name);
      }
    }

    toolService.writeActivityLog({
      workflowId: workflowContext.id,
      agentName: this.name,
      action,
      toolName: 'findContact',
      status: 'running',
      message: `Searching CRM for existing contact "${name || email}" at "${company || 'N/A'}"...`
    });

    try {
      // Step 1: Check if contact exists
      const findRes = toolService.findContact({ email, name, company });
      if (!findRes.ok) {
        throw new Error(findRes.error);
      }

      const existingContact = findRes.data;

      if (existingContact) {
        // Prevent duplicate creation: update contact
        const updates = {};
        if (company && company !== existingContact.company) updates.company = company;
        if (email && email !== existingContact.email) updates.email = email;
        if (leadStatus) updates.leadStatus = leadStatus;
        if (leadScore !== undefined) updates.leadScore = leadScore;

        const updateRes = toolService.updateContact({ id: existingContact.id, updates });
        if (!updateRes.ok) {
          throw new Error(updateRes.error);
        }

        toolService.writeActivityLog({
          workflowId: workflowContext.id,
          agentName: this.name,
          action: 'update_contact',
          toolName: 'updateContact',
          status: 'completed',
          message: `Existing contact found for ${existingContact.name} (${existingContact.email}). Updated CRM profile without duplicate.`,
          data: updateRes.data
        });

        return {
          ok: true,
          operation: 'updated',
          contact: updateRes.data
        };
      }

      // Step 2: Create new contact
      // Deterministic lead score calculation
      let calculatedScore = leadScore;
      if (calculatedScore === undefined) {
        calculatedScore = 65;
        if (email && !email.endsWith('.example')) calculatedScore += 10;
        if (company && company.length > 2) calculatedScore += 10;
      }

      const createRes = toolService.createContact({
        name,
        company,
        email,
        leadStatus: leadStatus || 'New',
        leadScore: calculatedScore
      });

      if (!createRes.ok) {
        throw new Error(createRes.error);
      }

      toolService.writeActivityLog({
        workflowId: workflowContext.id,
        agentName: this.name,
        action: 'create_contact',
        toolName: 'createContact',
        status: 'completed',
        message: `Created new CRM contact for ${createRes.data.name} at ${createRes.data.company} with Lead Score ${createRes.data.leadScore}.`,
        data: createRes.data
      });

      return {
        ok: true,
        operation: 'created',
        contact: createRes.data
      };
    } finally {
      memoryStore.clearActiveAgent(this.name);
    }
  }
};
