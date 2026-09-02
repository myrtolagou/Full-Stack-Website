import { useEffect, useState } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';

const F = "'Inter', system-ui, sans-serif";

const AVATAR_COLORS = ['#3AAFDD', '#D95E8A', '#2F4B8C'];

const INPUT_STYLE = {
  width: '100%', height: 36, padding: '0 12px',
  border: '0.5px solid var(--color-border)', borderRadius: 6,
  fontSize: 12, color: 'var(--color-text)', outline: 'none',
  fontFamily: F, background: '#fff', boxSizing: 'border-box',
};

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function InviteForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user.');
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--color-surface)',
      border: '0.5px solid var(--color-border)',
      borderRadius: 8, padding: '16px 18px', marginBottom: 10,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 14 }}>
        Invite new user
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 4 }}>Name</label>
          <input style={INPUT_STYLE} placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 4 }}>Email</label>
          <input style={INPUT_STYLE} type="email" placeholder="email@bcncor.com" value={form.email} onChange={e => set('email', e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 4 }}>Password</label>
          <input style={INPUT_STYLE} type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 4 }}>Role</label>
          <select style={{ ...INPUT_STYLE, cursor: 'pointer' }} value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="member">Member</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          fontSize: 12, color: '#C0392B', background: '#FDF0EF',
          border: '0.5px solid #F5C6C2', borderRadius: 6,
          padding: '7px 12px', marginBottom: 10,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{
          padding: '0 14px', height: 32, border: '0.5px solid var(--color-border)',
          borderRadius: 6, background: 'var(--color-surface)', color: 'var(--color-text-muted)',
          fontSize: 12, cursor: 'pointer', fontFamily: F,
        }}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} style={{
          padding: '0 14px', height: 32, border: 'none', borderRadius: 6,
          background: 'var(--color-blue)', color: '#fff', fontSize: 12, fontWeight: 500,
          cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: F, opacity: submitting ? 0.7 : 1,
        }}>
          {submitting ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const setTopbar = useSetTopbar();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = () => {
    fetch(`${BASE_URL}/api/users`)
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data?.users) ? data.users : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    setTopbar({
      title:    'Users',
      subtitle: 'Manage team members and roles',
      actions: (
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            padding: '0 14px', height: 32, border: 'none', borderRadius: 6,
            background: 'var(--color-blue)', color: '#fff', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: F,
          }}
        >
          + Create user
        </button>
      ),
    });
  }, []);

  const handleSuccess = (newUser) => {
    setUsers(prev => [newUser, ...prev]);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== id));
    } catch { /* silent — user stays in list */ }
  };

  if (loading) return (
    <div style={{ fontFamily: F, fontSize: 13, color: 'var(--color-text-subtle)', padding: 24 }}>Loading…</div>
  );

  return (
    <div style={{ fontFamily: F }}>

      {showForm && (
        <InviteForm
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        {users.length === 0 && (
          <div style={{ padding: '20px 16px', fontSize: 12, color: 'var(--color-text-subtle)' }}>No users found.</div>
        )}
        {users.map(({ id, name, email, role }, i) => (
          <div
            key={id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < users.length - 1 ? '0.5px solid var(--color-border)' : 'none',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: AVATAR_COLORS[i % AVATAR_COLORS.length],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {getInitials(name)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>{email}</div>
            </div>

            <span style={{
              fontSize: 11, fontWeight: 500, borderRadius: 10, padding: '3px 10px',
              background: role === 'Admin' ? 'var(--color-blue-light)' : 'var(--color-bg)',
              color:      role === 'Admin' ? 'var(--color-blue-dark)' : 'var(--color-text-muted)',
            }}>
              {role}
            </span>

            <button style={{
              padding: '4px 12px', border: '0.5px solid var(--color-border)',
              borderRadius: 6, background: 'var(--color-surface)', color: 'var(--color-text-muted)',
              fontSize: 11, cursor: 'pointer', fontFamily: F,
            }}>
              Edit
            </button>

            {role !== 'Admin' && email !== 'codev@email.com' && (
              <button
                onClick={() => handleDelete(id)}
                style={{
                  padding: '4px 12px', border: '0.5px solid #F5C6C2',
                  borderRadius: 6, background: '#FDF0EF', color: '#C0392B',
                  fontSize: 11, cursor: 'pointer', fontFamily: F,
                }}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
