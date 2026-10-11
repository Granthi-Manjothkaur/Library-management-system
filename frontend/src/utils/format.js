export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Today's date as YYYY-MM-DD (for date inputs)
export const todayISO = () => new Date().toISOString().slice(0, 10);

export const PLACEHOLDER_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect width="200" height="280" fill="#dbeafe"/><rect x="0" y="0" width="14" height="280" fill="#1e3a8a"/><rect x="50" y="90" width="110" height="10" rx="5" fill="#93c5fd"/><rect x="50" y="112" width="80" height="10" rx="5" fill="#93c5fd"/><circle cx="105" cy="190" r="26" fill="#3b82f6" opacity=".35"/></svg>`
  );
