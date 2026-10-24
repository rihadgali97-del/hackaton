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
    if (canAssign) body.assigned_to = assigned ? Number(assigned) : null;
    setBusy(true);
    try { await api(`/admin/reports/${report.id}`, { method: 'PATCH', body: JSON.stringify(body) }); setSaved(true); setNote(''); onSaved(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  const dirty = status !== report.status || priority !== report.priority || (assigned || null) !== (report.assigned_to ? String(report.assigned_to) : null) || Boolean(note.trim());
  return <tr><td><Link className="admin-report-title" to={`/reports/${report.id}`}><b>{report.title}</b><small>#{String(report.id).padStart(4,'0')} · {report.neighborhood}</small></Link></td><td><StatusBadge status={report.status} /></td><td><span className="category-label">{report.category.replaceAll('_',' ')}</span></td><td>{canAssign ? <select className="table-select" aria-label={`Assign ${report.title}`} value={assigned} onChange={(e) => setAssigned(e.target.value)}><option value="">Unassigned</option>{staff.filter((s) => s.is_active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select> : <span className="text-sm">{report.assigned_to_name || <i className="text-muted">Unassigned</i>}</span>}</td><td><select className="table-select" aria-label={`Priority for ${report.title}`} value={priority} onChange={(e) => setPriority(e.target.value)}>{priorities.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></td><td><select className="table-select" aria-label={`Status for ${report.title}`} value={status} onChange={(e) => setStatus(e.target.value)}>{reportStatuses.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select><input className="table-note" aria-label={`Update note for ${report.title}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={status === 'rejected' ? 'Reason required' : 'Optional update note'} />{error && <small className="field-error">{error}</small>}{saved && <small className="saved-inline"><Check size={12} /> Saved</small>}</td><td><button className="btn btn-primary btn-sm" disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></td></tr>;
}

function StaffManager({ reloadKey, onChange }) {
  const [staff, setStaff] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [form, setForm] = useState({ name:'', email:'', password:'' }); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(null);
  async function load() { setLoading(true); setError(''); try { const response = await api('/admin/staff'); setStaff(response.data); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [reloadKey]);
  async function create(e) { e.preventDefault(); setBusy(true); setNotice(null); try { await api('/admin/staff', { method:'POST', body:JSON.stringify(form) }); setForm({ name:'', email:'', password:'' }); setNotice({type:'success',text:'Staff account created. Share the temporary password securely.'}); onChange(); await load(); } catch(e) { setNotice({type:'error',text:e.message}); } finally { setBusy(false); } }
  async function toggle(member) { setNotice(null); try { await api(`/admin/staff/${member.id}`, { method:'PATCH', body:JSON.stringify({is_active:!member.is_active}) }); await load(); } catch(e) { setNotice({type:'error',text:e.message}); } }
  return <section className="staff-manager"><div className="staff-manager-head"><div><p className="eyebrow">PEOPLE POWERING THE FIX</p><h2>Staff accounts</h2><p>Manage the people working on reports in your community.</p></div><span className="staff-count"><UsersRound size={15} />{staff.length} team members</span></div>
    {notice && <InlineMessage type={notice.type}>{notice.text}</InlineMessage>}
    <div className="staff-manager-grid"><div className="staff-list">{loading ? <Loading label="Loading staff…" /> : error ? <ErrorState message={error} onRetry={load} /> : staff.length ? staff.map((member) => <div className="staff-member" key={member.id}><span className="staff-avatar">{member.name.slice(0,1).toUpperCase()}</span><div className="staff-member-info"><b>{member.name}</b><small>{member.email}</small><span className="staff-workload">{Number(member.assigned_reports || 0)} assigned · {Number(member.active_reports || 0)} in progress</span></div><button onClick={() => toggle(member)} className={`staff-active ${member.is_active ? 'is-active' : ''}`}>{member.is_active ? 'Active' : 'Paused'}</button></div>) : <EmptyState title="No staff accounts" text="Create an account for the people who will resolve reported problems." />}</div>
      <form className="create-staff" onSubmit={create}><span className="create-staff-icon"><Plus size={17} /></span><h3>Add a staff member</h3><p>They can sign in to see their assigned reports.</p><label className="field">Full name<input required minLength="2" maxLength="120" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Staff member name" /></label><label className="field">Email address<input type="email" required value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="name@example.com" /></label><label className="field">Initial password<input type="password" required minLength="12" maxLength="128" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="At least 12 characters" /><small className="field-hint">Share it privately. Password changes and resets are not available in this first version.</small></label><button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : <>Create staff account <ArrowRight size={15} /></>}</button></form>
    </div>
  </section>;
}

export function AdminWorkspace() {
  const { user } = useAuth(); const [reports, setReports] = useState([]); const [staff, setStaff] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [filter, setFilter] = useState('all'); const [reloadKey, setReloadKey] = useState(0);
  const isSuper = user?.role === 'super_admin';
  async function load() { setLoading(true); setError(''); try { const [r, s] = await Promise.all([api('/admin/reports'), isSuper ? api('/admin/staff') : Promise.resolve({data:[]})]); setReports(r.data); setStaff(s.data); } catch(e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [reloadKey, isSuper]);
  const active = reports.filter((r) => !['resolved','rejected'].includes(r.status));
  const visible = filter === 'all' ? reports : filter === 'open' ? active : reports.filter((r) => r.status === filter);
  const metrics = [{label:'Total reports',value:reports.length,icon:ClipboardList}, {label:'Need attention',value:active.length,icon:CircleAlert}, {label:'Unassigned',value:active.filter((r)=>!r.assigned_to).length,icon:BriefcaseBusiness}, {label:'Resolved',value:reports.filter((r)=>r.status==='resolved').length,icon:BadgeCheck}];
  return <div className="content-page workspace-page"><PageHeading eyebrow={isSuper ? 'SUPER ADMIN WORKSPACE' : 'ADMIN WORKSPACE'} title="Keep good work moving." description={isSuper ? 'Review community reports, coordinate your staff, and make sure every issue has an owner.' : 'Review community reports and keep each update clear and accountable.'} action={<span className="workspace-role"><ShieldCheck size={15} />{isSuper ? 'Super admin' : 'Administrator'}</span>} />
    {loading ? <Loading label="Gathering community activity…" /> : error ? <ErrorState message={error} onRetry={load} /> : <>
      <div className="metric-grid">{metrics.map(({label,value,icon:Icon})=><div className="metric-card" key={label}><span className="metric-icon"><Icon size={18} /></span><span className="metric-number">{value}</span><span className="metric-label">{label}</span></div>)}</div>
      <section className="admin-table-section"><div className="admin-table-heading"><div><p className="eyebrow">THE COMMUNITY QUEUE</p><h2>Reports that need a response</h2><p>Assign ownership, set priority, and keep neighbors in the loop.</p></div><label className="admin-filter">Show<select value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="all">All reports</option><option value="open">Open reports</option><option value="reported">Reported</option><option value="under_review">Under review</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="rejected">Closed</option></select></label></div>
        {visible.length ? <div className="table-overflow"><table className="admin-table"><thead><tr><th>Report</th><th>Current status</th><th>Category</th><th>{isSuper?'Assign staff':'Assigned staff'}</th><th>Priority</th><th>Update status / note</th><th></th></tr></thead><tbody>{visible.map((r)=><AdminRow key={r.id} report={r} staff={staff} canAssign={isSuper} onSaved={()=>setReloadKey((n)=>n+1)} />)}</tbody></table></div> : <EmptyState title="No reports in this view" text="Try another filter or check back when a new issue is reported." />}</section>
      {isSuper && <StaffManager reloadKey={reloadKey} onChange={()=>setReloadKey((n)=>n+1)} />}
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
      {loading?<Loading label="Loading your assignments…"/>:error?<ErrorState message={error} onRetry={load}/>:reports.length?<div className="staff-work-list">{reports.map((r)=><article className="staff-work-card" key={r.id}><div className="staff-work-main"><div className="detail-topline"><span className="category-label">{r.category.replaceAll('_',' ')}</span><PriorityBadge priority={r.priority}/><StatusBadge status={r.status}/></div><Link to={`/reports/${r.id}`} className="staff-work-title">{r.title}<ArrowRight size={16}/></Link><p>{r.description}</p><div className="detail-meta"><span>{r.neighborhood}{r.landmark?` · ${r.landmark}`:''}</span><span>#{String(r.id).padStart(4,'0')}</span></div></div>{!['resolved','rejected'].includes(r.status)&&<div className="staff-work-actions"><label className="field">Update note <span className="optional">OPTIONAL</span><textarea rows="2" maxLength="1000" value={notes[r.id]||''} onChange={(e)=>setNotes((n)=>({...n,[r.id]:e.target.value}))} placeholder="What did you do? What happens next?" /></label><div className="staff-button-row">{r.status!=='in_progress'&&<button className="btn btn-secondary" disabled={busy===r.id} onClick={()=>update(r,'in_progress')}>Mark in progress</button>}<button className="btn btn-primary" disabled={busy===r.id} onClick={()=>update(r,'resolved')}>{busy===r.id?'Saving…':<><Check size={15}/> Mark resolved</>}</button></div></div>}</article>)}</div>:<EmptyState title="No reports assigned yet" text="When a super admin assigns work to you, it will appear here."/>}</section>
  </div>;
}
