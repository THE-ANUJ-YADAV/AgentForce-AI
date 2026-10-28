import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Mail,
  Building2,
  Plus,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react';
import ContactModal from '../components/ContactModal';

export default function Crm({
  contacts = [],
  onCreateContact,
  onUpdateContact,
  onDeleteContact
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || c.leadStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (contact) => {
    setEditingContact(contact);
    setModalOpen(true);
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await onDeleteContact(contactId);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete contact');
    }
  };

  const handleSaveContact = async (contactData) => {
    if (contactData.id) {
      await onUpdateContact(contactData.id, contactData);
    } else {
      await onCreateContact(contactData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">CRM &amp; Lead Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise contacts directory with autonomous deduplication and deterministic lead scoring
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
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
            placeholder="Search by name, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Lead Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Customer">Customer</option>
          </select>
        </div>
      </div>

      {/* CRM Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredContacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Contact Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Lead Score</th>
                  <th className="py-3 px-4">Lead Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((c) => {
                  let statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (c.leadStatus === 'Qualified') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (c.leadStatus === 'Proposal') statusColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  if (c.leadStatus === 'New') statusColor = 'bg-sky-50 text-sky-700 border-sky-200';
                  if (c.leadStatus === 'Contacted') statusColor = 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <span>{c.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 block font-normal">
                              {c.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.company}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{c.leadScore}</span>
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                c.leadScore >= 80 ? 'bg-emerald-500' : c.leadScore >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, c.leadScore)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${statusColor}`}>
                          {c.leadStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(c.lastActivity).toLocaleTimeString()} ({new Date(c.lastActivity).toLocaleDateString()})
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                            title="Edit Contact"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                            title="Delete Contact"
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
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No CRM contacts found</p>
            <p className="text-xs text-slate-400 mt-1">Add a contact manually or dispatch a business workflow</p>
          </div>
        )}
      </div>

      <ContactModal
        isOpen={modalOpen}
        contact={editingContact}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveContact}
      />
    </div>
  );
}
