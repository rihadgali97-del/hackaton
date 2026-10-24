import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Check, CircleAlert, ClipboardList, Plus, ShieldCheck, UserRoundCog, UsersRound } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, InlineMessage, Loading, PageHeading, PriorityBadge, StatusBadge } from '../components/Shared';

const reportStatuses = [['reported','Reported'], ['under_review','Under review'], ['in_progress','In progress'], ['resolved','Resolved'], ['rejected','Closed']];
const priorities = [['low','Low'], ['medium','Medium'], ['high','High'], ['urgent','Urgent']];

function AdminRow({ report, staff, canAssign, onSaved }) {
  const [status, setStatus] = useState(report.status); const [priority, setPriority] = useState(report.priority);
  const [assigned, setAssigned] = useState(report.assigned_to ? String(report.assigned_to) : ''); const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
  async function save() {
    setError(''); setSaved(false);
    if (status === 'rejected' && !note.trim()) { setError('Add a reason before closing this report.'); return; }
    const body = { status, priority, note: note.trim() || undefined };
    if (canAssign && (assigned || null) !== (report.assigned_to ? String(report.assigned_to) : null)) body.assigned_to = assigned ? Number(assigned) : null;
    setBusy(true);
    try { await api(`/admin/reports/${report.id}`, { method: 'PATCH', body: JSON.stringify(body) }); setSaved(true); setNote(''); onSaved(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  const dirty = status !== report.status || priority !== report.priority || (assigned || null) !== (report.assigned_to ? String(report.assigned_to) : null) || Boolean(note.trim());
  const categoryStaff = staff.filter((member) => member.is_active && member.category === report.category);
  const currentStaffMismatch = report.assigned_to && !categoryStaff.some((member) => String(member.id) === String(report.assigned_to));
  return <tr><td><Link className="admin-report-title" to={`/reports/${report.id}`}><b>{report.title}</b><small>#{String(report.id).padStart(4,'0')} · {report.neighborhood}</small></Link></td><td><StatusBadge status={report.status} /></td><td><span className="category-label">{report.category_name || report.category.replaceAll('_',' ')}</span></td><td>{canAssign ? <><select className="table-select" aria-label={`Assign ${report.title}`} value={assigned} onChange={(e) => setAssigned(e.target.value)}><option value="">Unassigned</option>{currentStaffMismatch && <option value={String(report.assigned_to)}>{report.assigned_to_name} · reassign</option>}{categoryStaff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}{!categoryStaff.length && <option value="__none" disabled>No staff for this category</option>}</select><small className="staff-category-hint">{categoryStaff.length} active {categoryStaff.length === 1 ? 'staff member' : 'staff members'} for {report.category_name || report.category.replaceAll('_',' ')}</small></> : <span className="text-sm">{report.assigned_to_name || <i className="text-muted">Unassigned</i>}</span>}</td><td><select className="table-select" aria-label={`Priority for ${report.title}`} value={priority} onChange={(e) => setPriority(e.target.value)}>{priorities.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></td><td><select className="table-select" aria-label={`Status for ${report.title}`} value={status} onChange={(e) => setStatus(e.target.value)}>{reportStatuses.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select><input className="table-note" aria-label={`Update note for ${report.title}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={status === 'rejected' ? 'Reason required' : 'Optional update note'} />{error && <small className="field-error">{error}</small>}{saved && <small className="saved-inline"><Check size={12} /> Saved</small>}</td><td><button className="btn btn-primary btn-sm" disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></td></tr>;
}

function StaffManager({ reloadKey, onChange, categories, canDeactivate }) {
  const [staff, setStaff] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [form, setForm] = useState({ name:'', email:'', password:'', category:'' }); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(null);
  async function load() { setLoading(true); setError(''); try { const response = await api('/admin/staff'); setStaff(response.data); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [reloadKey]);
  async function create(e) { e.preventDefault(); setBusy(true); setNotice(null); try { await api('/admin/staff', { method:'POST', body:JSON.stringify(form) }); setForm({ name:'', email:'', password:'', category:'' }); setNotice({type:'success',text:'Staff account created. Share the initial password securely.'}); onChange(); await load(); } catch(e) { setNotice({type:'error',text:e.message}); } finally { setBusy(false); } }
  async function toggle(member) { setNotice(null); try { await api(`/admin/staff/${member.id}`, { method:'PATCH', body:JSON.stringify({is_active:!member.is_active}) }); await load(); } catch(e) { setNotice({type:'error',text:e.message}); } }
  return <section className="staff-manager"><div className="staff-manager-head"><div><p className="eyebrow">PEOPLE POWERING THE FIX</p><h2>Staff accounts</h2><p>Each staff account is linked to one report category.</p></div><span className="staff-count"><UsersRound size={15} />{staff.length} team members</span></div>
    {notice && <InlineMessage type={notice.type}>{notice.text}</InlineMessage>}
    <div className="staff-manager-grid"><div className="staff-list">{loading ? <Loading label="Loading staff…" /> : error ? <ErrorState message={error} onRetry={load} /> : staff.length ? staff.map((member) => <div className="staff-member" key={member.id}><span className="staff-avatar">{member.name.slice(0,1).toUpperCase()}</span><div className="staff-member-info"><b>{member.name}</b><small>{member.email}</small><span className="staff-workload">{member.category_name || 'No category'} · {Number(member.assigned_reports || 0)} assigned · {Number(member.active_reports || 0)} in progress</span></div>{canDeactivate ? <button onClick={() => toggle(member)} className={`staff-active ${member.is_active ? 'is-active' : ''}`}>{member.is_active ? 'Active' : 'Paused'}</button> : <span className={`staff-active ${member.is_active ? 'is-active' : ''}`}>{member.is_active ? 'Active' : 'Paused'}</span>}</div>) : <EmptyState title="No staff accounts" text="Create an account for the people who will resolve reported problems." />}</div>
      <form className="create-staff" onSubmit={create}><span className="create-staff-icon"><Plus size={17} /></span><h3>Add a staff member</h3><p>Staff can be assigned reports from this category.</p><label className="field">Full name<input required minLength="2" maxLength="120" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Staff member name" /></label><label className="field">Email address<input type="email" required value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="name@example.com" /></label><label className="field">Report category<select required value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}><option value="">Choose a category</option>{categories.filter((category)=>category.is_active).map((category)=><option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label><label className="field">Initial password<input type="password" required minLength="12" maxLength="128" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="At least 12 characters" /><small className="field-hint">Share it privately. Password changes and resets are not available in this first version.</small></label><button className="btn btn-primary w-full" disabled={busy || !categories.some((category)=>category.is_active)}>{busy ? 'Creating account…' : <>Create staff account <ArrowRight size={15} /></>}</button></form>
    </div>
  </section>;
}

function CategoryRow({ category, onSaved }) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function save() {
    setBusy(true); setError(''); setNotice('');
    try {
      await api(`/admin/categories/${encodeURIComponent(category.slug)}`, { method:'PATCH', body:JSON.stringify({name, description}) });
      setNotice('Saved'); onSaved();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function toggleActive() {
    setBusy(true); setError(''); setNotice('');
    try {
      if (category.is_active) await api(`/admin/categories/${encodeURIComponent(category.slug)}`, {method:'DELETE'});
      else await api(`/admin/categories/${encodeURIComponent(category.slug)}`, {method:'PATCH',body:JSON.stringify({is_active:true})});
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  const dirty = name.trim() !== category.name || description !== (category.description || '');
  return <div className="category-admin-row"><div className="category-admin-fields"><label className="field">Category name<input maxLength="80" value={name} onChange={(e)=>setName(e.target.value)} /></label><label className="field">Description<input maxLength="255" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="What kinds of problems fit here?" /></label><small className="category-slug">Key: {category.slug} · {Number(category.report_count || 0)} reports · {Number(category.staff_count || 0)} staff</small></div><div className="category-admin-actions"><span className={`staff-active ${category.is_active ? 'is-active' : ''}`}>{category.is_active ? 'Active' : 'Archived'}</span><button className="btn btn-secondary btn-sm" disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : 'Save'}</button><button className="btn btn-secondary btn-sm" disabled={busy} onClick={toggleActive}>{category.is_active ? 'Archive' : 'Restore'}</button></div>{error && <small className="field-error category-row-error">{error}</small>}{notice && <small className="saved-inline category-row-error"><Check size={12}/>{notice}</small>}</div>;
}

function CategoryManager({ reloadKey, onChange }) {
  const [categories, setCategories] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [form, setForm] = useState({name:'',description:''}); const [notice, setNotice] = useState(null); const [busy, setBusy] = useState(false);
  async function load() { setLoading(true); setError(''); try { const result = await api('/admin/categories'); setCategories(result.data); } catch(e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(()=>{load();},[reloadKey]);
  async function create(event) { event.preventDefault(); setBusy(true); setNotice(null); try { await api('/admin/categories',{method:'POST',body:JSON.stringify(form)}); setForm({name:'',description:''}); setNotice({type:'success',text:'Category created.'}); onChange(); await load(); } catch(e) { setNotice({type:'error',text:e.message}); } finally { setBusy(false); } }
  return <section className="category-manager"><div className="staff-manager-head"><div><p className="eyebrow">REPORT CLASSIFICATION</p><h2>Report categories</h2><p>Active categories appear in report forms and staff setup. Archiving keeps existing report history.</p></div><span className="staff-count">{categories.filter((category)=>category.is_active).length} active</span></div>
    {notice && <InlineMessage type={notice.type}>{notice.text}</InlineMessage>}
    <div className="category-manager-grid"><div className="category-admin-list">{loading?<Loading label="Loading categories…"/>:error?<ErrorState message={error} onRetry={load}/>:categories.map((category)=><CategoryRow key={category.slug} category={category} onSaved={()=>{onChange();load();}}/>)}{!loading&&!error&&!categories.length&&<EmptyState title="No categories" text="Create a report category to start classifying issues."/>}</div>
      <form className="create-staff category-create" onSubmit={create}><span className="create-staff-icon"><Plus size={17}/></span><h3>Add a category</h3><p>A short name will generate a stable key for saved reports.</p><label className="field">Category name<input required minLength="2" maxLength="80" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="e.g. Public parks"/></label><label className="field">Description <span className="optional">OPTIONAL</span><textarea rows="3" maxLength="255" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="What problems belong in this category?"/></label><button className="btn btn-primary w-full" disabled={busy}>{busy?'Creating…':<>Create category <ArrowRight size={15}/></>}</button></form>
    </div>
  </section>;
}

export function AdminWorkspace() {
  const { user } = useAuth(); const [reports, setReports] = useState([]); const [staff, setStaff] = useState([]); const [categories, setCategories] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [filter, setFilter] = useState('all'); const [reloadKey, setReloadKey] = useState(0);
  const isSuper = user?.role === 'super_admin';
  async function load() { setLoading(true); setError(''); try { const [r, s, c] = await Promise.all([api('/admin/reports'), api('/admin/staff'), api('/admin/categories')]); setReports(r.data); setStaff(s.data); setCategories(c.data); } catch(e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [reloadKey, isSuper]);
  const active = reports.filter((r) => !['resolved','rejected'].includes(r.status));
  const visible = filter === 'all' ? reports : filter === 'open' ? active : reports.filter((r) => r.status === filter);
  const metrics = [{label:'Total reports',value:reports.length,icon:ClipboardList}, {label:'Need attention',value:active.length,icon:CircleAlert}, {label:'Unassigned',value:active.filter((r)=>!r.assigned_to).length,icon:BriefcaseBusiness}, {label:'Resolved',value:reports.filter((r)=>r.status==='resolved').length,icon:BadgeCheck}];
  return <div className="content-page workspace-page"><PageHeading eyebrow={isSuper ? 'SUPER ADMIN WORKSPACE' : 'ADMIN WORKSPACE'} title="Keep good work moving." description={isSuper ? 'Review community reports, coordinate your staff, and make sure every issue has an owner.' : 'Review community reports and keep each update clear and accountable.'} action={<span className="workspace-role"><ShieldCheck size={15} />{isSuper ? 'Super admin' : 'Administrator'}</span>} />
    {loading ? <Loading label="Gathering community activity…" /> : error ? <ErrorState message={error} onRetry={load} /> : <>
      <div className="metric-grid">{metrics.map(({label,value,icon:Icon})=><div className="metric-card" key={label}><span className="metric-icon"><Icon size={18} /></span><span className="metric-number">{value}</span><span className="metric-label">{label}</span></div>)}</div>
      <section className="admin-table-section"><div className="admin-table-heading"><div><p className="eyebrow">THE COMMUNITY QUEUE</p><h2>Reports that need a response</h2><p>Assign ownership, set priority, and keep neighbors in the loop.</p></div><label className="admin-filter">Show<select value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="all">All reports</option><option value="open">Open reports</option><option value="reported">Reported</option><option value="under_review">Under review</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="rejected">Closed</option></select></label></div>
        {visible.length ? <div className="table-overflow"><table className="admin-table"><thead><tr><th>Report</th><th>Current status</th><th>Category</th><th>{isSuper?'Assign staff':'Assigned staff'}</th><th>Priority</th><th>Update status / note</th><th></th></tr></thead><tbody>{visible.map((r)=><AdminRow key={r.id} report={r} staff={staff} canAssign={isSuper} onSaved={()=>setReloadKey((n)=>n+1)} />)}</tbody></table></div> : <EmptyState title="No reports in this view" text="Try another filter or check back when a new issue is reported." />}</section>
      <CategoryManager reloadKey={reloadKey} onChange={()=>setReloadKey((n)=>n+1)} />
      <StaffManager reloadKey={reloadKey} onChange={()=>setReloadKey((n)=>n+1)} categories={categories} canDeactivate={isSuper} />
    </>}
  </div>;
}

export function StaffWorkspace() {
  const [reports,setReports] = useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [notes,setNotes]=useState({}); const [busy,setBusy]=useState(null); const [notice,setNotice]=useState(null);
  async function load() { setLoading(true); setError(''); try { const r=await api('/reports/staff/assigned'); setReports(r.data); } catch(e) {setError(e.message);} finally {setLoading(false);} }
  useEffect(()=>{load();},[]);
  async function update(report,status) {setBusy(report.id);setNotice(null);try{await api(`/reports/staff/reports/${report.id}`,{method:'PATCH',body:JSON.stringify({status,note:notes[report.id]||undefined})});setNotice({type:'success',text:`“${report.title}” updated.`});setNotes((n)=>({...n,[report.id]:''}));await load();}catch(e){setNotice({type:'error',text:e.message});}finally{setBusy(null);}}
  const open=reports.filter((r)=>!['resolved','rejected'].includes(r.status));
  return <div className="content-page workspace-page"><PageHeading eyebrow="YOUR WORK QUEUE" title="The next good fix starts here." description="Here are the reports assigned to you. Share a clear update as the work moves forward." action={<span className="workspace-role"><BriefcaseBusiness size={15} /> Staff view</span>} />
    <div className="metric-grid staff-metrics"><div className="metric-card"><span className="metric-icon"><ClipboardList size={18}/></span><span className="metric-number">{reports.length}</span><span className="metric-label">Assigned to you</span></div><div className="metric-card"><span className="metric-icon"><CircleAlert size={18}/></span><span className="metric-number">{open.length}</span><span className="metric-label">Still in progress</span></div><div className="metric-card"><span className="metric-icon"><BadgeCheck size={18}/></span><span className="metric-number">{reports.filter((r)=>r.status==='resolved').length}</span><span className="metric-label">Resolved by you</span></div></div>
    <section className="staff-work-section"><div className="admin-table-heading"><div><p className="eyebrow">YOUR ASSIGNED REPORTS</p><h2>Work on the block</h2><p>Urgent and older reports are shown first.</p></div></div>{notice&&<InlineMessage type={notice.type}>{notice.text}</InlineMessage>}
      {loading?<Loading label="Loading your assignments…"/>:error?<ErrorState message={error} onRetry={load}/>:reports.length?<div className="staff-work-list">{reports.map((r)=><article className="staff-work-card" key={r.id}><div className="staff-work-main"><div className="detail-topline"><span className="category-label">{r.category_name || r.category.replaceAll('_',' ')}</span><PriorityBadge priority={r.priority}/><StatusBadge status={r.status}/></div><Link to={`/reports/${r.id}`} className="staff-work-title">{r.title}<ArrowRight size={16}/></Link><p>{r.description}</p><div className="detail-meta"><span>{r.neighborhood}{r.landmark?` · ${r.landmark}`:''}</span><span>#{String(r.id).padStart(4,'0')}</span></div></div>{!['resolved','rejected'].includes(r.status)&&<div className="staff-work-actions"><label className="field">Update note <span className="optional">OPTIONAL</span><textarea rows="2" maxLength="1000" value={notes[r.id]||''} onChange={(e)=>setNotes((n)=>({...n,[r.id]:e.target.value}))} placeholder="What did you do? What happens next?" /></label><div className="staff-button-row">{r.status!=='in_progress'&&<button className="btn btn-secondary" disabled={busy===r.id} onClick={()=>update(r,'in_progress')}>Mark in progress</button>}<button className="btn btn-primary" disabled={busy===r.id} onClick={()=>update(r,'resolved')}>{busy===r.id?'Saving…':<><Check size={15}/> Mark resolved</>}</button></div></div>}</article>)}</div>:<EmptyState title="No reports assigned yet" text="When a super admin assigns work to you, it will appear here."/>}</section>
  </div>;
}
