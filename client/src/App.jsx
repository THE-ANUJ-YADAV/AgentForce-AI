import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import NewWorkflowModal from './components/NewWorkflowModal';

import Overview from './pages/Overview';
import Workforce from './pages/Workforce';
import Workflows from './pages/Workflows';
import WorkflowDetails from './pages/WorkflowDetails';
import Tasks from './pages/Tasks';
import Crm from './pages/Crm';
import Approvals from './pages/Approvals';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

import { api } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('overview');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Application State
  const [health, setHealth] = useState({});
  const [backendConnected, setBackendConnected] = useState(true);
  const [workflows, setWorkflows] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [crmContacts, setCrmContacts] = useState([]);
  const [logs, setLogs] = useState([]);

  const isPollingRef = useRef(false);

  // Poll all backend data endpoints
  const fetchAllData = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const [h, wfs, apprs, ts, crm, lg] = await Promise.all([
        api.getHealth(),
        api.getWorkflows(),
        api.getApprovals(),
        api.getTasks(),
        api.getCrmContacts(),
        api.getActivityLogs()
      ]);

      setHealth(h || {});
      setWorkflows(wfs || []);
      setApprovals(apprs || []);
      setTasks(ts || []);
      setCrmContacts(crm || []);
      setLogs(lg || []);
      setBackendConnected(true);
    } catch (err) {
      setBackendConnected(false);
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  // Set up 2.5-second polling timer
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 2500);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Handlers
  const handleCreateWorkflow = async (requestText) => {
    const newWf = await api.createWorkflow(requestText);
    await fetchAllData();
    setSelectedWorkflowId(newWf.id);
    setCurrentPage('workflow-details');
  };

  const handleRetryStep = async (workflowId, stepId) => {
    await api.retryStep(workflowId, stepId);
    await fetchAllData();
  };

  const handleApprove = async (approvalId) => {
    await api.approveAction(approvalId);
    await fetchAllData();
  };

  const handleReject = async (approvalId) => {
    await api.rejectAction(approvalId);
    await fetchAllData();
  };

  const handleCreateContact = async (contactData) => {
    await api.createContact(contactData);
    await fetchAllData();
  };

  const handleUpdateContact = async (id, updates) => {
    await api.updateContact(id, updates);
    await fetchAllData();
  };

  const handleDeleteContact = async (id) => {
    await api.deleteContact(id);
    await fetchAllData();
  };

  const handleCreateTask = async (taskData) => {
    await api.createTask(taskData);
    await fetchAllData();
  };

  const handleUpdateTask = async (id, updates) => {
    await api.updateTask(id, updates);
    await fetchAllData();
  };

  const handleDeleteTask = async (id) => {
    await api.deleteTask(id);
    await fetchAllData();
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    await api.updateTaskStatus(taskId, newStatus);
    await fetchAllData();
  };

  const handleResetData = async () => {
    await api.resetAdminData();
    setSelectedWorkflowId(null);
    await fetchAllData();
  };

  const handleInspectWorkflow = (workflowId) => {
    setSelectedWorkflowId(workflowId);
    setCurrentPage('workflow-details');
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || null;
  const selectedWorkflowApproval = approvals.find((a) => a.workflowId === selectedWorkflowId) || null;

  // Title calculation for TopNav
  const pageTitles = {
    overview: 'Executive Operations Dashboard',
    workforce: 'AI Workforce Architecture',
    workflows: 'Workflows Orchestration',
    'workflow-details': `Workflow: ${selectedWorkflowId || 'Details'}`,
    tasks: 'Autonomous Task Queue',
    crm: 'CRM & Lead Intelligence',
    approvals: 'Human-in-the-Loop Approvals',
    logs: 'Activity Logs & Audit Trail',
    settings: 'System & Engine Settings'
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-[#0F172A]">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage === 'workflow-details' ? 'workflows' : currentPage}
        setCurrentPage={(page) => {
          if (page !== 'workflow-details') {
            setSelectedWorkflowId(null);
          }
          setCurrentPage(page);
        }}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          title={pageTitles[currentPage] || 'AgentForce AI'}
          backendConnected={backendConnected}
          activeAgents={health.activeAgents || []}
          onOpenNewWorkflow={() => setIsModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-8">
          {currentPage === 'overview' && (
            <Overview
              workflows={workflows}
              approvals={approvals}
              tasks={tasks}
              crmContacts={crmContacts}
              logs={logs}
              health={health}
              onSelectWorkflow={handleInspectWorkflow}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'workforce' && (
            <Workforce workflows={workflows} health={health} />
          )}

          {currentPage === 'workflows' && (
            <Workflows
              workflows={workflows}
              onSelectWorkflow={handleInspectWorkflow}
              onOpenNewWorkflow={() => setIsModalOpen(true)}
            />
          )}

          {currentPage === 'workflow-details' && (
            <WorkflowDetails
              workflow={selectedWorkflow}
              approval={selectedWorkflowApproval}
              onBack={() => setCurrentPage('workflows')}
              onRetryStep={handleRetryStep}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}

          {currentPage === 'tasks' && (
            <Tasks
              tasks={tasks}
              contacts={crmContacts}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
            />
          )}

          {currentPage === 'crm' && (
            <Crm
              contacts={crmContacts}
              onCreateContact={handleCreateContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
            />
          )}

          {currentPage === 'approvals' && (
            <Approvals
              approvals={approvals}
              onApprove={handleApprove}
              onReject={handleReject}
              onInspectWorkflow={handleInspectWorkflow}
            />
          )}

          {currentPage === 'logs' && (
            <Logs logs={logs} />
          )}

          {currentPage === 'settings' && (
            <Settings health={health} onResetData={handleResetData} />
          )}
        </main>
      </div>

      {/* New Workflow Modal */}
      <NewWorkflowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateWorkflow}
      />
    </div>
  );
}
