import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Check, CheckCircle2,
  ChevronDown, CircleAlert, Clock3, FileText, Filter, FolderKanban, LayoutDashboard,
  LoaderCircle, Menu, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2,
  Users, X, Eye
} from 'lucide-react';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const STATUS = {
  not_started: { label: 'Not Started', className: 'not-started' },
  in_progress: { label: 'In Progress', className: 'in-progress' },
  completed: { label: 'Completed', className: 'completed' },
};
const blank = () => ({ name: '', client_name: '', description: '', start_date: '', due_date: '', status: 'not_started' });
const niceDate = (date) => date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.fields = data.errors || {};
    throw error;
  }
  return data;
}

function Status({ status }) {
  const item = STATUS[status] || STATUS.not_started;
  return <span className={`status ${item.className}`}><i />{item.label}</span>;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-head"><div><span className="eyebrow">PROJECT WORKSPACE</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19}/></button></header>
      {children}
    </section>
  </div>;
}

export default function App() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, not_started: 0, in_progress: 0, completed: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank());
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (filter !== 'all') params.set('status', filter);
      const [list, dashboard] = await Promise.all([
        api(`/projects?${params.toString()}`), api('/dashboard'),
      ]);
      setProjects(list.data || []);
      setStats(dashboard);
    } catch (e) {
      setError(`${e.message}. Check that the Laravel API is deployed and VITE_API_BASE_URL is configured correctly.`);
    } finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);
  const completion = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const openCreate = () => { setForm(blank()); setFieldErrors({}); setModal('create'); };
  const openEdit = (project) => {
    setForm({ ...project, start_date: String(project.start_date).slice(0,10), due_date: String(project.due_date).slice(0,10) });
    setFieldErrors({}); setModal('edit'); setSelected(project);
  };

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setFieldErrors({});
    try {
      const editing = modal === 'edit';
      await api(editing ? `/projects/${selected.id}` : '/projects', {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(form),
      });
      setModal(null); setNotice(editing ? 'Project updated successfully.' : 'Project created successfully.');
      await load();
    } catch (e) { setFieldErrors(e.fields || {}); setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await api(`/projects/${project.id}`, { method: 'DELETE' });
      setNotice('Project deleted successfully.'); setSelected(null); await load();
    } catch (e) { setError(e.message); }
  };

  const view = async (project) => {
    try { const result = await api(`/projects/${project.id}`); setSelected(result.data); setModal('view'); }
    catch (e) { setError(e.message); }
  };

  const field = (key, label, type = 'text', required = true) => <label className="field" key={key}>
    <span>{label}{required && <b> *</b>}</span>
    {key === 'status' ? <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}>
      {Object.entries(STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
    </select> : key === 'description' ? <textarea rows="3" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder="What needs to be delivered?" /> :
      <input type={type} required={required} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={type === 'date' ? '' : `Enter ${label.toLowerCase()}`} />}
    {fieldErrors?.[key] && <small className="field-error">{fieldErrors[key][0]}</small>}
  </label>;

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'show' : ''}`}>
      <div className="brand"><div className="brand-mark">B<span>.</span></div><div><strong>brandville</strong><small>TECHNOLOGIES</small></div><button className="mobile-close icon-button" onClick={() => setMenuOpen(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className="nav-item active"><LayoutDashboard size={18}/> Overview</button>
      <button className="nav-item" onClick={() => { setFilter('all'); document.querySelector('.project-section')?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); }}><FolderKanban size={18}/> All projects <span className="nav-count">{stats.total}</span></button>
      <div className="side-divider"/>
      <div className="workspace-label">PROJECT STATUS</div>
      {Object.entries(STATUS).map(([key, item]) => <button key={key} className="nav-item" onClick={() => { setFilter(key); setMenuOpen(false); }}><span className={`nav-dot ${item.className}`}/>{item.label}<span className="nav-count">{stats[key]}</span></button>)}
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Activity size={18}/></div><strong>Keep work moving</strong><p>Track progress, align your team, and deliver on time.</p><button onClick={openCreate}>+ New project</button></div><div className="profile"><div className="avatar">BV</div><div><strong>Brandville Team</strong><small>Project workspace</small></div><MoreHorizontal size={19}/></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="top-actions"><span className="live-indicator"><i/> Live workspace</span><button className="icon-button refresh" onClick={load} title="Refresh"><RefreshCw size={17}/></button><div className="avatar small-avatar">BV</div></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow"><span className="heading-line"/> PROJECT MANAGEMENT</div><h1>Good work starts<br className="mobile-break"/> with <em>clarity.</em></h1><p>Your team's project pulse, all in one place.</p></div><button className="primary-button" onClick={openCreate}><Plus size={18}/> New project</button></div>

        {notice && <div className="notice"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice('')}><X size={16}/></button></div>}
        {error && <div className="error-banner"><CircleAlert size={18}/><span>{error}</span><button onClick={() => setError('')}><X size={16}/></button></div>}

        <div className="stats-grid">
          <article className="stat-card total-card"><div className="stat-top"><span>Total projects</span><span className="stat-icon"><FolderKanban size={18}/></span></div><div className="stat-value">{stats.total}</div><div className="stat-foot"><span className="trend"><ArrowUpRight size={15}/> Live count</span><span>Across workspace</span></div><div className="mini-bars">{[24,40,31,55,38,67,50,75,57,83,64,100].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></article>
          <article className="stat-card"><div className="stat-top"><span>Not started</span><span className="stat-icon muted"><Clock3 size={18}/></span></div><div className="stat-value">{stats.not_started}</div><div className="stat-foot"><span>Waiting to begin</span><button onClick={() => setFilter('not_started')}>View <ArrowDownRight size={14}/></button></div><div className="stat-progress"><i style={{width:`${stats.total ? stats.not_started/stats.total*100 : 0}%`}}/></div></article>
          <article className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-icon blue"><Activity size={18}/></span></div><div className="stat-value">{stats.in_progress}</div><div className="stat-foot"><span>Currently underway</span><button onClick={() => setFilter('in_progress')}>View <ArrowDownRight size={14}/></button></div><div className="stat-progress blue-progress"><i style={{width:`${stats.total ? stats.in_progress/stats.total*100 : 0}%`}}/></div></article>
          <article className="stat-card"><div className="stat-top"><span>Completed</span><span className="stat-icon green"><CheckCircle2 size={18}/></span></div><div className="stat-value">{stats.completed}</div><div className="stat-foot"><span>{completion}% of all projects</span><button onClick={() => setFilter('completed')}>View <ArrowDownRight size={14}/></button></div><div className="stat-progress green-progress"><i style={{width:`${completion}%`}}/></div></article>
        </div>

        <section className="project-section">
          <div className="section-head"><div><div className="eyebrow">YOUR PORTFOLIO</div><h2>Projects <span className="pill-count">{projects.length}</span></h2><p>Keep every deadline and deliverable in sight.</p></div><button className="secondary-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
          <div className="toolbar"><div className="searchbox"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or clients..." aria-label="Search projects or clients"/>{search && <button onClick={() => setSearch('')}><X size={15}/></button>}</div><label className="filterbox"><Filter size={16}/><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by status"><option value="all">All statuses</option>{Object.entries(STATUS).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}</select><ChevronDown size={14}/></label></div>

          <div className="table-wrap">
            <table><thead><tr><th>PROJECT</th><th>CLIENT</th><th>DEADLINE</th><th>STATUS</th><th className="action-heading">ACTIONS</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="5" className="empty-state"><LoaderCircle className="spin" size={22}/> Loading projects…</td></tr> :
                  projects.length === 0 ? <tr><td colSpan="5"><div className="empty-state"><div className="empty-icon"><FolderKanban size={24}/></div><strong>No projects found</strong><p>{search || filter !== 'all' ? 'Try changing your search or filters.' : 'Create your first project to get started.'}</p>{!search && filter === 'all' && <button className="primary-button compact" onClick={openCreate}><Plus size={16}/> Create project</button>}</div></td></tr> :
                  projects.map(project => <tr key={project.id}><td><button className="project-name" onClick={() => view(project)}><span className="project-glyph"><FileText size={17}/></span><span><strong>{project.name}</strong><small>Updated {niceDate((project.updated_at || '').slice(0,10))}</small></span></button></td><td><div className="client-cell"><span className="client-avatar">{(project.client_name || '?').slice(0,1).toUpperCase()}</span>{project.client_name}</div></td><td><span className="date-cell"><CalendarDays size={15}/>{niceDate(project.due_date)}</span></td><td><Status status={project.status}/></td><td><div className="row-actions"><button className="icon-button" title="View" onClick={() => view(project)}><Eye size={16}/></button><button className="icon-button" title="Edit" onClick={() => openEdit(project)}><Pencil size={16}/></button><button className="icon-button danger-hover" title="Delete" onClick={() => remove(project)}><Trash2 size={16}/></button></div></td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>Showing <strong>{projects.length}</strong> project{projects.length === 1 ? '' : 's'}</span><span><i className="footer-dot"/> Connected to project database</span></div>
        </section>
        <footer className="footer"><span>© 2026 Brandville Technologies</span><span>Built for clarity <span className="footer-heart">✦</span></span></footer>
      </div>
    </main>

    {(modal === 'create' || modal === 'edit') && <Modal title={modal === 'create' ? 'Create a project' : 'Edit project'} onClose={() => setModal(null)}>
      <form className="project-form" onSubmit={save}>
        {field('name','Project name')}{field('client_name','Client name')}
        {field('description','Description', 'text', false)}
        <div className="form-row">{field('start_date','Start date','date')}{field('due_date','Due date','date')}</div>
        {field('status','Status')}
        <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17}/> : <Check size={17}/>} {saving ? 'Saving…' : modal === 'create' ? 'Create project' : 'Save changes'}</button></div>
      </form>
    </Modal>}

    {modal === 'view' && selected && <Modal title="Project details" onClose={() => setModal(null)}>
      <div className="detail-body"><Status status={selected.status}/><h3>{selected.name}</h3><p>{selected.description || 'No description provided.'}</p><div className="detail-grid"><div><small>CLIENT</small><strong><Users size={15}/>{selected.client_name}</strong></div><div><small>START DATE</small><strong><CalendarDays size={15}/>{niceDate(selected.start_date)}</strong></div><div><small>DUE DATE</small><strong><CalendarDays size={15}/>{niceDate(selected.due_date)}</strong></div><div><small>PROJECT ID</small><strong>#{selected.id}</strong></div></div><div className="form-actions"><button className="secondary-button danger-text" onClick={() => remove(selected)}><Trash2 size={16}/> Delete</button><button className="primary-button" onClick={() => openEdit(selected)}><Pencil size={16}/> Edit project</button></div></div>
    </Modal>}
  </div>;
}
