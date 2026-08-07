import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { formatDateTime, hasMinRole } from '../utils/helpers';
import { mockUsers } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import { Page, Card, CardHeader, Badge, Empty, Drawer, DetailRow, Pagination, SearchInput, Select, Modal } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const ROLE_BADGE = { 'Operations Admin': 'violet', 'Manager': 'indigo', 'Analyst': 'cyan', 'Field Staff': 'green' };
const STATUS_BADGE = { active: 'green', inactive: 'slate', suspended: 'red' };

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [selected, setSelected] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editData, setEditData] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const { user } = useAuth();
  const canManage = hasMinRole(user, 'Manager');
  const isAdmin = user?.role === 'Operations Admin';

  useEffect(() => { load(); }, [filters, pagination.page]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await userAPI.getUsers({ ...filters, page: pagination.page, limit: pagination.limit });
      if (r.data.success && r.data.data.users.length) { setUsers(r.data.data.users); setPagination(p => ({ ...p, ...r.data.data.pagination })); }
      else setUsers(mockUsers);
    } catch { setUsers(mockUsers); } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    try { await userAPI.updateUser(editModal.userId, editData); toast.success('User updated'); setEditModal(null); load(); }
    catch { toast.error('Update failed'); }
  };

  const handleDeactivate = async (uid) => {
    if (!confirm('Deactivate this user?')) return;
    try { await userAPI.deleteUser(uid); toast.success('User deactivated'); load(); }
    catch { toast.error('Failed'); }
  };

  const display = users.filter(u => !filters.search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(filters.search.toLowerCase()));

  const stats = [
    ['Total Users', users.length, 'linear-gradient(135deg,#6366f1,#8b5cf6)'],
    ['Active', users.filter(u => u.status === 'active').length, 'linear-gradient(135deg,#22c55e,#86efac)'],
    ['Admins', users.filter(u => u.role === 'Operations Admin').length, 'linear-gradient(135deg,#8b5cf6,#a78bfa)'],
    ['Managers', users.filter(u => u.role === 'Manager').length, 'linear-gradient(135deg,#06b6d4,#67e8f9)'],
  ];

  return (
    <Page>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {stats.map(([l, v, g]) => (
          <div key={l} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{v}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <SearchInput value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search users…" style={{ flex: '1 1 200px', minWidth: 0 }} />
        <Select value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
          <option value="">All Roles</option>
          {['Operations Admin', 'Manager', 'Analyst', 'Field Staff'].map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {['active', 'inactive', 'suspended'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr>{['User', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6}><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div></td></tr>
                : display.length === 0 ? <tr><td colSpan={6}><Empty message="No users found." /></td></tr>
                  : display.map(u => (
                    <tr key={u.userId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{u.firstName} {u.lastName}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{u.email}</td>
                      <td><Badge variant={ROLE_BADGE[u.role] || 'slate'}>{u.role}</Badge></td>
                      <td><Badge variant={STATUS_BADGE[u.status] || 'slate'} dot>{u.status}</Badge></td>
                      <td style={{ fontSize: 12 }}>{formatDateTime(u.lastLogin)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setSelected(u)} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 700, border: 'none', background: '#eef2ff', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>View</button>
                          {canManage && <button onClick={() => { setEditModal(u); setEditData({ role: u.role, status: u.status }); }} style={{ fontSize: 12, color: '#0891b2', fontWeight: 700, border: 'none', background: '#ecfeff', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>Edit</button>}
                          {isAdmin && u.userId !== user.userId && <button onClick={() => handleDeactivate(u.userId)} style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, border: 'none', background: '#fee2e2', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>Deactivate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <Pagination page={pagination.page} pages={pagination.pages} total={display.length} limit={pagination.limit}
          onPrev={() => setPagination(p => ({ ...p, page: p.page - 1 }))} onNext={() => setPagination(p => ({ ...p, page: p.page + 1 }))} />
      </div>

      {/* Detail drawer */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title="User Profile">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', borderRadius: 12 }}>
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{selected.firstName?.[0]}{selected.lastName?.[0]}</div>
              <div><div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{selected.firstName} {selected.lastName}</div><div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{selected.email}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DetailRow label="Role"><Badge variant={ROLE_BADGE[selected.role] || 'slate'}>{selected.role}</Badge></DetailRow>
              <DetailRow label="Status"><Badge variant={STATUS_BADGE[selected.status] || 'slate'}>{selected.status}</Badge></DetailRow>
              <DetailRow label="Last Login">{formatDateTime(selected.lastLogin)}</DetailRow>
              <DetailRow label="User ID"><span style={{ fontSize: 10, fontFamily: 'monospace' }}>{selected.userId?.slice(0, 16)}…</span></DetailRow>
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit modal */}
      <Modal isOpen={!!editModal} onClose={() => { setEditModal(null); setEditData({}); }} title={`Edit — ${editModal?.firstName} ${editModal?.lastName}`}>
        {editModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Role</label>
              <select value={editData.role} onChange={e => setEditData(d => ({ ...d, role: e.target.value }))} className="input">
                {['Operations Admin', 'Manager', 'Analyst', 'Field Staff'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Status</label>
              <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))} className="input">
                {['active', 'inactive', 'suspended'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button onClick={handleUpdate} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Changes</button>
              <button onClick={() => { setEditModal(null); setEditData({}); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
