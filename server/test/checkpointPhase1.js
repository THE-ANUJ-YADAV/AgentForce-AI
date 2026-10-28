/**
 * checkpointPhase1.js
 * End-to-end API and workflow verification script for Phase 1 checkpoint.
 */
import app from '../src/app.js';
import http from 'node:http';

let server;
const PORT = 5055;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runCheckpoint() {
  console.log('--- Starting Phase 1 Checkpoint Verification ---');

  // 1. Health
  const health = await api('/health');
  console.log('1. Health check status:', health.status, 'Data:', health.data?.data?.status, 'Mode:', health.data?.data?.mode);
  if (!health.ok) throw new Error('Health check failed');

  // 2. Initial Seeds
  const crmInitial = await api('/crm');
  const tasksInitial = await api('/tasks');
  console.log(`2. Seed data loaded: ${crmInitial.data?.data?.length} contacts, ${tasksInitial.data?.data?.length} tasks`);

  // 3. Submit Rahul Sharma workflow
  console.log('\n3. Submitting Rahul Sharma workflow...');
  const wf1 = await api('/workflows', {
    method: 'POST',
    body: JSON.stringify({
      request: 'Add Rahul Sharma from ABC Technologies to CRM, create a follow-up task for Friday, and prepare a personalized product demo email.'
    })
  });
  console.log('Workflow created:', wf1.status, wf1.data?.data?.id);
  const wf1Id = wf1.data?.data?.id;

  // Poll until steps complete / awaiting_approval
  let wf1Current = null;
  for (let i = 0; i < 20; i++) {
    await delay(500);
    const check = await api(`/workflows/${wf1Id}`);
    wf1Current = check.data?.data;
    if (wf1Current.status === 'awaiting_approval' || wf1Current.status === 'completed') {
      break;
    }
  }

  console.log(`Workflow ${wf1Id} status after execution: ${wf1Current.status}`);
  console.log('Steps execution states:');
  for (const s of wf1Current.steps) {
    console.log(`  - [${s.status}] ${s.agent} (${s.action})`);
  }

  // Check CRM contact
  const crmCheck = await api('/crm');
  const rahulContact = crmCheck.data?.data?.find((c) => c.name === 'Rahul Sharma');
  console.log('Rahul Sharma Contact:', rahulContact ? `Found (${rahulContact.email}, Score: ${rahulContact.leadScore})` : 'NOT FOUND');
  if (!rahulContact) throw new Error('Rahul Sharma was not created in CRM');

  // Check deduplication: submit Rahul request a second time
  console.log('\nTesting deduplication (submitting Rahul Sharma workflow second time)...');
  const wfRepeat = await api('/workflows', {
    method: 'POST',
    body: JSON.stringify({
      request: 'Add Rahul Sharma from ABC Technologies to CRM, create a follow-up task for Friday, and prepare a personalized product demo email.'
    })
  });
  await delay(2000);
  const crmCheck2 = await api('/crm');
  const rahulMatches = crmCheck2.data?.data?.filter((c) => c.name === 'Rahul Sharma');
  console.log(`Deduplication check: count of Rahul Sharma contacts in CRM = ${rahulMatches.length} (Expected: 1)`);
  if (rahulMatches.length !== 1) throw new Error('Deduplication failed: multiple Rahul Sharma contacts created');

  // 4. Test Approvals: Approve Rahul's email
  const approvalsList = await api('/approvals');
  const rahulApproval = approvalsList.data?.data?.find((a) => a.workflowId === wf1Id);
  console.log('\nApproval found for Rahul workflow:', rahulApproval?.id, 'Status:', rahulApproval?.status);
  if (!rahulApproval) throw new Error('Approval not found for Rahul workflow');

  console.log('Approving action...');
  const approveRes = await api(`/approvals/${rahulApproval.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ reviewer: 'Demo Reviewer' })
  });
  console.log('Approve result status:', approveRes.status, 'Execution result:', approveRes.data?.data?.approval?.executionResult?.action);
  if (approveRes.status !== 200) throw new Error('Approve failed');

  // Test duplicate approve (idempotent / 409 conflict)
  console.log('Testing duplicate approval (expecting 409)...');
  const dupApproveRes = await api(`/approvals/${rahulApproval.id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ reviewer: 'Demo Reviewer' })
  });
  console.log('Duplicate approve status:', dupApproveRes.status, dupApproveRes.data?.error?.code);
  if (dupApproveRes.status !== 409) throw new Error(`Expected 409 on duplicate approval, got ${dupApproveRes.status}`);

  // Check workflow 1 final status
  const wf1Final = await api(`/workflows/${wf1Id}`);
  console.log(`Workflow ${wf1Id} final status: ${wf1Final.data?.data?.status} (Expected: completed)`);
  console.log('Workflow summary:', JSON.stringify(wf1Final.data?.data?.summary, null, 2));

  // 5. Test Failure Demo Workflow
  console.log('\n5. Testing Failure Demo Workflow...');
  const wfFail = await api('/workflows', {
    method: 'POST',
    body: JSON.stringify({
      request: 'Add Test User from FailCorp (fail@test.com) to CRM, create a follow-up task for Friday, and prepare a product demo email.'
    })
  });
  const failWfId = wfFail.data?.data?.id;

  let failWfCurrent = null;
  for (let i = 0; i < 20; i++) {
    await delay(500);
    const check = await api(`/workflows/${failWfId}`);
    failWfCurrent = check.data?.data;
    const taskStep = failWfCurrent.steps.find((s) => s.action === 'create_task');
    if (taskStep && taskStep.status === 'failed') {
      break;
    }
  }

  const failedTaskStep = failWfCurrent.steps.find((s) => s.action === 'create_task');
  console.log(`Task step status: ${failedTaskStep?.status}, Error: "${failedTaskStep?.error}"`);
  console.log(`Workflow status with failed step: ${failWfCurrent.status}`);
  if (failedTaskStep?.status !== 'failed') throw new Error('Expected task step to fail on first attempt');

  // 6. Test Step Retry
  console.log(`\nTesting retry on step ${failedTaskStep.id}...`);
  const retryRes = await api(`/workflows/${failWfId}/steps/${failedTaskStep.id}/retry`, {
    method: 'POST'
  });
  console.log('Retry response status:', retryRes.status, 'New step status:', retryRes.data?.data?.step?.status);
  if (retryRes.data?.data?.step?.status !== 'completed') {
    throw new Error('Retry did not successfully complete the step');
  }

  // 7. Test Rejection
  const failApprovals = await api('/approvals');
  const failApproval = failApprovals.data?.data?.find((a) => a.workflowId === failWfId);
  if (failApproval) {
    console.log(`\nTesting rejection on approval ${failApproval.id}...`);
    const rejectRes = await api(`/approvals/${failApproval.id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewer: 'Security Lead' })
    });
    console.log('Reject status:', rejectRes.status, 'New approval status:', rejectRes.data?.data?.approval?.status);
    const failWfAfterReject = await api(`/workflows/${failWfId}`);
    console.log(`Workflow status after rejection: ${failWfAfterReject.data?.data?.status}`);
  }

  // 8. Test Admin Reset
  console.log('\n8. Testing Admin Reset...');
  const resetRes = await api('/admin/reset', { method: 'POST' });
  console.log('Reset response status:', resetRes.status, resetRes.data?.data?.message);
  const crmAfterReset = await api('/crm');
  console.log(`Contacts after reset: ${crmAfterReset.data?.data?.length}`);

  console.log('\n--- Phase 1 Checkpoint: ALL TESTS PASSED! ---');
}

server = http.createServer(app).listen(PORT, async () => {
  try {
    await runCheckpoint();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\nCheckpoint FAILED:', err);
    server.close();
    process.exit(1);
  }
});
