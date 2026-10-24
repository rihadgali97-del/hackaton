import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../services/api';
import { EmptyState, ErrorState, Loading, PageHeading, ReportCard } from '../components/Shared';

const categories = [['', 'All categories'], ['road_damage', 'Road damage'], ['streetlight', 'Streetlights'], ['water_leak', 'Water leaks'], ['drainage', 'Drainage'], ['waste', 'Waste'], ['sidewalk', 'Sidewalks'], ['other', 'Other']];
const statuses = [['', 'All statuses'], ['reported', 'Reported'], ['under_review', 'Under review'], ['in_progress', 'In progress'], ['resolved', 'Resolved'], ['rejected', 'Closed']];

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [filters, setFilters] = useState({ category: params.get('category') || '', status: params.get('status') || '', priority: params.get('priority') || '', neighborhood: params.get('neighborhood') || '' });
  const [data, setData] = useState([]); const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [page, setPage] = useState(1);
  async function load(nextPage = 1, override = null) {
    setLoading(true); setError('');
    const query = new URLSearchParams({ page: nextPage, limit: 9 });
    const effectiveSearch = override ? override.search : search.trim();
    const effectiveFilters = override ? override.filters : filters;
    if (effectiveSearch) query.set('search', effectiveSearch);
    Object.entries(effectiveFilters).forEach(([key, value]) => value && query.set(key, value));
    try { const result = await api(`/reports?${query}`); setData(result.data); setPagination(result.pagination); setPage(nextPage); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(1); }, []);
  function submit(event) { event.preventDefault(); const next = new URLSearchParams(); if (search.trim()) next.set('search', search.trim()); Object.entries(filters).forEach(([k,v]) => v && next.set(k,v)); setParams(next); load(1); }
  function changeFilter(key, value) { setFilters((previous) => ({ ...previous, [key]: value })); }
  function clear() { const empty = { category: '', status: '', priority: '', neighborhood: '' }; setSearch(''); setFilters(empty); setParams({}); load(1, { search: '', filters: empty }); }
  const hasFilter = Boolean(search || Object.values(filters).some(Boolean));
  return <div className="content-page">
    <PageHeading eyebrow="COMMUNITY ACTIVITY" title="Explore reports" description="See what your neighbors are reporting and follow the work as it gets done." action={<Link to="/report/new" className="btn btn-primary"><span>+</span> New report</Link>} />
    <form className="filter-panel" onSubmit={submit}>
      <label className="search-field"><Search size={18} /><input aria-label="Search reports" placeholder="Search reports, places, or details…" value={search} onChange={(e) => setSearch(e.target.value)} /><button type="submit" className="btn btn-primary search-submit">Search</button></label>
      <div className="filters-row"><span className="filter-label"><SlidersHorizontal size={14} /> FILTER BY</span>
        <select aria-label="Category" value={filters.category} onChange={(e) => changeFilter('category', e.target.value)}>{categories.map(([v,l]) => <option value={v} key={v}>{l}</option>)}</select>
        <select aria-label="Status" value={filters.status} onChange={(e) => changeFilter('status', e.target.value)}>{statuses.map(([v,l]) => <option value={v} key={v}>{l}</option>)}</select>
        <select aria-label="Priority" value={filters.priority} onChange={(e) => changeFilter('priority', e.target.value)}><option value="">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
        <input aria-label="Neighborhood" className="neighborhood-filter" placeholder="Neighborhood" value={filters.neighborhood} onChange={(e) => changeFilter('neighborhood', e.target.value)} />
        <button className="btn btn-secondary filter-apply" type="submit"><Filter size={15} /> Apply</button>
        {hasFilter && <button className="clear-filter" type="button" onClick={clear}><X size={14} /> Clear</button>}
      </div>
    </form>
    <div className="results-bar"><span>{pagination ? <><b>{pagination.total}</b> reports in the community</> : 'Community reports'}</span><span className="results-sort">Newest first <ArrowRight size={13} /></span></div>
    {loading ? <Loading label="Looking through community reports…" /> : error ? <ErrorState message={error} onRetry={() => load(page)} /> : data.length ? <><div className="report-grid">{data.map((report) => <ReportCard key={report.id} report={report} />)}</div>{pagination?.pages > 1 && <div className="pagination"><button className="btn btn-secondary" disabled={page === 1} onClick={() => load(page - 1)}>Previous</button><span>Page <b>{page}</b> of {pagination.pages}</span><button className="btn btn-secondary" disabled={page >= pagination.pages} onClick={() => load(page + 1)}>Next <ArrowRight size={14} /></button></div>}</> : <EmptyState title={hasFilter ? 'No reports match those filters' : 'Nothing reported yet'} text={hasFilter ? 'Try broadening your search or clearing a filter.' : 'Be the first to share something that needs attention.'} />}
  </div>;
}
