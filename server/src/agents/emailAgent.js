/**
 * emailAgent.js
 * Email Agent: Drafts personalized business communications using Gemini or deterministic templates.
 */
import { toolService } from '../services/toolService.js';
import { callGemini, isGeminiConfigured } from '../services/geminiService.js';
import { memoryStore } from '../store/memoryStore.js';

export const emailAgent = {
  name: 'Email Agent',
  role: 'Communications & Outbound Messaging',
  responsibilities: [
    'Synthesize CRM data and business intent to draft targeted communications',
    'Personalize greetings, company references, and value propositions',
    'Utilize Gemini LLM when available with strict fallback protection',
    'Stage drafts for mandatory human approval before simulated dispatch'
  ],
  tools: ['generateEmailDraft', 'callGemini'],

  async executeStep(step, workflowContext) {
    const { params } = step;
    let { contact, company, purpose = 'product demo' } = params;

    memoryStore.setActiveAgent(this.name);
    toolService.writeActivityLog({
      workflowId: workflowContext.id,
      agentName: this.name,
      action: 'draft_email',
      toolName: 'generateEmailDraft',
      status: 'running',
      message: `Drafting outbound email for ${contact?.name || 'recipient'} at ${company || 'company'}...`
    });

    try {
      // If contact details weren't explicitly provided in params, fetch from prior steps
      if (!contact) {
        const contactStep = workflowContext.steps.find((s) => s.output?.contact);
        if (contactStep) {
          contact = contactStep.output.contact;
        }
      }

      if (!company && contact?.company) {
        company = contact.company;
      }

      const recipientName = contact?.name || 'Valued Partner';
      const firstName = recipientName.split(' ')[0];
      const targetCompany = company || contact?.company || 'ABC Technologies';

      let customSubject = null;
      let customBody = null;
      let usedGemini = false;
      let geminiFallbackReason = null;

      if (isGeminiConfigured()) {
        try {
          const systemInstruction = `You are an elite enterprise B2B sales development AI. Draft a professional, personalized outbound email.
Return JSON ONLY with format:
{
  "subject": "...",
  "body": "..."
}
Guidelines:
- Greet by first name (${firstName})
- Reference their company (${targetCompany})
- Professional product demonstration pitch for AgentForce AI workforce platform
- Clear call to action asking for a brief 15-minute conversation without inventing specific calendar slots
- Professional sign-off as "AgentForce AI Solutions"`;

          const prompt = `Request context: "${workflowContext.request}"
Recipient: ${recipientName}
Company: ${targetCompany}
Purpose: ${purpose}`;

          const geminiRes = await callGemini(prompt, systemInstruction, true);
          if (geminiRes.ok) {
            const parsed = JSON.parse(geminiRes.data);
            if (parsed.subject && parsed.body) {
              customSubject = parsed.subject;
              customBody = parsed.body;
              usedGemini = true;
            } else {
              geminiFallbackReason = 'Gemini JSON response missing required subject or body fields';
            }
          } else {
            geminiFallbackReason = geminiRes.error;
          }
        } catch (err) {
          geminiFallbackReason = err.message || 'Gemini drafting parse error';
        }
      } else {
        geminiFallbackReason = 'Gemini API key not configured (using deterministic template)';
      }

      const draftRes = toolService.generateEmailDraft({
        contact,
        company: targetCompany,
        purpose,
        customSubject,
        customBody
      });

      if (!draftRes.ok) {
        throw new Error(draftRes.error);
      }

      toolService.writeActivityLog({
        workflowId: workflowContext.id,
        agentName: this.name,
        action: 'draft_email',
        toolName: 'generateEmailDraft',
        status: 'completed',
        message: `Email draft generated successfully via ${usedGemini ? 'Gemini AI' : 'Deterministic Template'}.`,
        data: {
          usedGemini,
          geminiFallbackReason,
          subject: draftRes.data.subject
        }
      });

      return {
        ok: true,
        draft: draftRes.data,
        mode: usedGemini ? 'gemini' : 'fallback',
        fallbackReason: geminiFallbackReason
      };
    } finally {
      memoryStore.clearActiveAgent(this.name);
    }
  }
};
