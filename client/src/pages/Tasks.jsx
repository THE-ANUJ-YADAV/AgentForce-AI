import React, { useState } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import TaskModal from '../components/TaskModal';

export default function Tasks({
  tasks = [],
  contacts = [],
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateTaskStatus
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const contactMap = new Map();
  contacts.forEach((c) => contactMap.set(c.id, c));

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleStatusChange = async (taskId, newStatus) => {
    setErrorMessage(null);
    setUpdatingTaskId(taskId);
    try {
      await onUpdateTaskStatus(taskId, newStatus);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await onDeleteTask(taskId);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete task');
    }
  };

  const handleSaveTask = async (taskData) => {
    if (taskData.id) {
      await onUpdateTask(taskData.id, taskData);
    } else {
      await onCreateTask(taskData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Task Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Actionable follow-up items dispatched and scheduled autonomously by Task Agent
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Task Details</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">Scheduled Deadline</th>
                  <th className="py-3 px-4">Associated Contact</th>
                  <th className="py-3 px-4">Status &amp; Action</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t) => {
                  const contact = t.contactId ? contactMap.get(t.contactId) : null;
                  const isUpdating = updatingTaskId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900">{t.title}</div>
                        {t.description && (
                          <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                            {t.description}
                          </p>
                        )}
                        <span className="font-mono text-[10px] text-slate-400 mt-1 block">
                          ID: {t.id}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[11px] border ${
                            t.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : t.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {t.assignedAgent}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 text-slate-900 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{t.dueDateFriendly || t.dueDate}</span>
                        </div>
                        {t.dueDatePhrase && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Phrase: "{t.dueDatePhrase}"
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {contact ? (
                          <div>
                            <span className="font-semibold text-slate-900 block">{contact.name}</span>
                            <span className="text-[10px] text-slate-500">{contact.company}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No contact link</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <select
                            disabled={isUpdating}
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium text-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                            title="Edit Task"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No tasks found</p>
            <p className="text-xs text-slate-400 mt-1">Schedule a task manually or dispatch a business workflow</p>
          </div>
        )}
      </div>

      <TaskModal
        isOpen={modalOpen}
        task={editingTask}
        contacts={contacts}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
      />
    </div>
  );
}
