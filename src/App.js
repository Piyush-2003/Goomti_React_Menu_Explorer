import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// ── Colours ──
const BLUE = '#2563eb';
const GREEN = '#059669';
const AMBER = '#d97706';
const RED = '#dc2626';
//const PURPLE = '#7c3aed';

// ── Quadrant classifier ──
function getQuadrant(item, avgRevenue, avgVolume) {
  const highRev = item.Net_Sales >= avgRevenue;
  const highVol = item.Items_Sold >= avgVolume;
  if (highRev && highVol) return { label: 'Star ⭐', color: GREEN };
  if (highRev && !highVol) return { label: 'Puzzle ❓', color: AMBER };
  if (!highRev && highVol) return { label: 'Plowhorse 🐄', color: BLUE };
  return { label: 'Dog 🐕', color: RED };
}

// ── Menu Card Component ──
function MenuCard({ item, avgRevenue, avgVolume }) {
  const quadrant = getQuadrant(item, avgRevenue, avgVolume);
  const maxSales = 1039.35;
  const barWidth = Math.round((item.Net_Sales / maxSales) * 100);

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e6f0',
      borderRadius: 12,
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.Item}</div>
          <span style={{ background: '#eff6ff', color: BLUE, fontSize: 10, padding: '2px 8px', borderRadius: 20 }}>
            {item.Category}
          </span>
        </div>
        <span style={{ background: quadrant.color + '20', color: quadrant.color, fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>
          {quadrant.label}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: GREEN }}>£{Number(item.Net_Sales).toFixed(2)}</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>Net Sales</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: BLUE }}>{item.Items_Sold}</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>Sold</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: AMBER }}>£{Number(item.Avg_Price).toFixed(2)}</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>Avg Price</div>
        </div>
      </div>

      {/* Revenue bar */}
      <div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>Revenue share</div>
        <div style={{ background: '#f0f2f8', borderRadius: 4, height: 6 }}>
          <div style={{ width: `${barWidth}%`, background: quadrant.color, borderRadius: 4, height: 6 }} />
        </div>
      </div>
    </div>
  );
}

// ── Main App ──
export default function App() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('revenue');
  const [quadrantFilter, setQuadrantFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Load CSV
  useEffect(() => {
    Papa.parse('/dim_menu_items.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        const clean = result.data.filter(r => r.Item && r.Net_Sales > 0);
        setItems(clean);
        setLoading(false);
      }
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>
      <p style={{ color: '#6b7280' }}>Loading menu data...</p>
    </div>
  );

  // ── Calculations ──
  const avgRevenue = items.reduce((s, i) => s + i.Net_Sales, 0) / items.length;
  const avgVolume = items.reduce((s, i) => s + i.Items_Sold, 0) / items.length;
  const categories = ['All', ...new Set(items.map(i => i.Category))];
  const totalRevenue = items.reduce((s, i) => s + i.Net_Sales, 0);

  // ── Filter + Sort ──
  const filtered = items
    .filter(i => i.Item.toLowerCase().includes(search.toLowerCase()))
    .filter(i => category === 'All' || i.Category === category)
    .filter(i => {
      if (quadrantFilter === 'All') return true;
      return getQuadrant(i, avgRevenue, avgVolume).label.includes(quadrantFilter);
    })
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.Net_Sales - a.Net_Sales;
      if (sortBy === 'volume') return b.Items_Sold - a.Items_Sold;
      if (sortBy === 'price') return b.Avg_Price - a.Avg_Price;
      return 0;
    });

  // Quadrant counts
  const counts = { Star: 0, Puzzle: 0, Plowhorse: 0, Dog: 0 };
  items.forEach(i => {
    const q = getQuadrant(i, avgRevenue, avgVolume).label;
    if (q.includes('Star')) counts.Star++;
    if (q.includes('Puzzle')) counts.Puzzle++;
    if (q.includes('Plowhorse')) counts.Plowhorse++;
    if (q.includes('Dog')) counts.Dog++;
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f4f6fb', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e6f0', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>G</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Goomti Menu Explorer</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>Menu Engineering Analysis</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{filtered.length} of {items.length} items</div>
      </div>

      {/* Quadrant Summary Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e6f0', padding: '12px 28px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Star ⭐', count: counts.Star, color: GREEN },
          { label: 'Puzzle ❓', count: counts.Puzzle, color: AMBER },
          { label: 'Plowhorse 🐄', count: counts.Plowhorse, color: BLUE },
          { label: 'Dog 🐕', count: counts.Dog, color: RED },
        ].map(q => (
          <div
            key={q.label}
            onClick={() => setQuadrantFilter(quadrantFilter === q.label.split(' ')[0] ? 'All' : q.label.split(' ')[0])}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: quadrantFilter === q.label.split(' ')[0] ? q.color + '20' : '#f4f6fb',
              border: `1px solid ${quadrantFilter === q.label.split(' ')[0] ? q.color : '#e2e6f0'}`,
              borderRadius: 20, padding: '6px 14px', cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: q.color }}>{q.label}</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{q.count} items</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center' }}>
          Total dine-in revenue: <strong style={{ color: GREEN, marginLeft: 6 }}>£{totalRevenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</strong>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '16px 28px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Search */}
        <input
          type="text"
          placeholder="Search menu items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e6f0', borderRadius: 8, fontSize: 13, width: 220, outline: 'none', background: '#fff' }}
        />

        {/* Category dropdown */}
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e6f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e6f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
        >
          <option value="revenue">Sort by Revenue</option>
          <option value="volume">Sort by Volume</option>
          <option value="price">Sort by Avg Price</option>
        </select>

        {/* Clear filters */}
        {(search || category !== 'All' || quadrantFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setCategory('All'); setQuadrantFilter('All'); }}
            style={{ padding: '9px 14px', border: '1px solid #e2e6f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer', color: RED }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Cards Grid */}
      <div style={{ padding: '0 28px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            No items found. Try clearing your filters.
          </div>
        ) : (
          filtered.map((item, i) => (
            <MenuCard key={i} item={item} avgRevenue={avgRevenue} avgVolume={avgVolume} />
          ))
        )}
      </div>
    </div>
  );
}