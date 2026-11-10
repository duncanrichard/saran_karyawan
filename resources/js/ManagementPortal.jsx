import { useEffect, useRef, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const initialAccount = { first_name: '', last_name: '', username: '', email: '', password: '', password_confirmation: '' };

function headers() {
    return { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '' };
}

async function jsonRequest(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...headers(), ...(options.headers ?? {}) } });
    const data = await response.json();
    if (!response.ok) throw new Error(Object.values(data.errors ?? {}).flat().join(' ') || data.message || 'Permintaan tidak dapat diproses.');
    return data;
}

function Notice({ children, type = 'error' }) {
    if (!children) return null;
    return <p className={`rounded-xl border px-4 py-3 text-sm leading-6 ${type === 'error' ? 'border-[#e8c4b3] bg-[#fff4ee] text-[#8e4129]' : 'border-[#b7d2be] bg-[#edf7ef] text-[#255a37]'}`}>{children}</p>;
}

function NotificationMenu({ notifications, onOpen, open, setOpen, unreadCount }) {
    const formatTime = (value) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));

    return <div className="relative"><button aria-expanded={open} aria-haspopup="dialog" aria-label={unreadCount ? `${unreadCount} notifikasi belum dibaca` : 'Notifikasi'} className="relative flex min-h-11 items-center gap-2 rounded-xl border border-[#aebfb6] px-3 text-sm font-semibold text-[#315b50] hover:bg-[#edf3ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1742]" onClick={() => setOpen((value) => !value)} type="button"><span aria-hidden="true">◉</span><span className="hidden sm:inline">Notifikasi</span>{unreadCount > 0 && <span aria-label={`${unreadCount} belum dibaca`} className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#b55234] px-1 text-xs font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>{open && <section aria-label="Notifikasi tiket" className="absolute right-0 z-30 mt-2 w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[#d4ddd6] bg-[#fbfaf6] shadow-xl"><div className="border-b border-[#e0e7e1] px-4 py-3"><h2 className="font-serif text-lg font-bold">Notifikasi tiket</h2><p className="mt-1 text-xs text-[#587068]">Dikirim langsung melalui Reverb.</p></div><div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.map((notification) => <button className={`block w-full border-b border-[#e0e7e1] px-4 py-3 text-left last:border-b-0 hover:bg-[#edf3ee] ${notification.read_at ? 'text-[#587068]' : 'bg-[#fff8f2] text-[#183f37]'}`} key={notification.id} onClick={() => onOpen(notification)} type="button"><span className="block text-sm font-semibold">{notification.title}</span><span className="mt-1 block text-sm leading-5">{notification.body}</span><span className="mt-1 block text-xs">{formatTime(notification.created_at)}</span></button>) : <p className="px-4 py-8 text-center text-sm text-[#587068]">Belum ada notifikasi tiket.</p>}</div></section>}</div>;
}

function Login({ onLogin }) {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            onLogin((await jsonRequest('/management/auth/login', { method: 'POST', body: JSON.stringify(credentials) })).user);
        } catch (exception) {
            setError(exception.message);
        } finally {
            setLoading(false);
        }
    };

    return <main className="min-h-screen bg-[#0b0d14] px-5 py-8 text-[#f7f7f2] sm:px-10 sm:py-12"><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center"><section><p className="text-sm font-semibold tracking-[0.14em] text-[#f3c2aa]">SUARA KARYAWAN</p><h1 className="mt-4 max-w-lg font-serif text-5xl font-bold leading-[0.96] sm:text-6xl">Management saran karyawan.</h1><p className="mt-6 max-w-md text-base leading-8 text-[#c9d1dd]">Tinjau semua tiket, berikan respons, dan kelola kategori saran dari satu area yang aman.</p></section><section className="rounded-[1.75rem] border border-[#344875] bg-[#111a31] p-6 shadow-[0_24px_55px_rgba(0,0,0,0.28)] sm:p-9"><p className="text-xs font-bold tracking-[0.14em] text-[#f3c2aa]">LOGIN MANAGEMENT</p><h2 className="mt-3 font-serif text-3xl font-bold">Masuk</h2><p className="mt-2 text-sm leading-6 text-[#c9d1dd]">Akun dibuat oleh Super Admin. Tidak tersedia pendaftaran mandiri.</p><div className="mt-6"><Notice>{error}</Notice></div><form className="mt-6 grid gap-5" onSubmit={submit}><label className="grid gap-2 text-sm font-semibold">Username<input autoComplete="username" className="min-h-12 rounded-xl border border-[#526b9f] bg-[#0b1123] px-3 font-normal text-white outline-none focus:border-[#f3c2aa] focus:ring-2 focus:ring-[#f3c2aa]/30" onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} value={credentials.username} /></label><label className="grid gap-2 text-sm font-semibold">Password<span className="flex overflow-hidden rounded-xl border border-[#526b9f] bg-[#0b1123] focus-within:border-[#f3c2aa] focus-within:ring-2 focus-within:ring-[#f3c2aa]/30"><input autoComplete="current-password" className="min-h-12 min-w-0 flex-1 bg-transparent px-3 font-normal text-white outline-none" onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} type={showPassword ? 'text' : 'password'} value={credentials.password} /><button aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} className="min-h-12 border-l border-[#526b9f] px-4 text-sm font-semibold text-[#f3c2aa] hover:bg-[#182442]" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? 'Sembunyikan' : 'Lihat'}</button></span></label><button className="min-h-12 rounded-xl bg-[#f3c2aa] px-5 text-sm font-bold text-[#1e2534] hover:bg-[#ffe1d2] disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Memeriksa akun...' : 'Masuk ke Management'}</button></form><a className="mt-4 flex min-h-12 items-center justify-center rounded-xl border border-[#526b9f] px-5 text-sm font-bold text-[#f7f7f2] hover:bg-[#182442]" href="/">Masuk sebagai Employee</a></section></div></main>;
}

function TicketModal({ onClose, onReply, ticket }) {
    const [reply, setReply] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const closeWithEscape = (event) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', closeWithEscape);
        return () => window.removeEventListener('keydown', closeWithEscape);
    }, [onClose]);

    const sendReply = async (event) => { event.preventDefault(); if (!reply.trim()) return; setSaving(true); await onReply(ticket.id, reply.trim()); setReply(''); setSaving(false); };

    return <div aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0d14]/60 p-4 sm:p-8" role="dialog" aria-label={`Tiket ${ticket.ticket_number}`}><div className="mx-auto max-w-3xl rounded-[1.5rem] bg-[#fbfaf6] p-5 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-wide text-[#b55234]">{ticket.ticket_number}</p><h2 className="mt-2 font-serif text-3xl font-bold">{ticket.title}</h2></div><button aria-label="Tutup detail tiket" className="min-h-11 rounded-xl border border-[#aebfb6] px-4 text-sm font-semibold text-[#315b50] hover:bg-[#edf3ee]" onClick={onClose} type="button">Tutup</button></div><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-full bg-[#edf3ee] px-3 py-1 text-xs font-bold text-[#315b50]">{ticket.is_anonymous ? 'Anonim' : `${ticket.submitted_by?.first_name ?? 'Karyawan'} ${ticket.submitted_by?.last_name ?? ''}`}</span></div><div className="mt-6 grid gap-4 border-y border-[#e0e7e1] py-5 sm:grid-cols-2"><p className="text-sm"><span className="block text-xs text-[#6c8179]">Kategori</span><span className="mt-1 block font-semibold">{ticket.category?.name}</span></p><p className="text-sm"><span className="block text-xs text-[#6c8179]">Dikirim</span><span className="mt-1 block font-semibold">{new Date(ticket.submitted_at).toLocaleString('id-ID')}</span></p></div><p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#49665d]">{ticket.details}</p>{ticket.attachments?.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{ticket.attachments.map((attachment) => <a className="inline-flex min-h-11 items-center rounded-lg bg-[#edf3ee] px-3 text-sm font-semibold text-[#315b50] hover:bg-[#dcebe1]" href={attachment.url_system} key={attachment.id} rel="noreferrer" target="_blank">Buka {attachment.original_name}</a>)}</div>}<section className="mt-7"><h3 className="font-serif text-2xl font-bold">Respons Management</h3><div className="mt-4 grid gap-3">{ticket.messages?.length === 0 ? <p className="text-sm text-[#587068]">Belum ada respons untuk tiket ini.</p> : ticket.messages?.map((message) => <article className="rounded-xl border border-[#d4ddd6] bg-white p-4" key={message.id}><p className="text-xs font-bold text-[#315b50]">{message.sender?.first_name ?? 'Management'} {message.sender?.last_name ?? ''}</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#49665d]">{message.body}</p></article>)}</div><form className="mt-4 grid gap-3" onSubmit={sendReply}><label className="grid gap-2 text-sm font-semibold">Tulis respons<textarea className="min-h-28 rounded-xl border border-[#aebfb6] bg-white p-3 font-normal text-[#183f37]" maxLength="3000" onChange={(event) => setReply(event.target.value)} placeholder="Tulis jawaban atau tindak lanjut untuk karyawan." value={reply} /></label><button className="min-h-11 justify-self-start rounded-xl bg-[#183f37] px-4 text-sm font-semibold text-white hover:bg-[#315b50] disabled:opacity-60" disabled={saving || !reply.trim()} type="submit">Kirim respons</button></form></section></div></div>;
}

function ComplaintDiagram({ categories }) {
    const max = Math.max(...categories.map((category) => Number(category.total)), 1);
    const chartHeight = 180;
    const chartWidth = 620;
    const baseline = 200;
    const slot = chartWidth / Math.max(categories.length, 1);

    if (!categories.length) return <p className="mt-6 text-sm text-[#587068]">Belum ada data kategori.</p>;

    return <div className="mt-6 overflow-x-auto"><svg aria-label="Diagram jumlah tiket per kategori" className="min-w-[38rem]" height="250" role="img" viewBox="0 0 660 250" width="100%"><line stroke="#b9c9bf" strokeWidth="1" x1="20" x2="640" y1={baseline} y2={baseline} />{categories.map((category, index) => { const height = Math.max((Number(category.total) / max) * chartHeight, Number(category.total) ? 6 : 0); const x = 35 + (slot * index); const label = category.name.length > 14 ? `${category.name.slice(0, 13)}…` : category.name; return <g key={category.id}><title>{`${category.name}: ${category.total} tiket`}</title><text fill="#587068" fontSize="12" textAnchor="middle" x={x + 30} y={baseline - height - 9}>{category.total}</text><rect fill="#b55234" height={height} rx="6" width="60" x={x} y={baseline - height} /><text fill="#49665d" fontSize="11" textAnchor="middle" x={x + 30} y="223">{label}</text></g>; })}</svg><p className="mt-2 text-xs text-[#587068]">Nilai di atas setiap kolom menunjukkan jumlah tiket.</p></div>;
}

function Dashboard({ data, onViewTickets }) {
    const metrics = [['Total tiket', data.total_tickets], ['Tiket hari ini', data.today_tickets], ['Tiket anonim', data.anonymous_tickets], ['Respons Management', data.management_responses], ['Kategori aktif', data.active_categories]];
    return <section><p className="text-sm font-semibold tracking-[0.14em] text-[#b55234]">COMMAND CENTER</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-4xl font-bold">Dashboard Management</h1><p className="mt-2 text-sm leading-6 text-[#587068]">Ringkasan aktivitas saran karyawan saat ini.</p></div><button className="min-h-11 rounded-xl bg-[#183f37] px-4 text-sm font-semibold text-white hover:bg-[#315b50]" onClick={onViewTickets} type="button">Lihat semua tiket</button></div><div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map(([label, value]) => <article className="rounded-2xl border border-[#d4ddd6] bg-[#fbfaf6] p-4" key={label}><p className="text-xs font-semibold text-[#587068]">{label}</p><p className="mt-2 font-serif text-3xl font-bold">{value}</p></article>)}</div><div className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"><section className="rounded-[1.5rem] border border-[#d4ddd6] bg-[#fbfaf6] p-5"><h2 className="font-serif text-2xl font-bold">Kategori paling sering dikeluhkan</h2><p className="mt-1 text-sm text-[#587068]">Diagram jumlah tiket berdasarkan kategori.</p><ComplaintDiagram categories={data.category_complaints ?? []} /></section><section className="rounded-[1.5rem] border border-[#d4ddd6] bg-[#fbfaf6] p-5"><h2 className="font-serif text-2xl font-bold">Tiket terbaru</h2><div className="mt-4 grid gap-2">{data.recent_tickets?.length ? data.recent_tickets.map((ticket) => <div className="border-b border-[#e0e7e1] py-3 last:border-0" key={ticket.id}><p className="text-xs font-bold text-[#b55234]">{ticket.ticket_number}</p><p className="mt-1 font-semibold">{ticket.title}</p><p className="mt-1 text-sm text-[#587068]">{ticket.category?.name} · {new Date(ticket.submitted_at).toLocaleDateString('id-ID')}</p></div>) : <p className="text-sm text-[#587068]">Belum ada tiket.</p>}</div></section></div></section>;
}

function SearchableSelect({ label, onChange, options, value }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const selected = options.find((option) => option.value === value) ?? options[0];
    const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        const closeWithEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', closeWithEscape);
        return () => window.removeEventListener('keydown', closeWithEscape);
    }, []);

    return <div className="relative"><span className="mb-1.5 block text-xs font-semibold text-[#49665d]">{label}</span><button aria-expanded={open} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#aebfb6] bg-white px-3 text-left text-sm font-normal" onClick={() => { setOpen(!open); setQuery(''); }} type="button"><span>{selected?.label}</span><span aria-hidden="true">⌄</span></button>{open && <div className="absolute z-20 mt-2 w-full rounded-xl border border-[#aebfb6] bg-white p-2 shadow-lg"><input aria-label={`Cari ${label}`} autoFocus className="min-h-10 w-full rounded-lg border border-[#d4ddd6] px-3 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder={`Cari ${label.toLowerCase()}`} value={query} /> <div className="mt-2 max-h-48 overflow-y-auto">{filteredOptions.length ? filteredOptions.map((option) => <button className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm hover:bg-[#edf3ee] ${option.value === value ? 'bg-[#edf3ee] font-semibold text-[#183f37]' : ''}`} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }} type="button">{option.label}</button>) : <p className="px-3 py-3 text-sm text-[#587068]">Pilihan tidak ditemukan.</p>}</div></div>}</div>;
}

function Tickets({ categories, categoryFilter, dateFrom, dateTo, onCategoryChange, onDateChange, onOpen, onResponseFilterChange, onSearchChange, pagination, responseFilter, search, suggestions }) {
    const categoryOptions = [{ value: 'all', label: 'Semua kategori' }, ...categories.map((category) => ({ value: category.id, label: category.name }))];
    const responseOptions = [{ value: 'all', label: 'Semua tiket' }, { value: 'unanswered', label: 'Belum direspons Management' }, { value: 'answered', label: 'Sudah direspons Management' }];
    return <section><div><p className="text-sm font-semibold tracking-[0.14em] text-[#b55234]">SEMUA TIKET</p><h1 className="mt-2 font-serif text-4xl font-bold">Tiket karyawan</h1><p className="mt-2 text-sm leading-6 text-[#587068]">{pagination.total} tiket tersimpan. Identitas tiket anonim tetap disembunyikan.</p></div><div className="mt-7 grid gap-3 rounded-[1.5rem] border border-[#d4ddd6] bg-[#fbfaf6] p-4 sm:grid-cols-2 xl:grid-cols-5"><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Cari tiket<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" onChange={(event) => onSearchChange(event.target.value)} placeholder="Nomor, judul, kategori" value={search} /></label><SearchableSelect label="Kategori" onChange={onCategoryChange} options={categoryOptions} value={categoryFilter} /><SearchableSelect label="Respons Management" onChange={onResponseFilterChange} options={responseOptions} value={responseFilter} /><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Dari tanggal<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" max={dateTo || undefined} onChange={(event) => onDateChange(event.target.value, dateTo)} type="date" value={dateFrom} /></label><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Sampai tanggal<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" min={dateFrom || undefined} onChange={(event) => onDateChange(dateFrom, event.target.value)} type="date" value={dateTo} /></label></div><div className="mt-5 grid gap-3">{suggestions.length === 0 ? <p className="rounded-2xl border border-dashed border-[#b9c9bf] px-5 py-10 text-center text-sm text-[#587068]">Tidak ada tiket yang sesuai dengan filter.</p> : suggestions.map((item) => <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d4ddd6] bg-[#fbfaf6] px-5 py-4" key={item.id}><div className="min-w-0"><p className="text-xs font-bold tracking-wide text-[#b55234]">{item.ticket_number}</p><h2 className="mt-1 truncate font-serif text-xl font-bold">{item.title}</h2><p className="mt-2 text-sm text-[#587068]">{item.category?.name} · {new Date(item.submitted_at).toLocaleDateString('id-ID')} · {item.is_anonymous ? 'Anonim' : `${item.submitted_by?.first_name ?? 'Karyawan'} ${item.submitted_by?.last_name ?? ''}`}</p></div><button className="min-h-11 rounded-xl bg-[#183f37] px-4 text-sm font-semibold text-white hover:bg-[#315b50]" onClick={() => onOpen(item.id)} type="button">Buka tiket</button></article>)}</div>{pagination.last_page > 1 && <nav aria-label="Halaman tiket" className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#587068]">Halaman {pagination.current_page} dari {pagination.last_page}</p><div className="flex gap-2"><button className="min-h-11 rounded-xl border border-[#aebfb6] px-4 text-sm font-semibold disabled:opacity-50" disabled={pagination.current_page === 1} onClick={() => onOpen('page:previous')} type="button">Sebelumnya</button><button className="min-h-11 rounded-xl border border-[#aebfb6] px-4 text-sm font-semibold disabled:opacity-50" disabled={pagination.current_page === pagination.last_page} onClick={() => onOpen('page:next')} type="button">Berikutnya</button></div></nav>}</section>;
}

function Categories({ categories, onCreate, onUpdate }) {
    const [form, setForm] = useState({ name: '', description: '' });
    return <section><p className="text-sm font-semibold tracking-[0.14em] text-[#b55234]">PENGELOLAAN</p><h1 className="mt-2 font-serif text-4xl font-bold">Kategori saran</h1><p className="mt-2 text-sm leading-6 text-[#587068]">Kategori aktif tersedia di formulir saran karyawan.</p><form className="mt-7 grid gap-3 rounded-[1.5rem] border border-[#d4ddd6] bg-[#fbfaf6] p-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end" onSubmit={(event) => { event.preventDefault(); onCreate(form); setForm({ name: '', description: '' }); }}><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Nama kategori<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Deskripsi<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} /></label><button className="min-h-11 rounded-xl bg-[#183f37] px-4 text-sm font-semibold text-white hover:bg-[#315b50]" type="submit">Tambah kategori</button></form><div className="mt-5 grid gap-3">{categories.map((category) => <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d4ddd6] bg-[#fbfaf6] px-5 py-4" key={category.id}><div><h2 className="font-semibold">{category.name}</h2><p className="mt-1 text-sm text-[#587068]">{category.description || 'Tanpa deskripsi'}</p></div><button className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${category.is_active ? 'bg-[#edf3ee] text-[#315b50]' : 'bg-[#f5eff9] text-[#6b1742]'}`} onClick={() => onUpdate(category, { is_active: !category.is_active })} type="button">{category.is_active ? 'Aktif' : 'Nonaktif'}</button></article>)}</div></section>;
}

function Accounts({ onCreate, onUpdate, roles, users }) {
    const [form, setForm] = useState(initialAccount);
    const [drafts, setDrafts] = useState({});
    const [search, setSearch] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const access = { employee: 'Tiket milik sendiri', management: 'Dashboard dan semua tiket', super_admin: 'Seluruh akses dan akun' };
    const draftFor = (account) => drafts[account.id] ?? { role: account.role, role_id: account.roles?.[0]?.id ?? '', is_active: account.is_active };
    const updateDraft = (account, changes) => setDrafts((current) => ({ ...current, [account.id]: { ...draftFor(account), ...changes } }));
    const saveAccess = (account) => {
        const draft = draftFor(account);
        onUpdate(account, { role: draft.role, role_id: draft.role === 'management' ? draft.role_id || null : null, is_active: draft.is_active });
    };
    const normalizedSearch = search.trim().toLocaleLowerCase('id-ID');
    const visibleUsers = users.filter((account) => [account.first_name, account.last_name, account.username, account.email].filter(Boolean).join(' ').toLocaleLowerCase('id-ID').includes(normalizedSearch));
    const accountTypeLabel = (role) => ({ employee: 'Karyawan', management: 'Management', super_admin: 'Super Admin' }[role] ?? role);
    const createdAt = (date) => date ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date)) : '-';

    useEffect(() => {
        if (!editingAccount) return undefined;
        const onKeyDown = (event) => { if (event.key === 'Escape') setEditingAccount(null); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [editingAccount]);

    return <section>
        <div className="flex flex-col gap-4 border-b border-[#d4ddd6] pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm font-semibold tracking-[0.14em] text-[#b55234]">SUPER ADMIN</p><h1 className="mt-2 font-serif text-4xl font-bold">Daftar Users</h1></div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="relative block"><span className="sr-only">Cari akun</span><input className="min-h-11 w-full rounded-xl border border-[#d4ddd6] bg-white py-2 pl-3 pr-10 text-sm text-[#183f37] placeholder:text-[#6c8179] sm:w-60" onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama/username/email..." type="search" value={search} /><span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b1742]">⌕</span></label>
                <button className="min-h-11 rounded-xl bg-[#6b1742] px-4 text-sm font-bold text-white hover:bg-[#841f55]" onClick={() => setShowCreateForm((visible) => !visible)} type="button">{showCreateForm ? 'Tutup form' : '+ Tambah akun'}</button>
            </div>
        </div>
        {showCreateForm && <form className="mt-5 grid gap-4 rounded-2xl border border-[#d4ddd6] bg-[#fbfaf6] p-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onCreate(form); setForm(initialAccount); setShowCreateForm(false); }}><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Nama depan<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, first_name: event.target.value })} required value={form.first_name} /></label><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Nama belakang<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, last_name: event.target.value })} required value={form.last_name} /></label><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Username<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, username: event.target.value })} required value={form.username} /></label><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Email<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} /></label><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Password<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" minLength="12" onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} /></label><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Konfirmasi password<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" minLength="12" onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} required type="password" value={form.password_confirmation} /></label><button className="min-h-11 rounded-xl bg-[#183f37] px-4 text-sm font-semibold text-white hover:bg-[#315b50] sm:col-span-2" type="submit">Buat akun Management</button></form>}
        <div className="mt-5 overflow-x-auto border-y border-[#d4ddd6]"><table className="min-w-[59rem] w-full border-collapse bg-[#fbfaf6] text-left text-sm"><thead className="border-b border-[#d4ddd6] bg-[#f7f2f8] text-xs text-[#3b3040]"><tr><th className="px-4 py-4 font-semibold">Nama</th><th className="px-4 py-4 font-semibold">Username</th><th className="px-4 py-4 font-semibold">Email</th><th className="px-4 py-4 font-semibold">Access system</th><th className="px-4 py-4 font-semibold">Dibuat</th><th className="px-4 py-4 text-center font-semibold">Aksi</th></tr></thead><tbody>{visibleUsers.length ? visibleUsers.map((account) => { const locked = account.role === 'super_admin'; return <tr className="border-b border-[#e0e7e1] last:border-b-0" key={account.id}><td className="px-4 py-4 font-semibold text-[#183f37]">{account.first_name} {account.last_name}</td><td className="px-4 py-4 text-[#49665d]">{account.username}</td><td className="px-4 py-4 text-[#49665d]">{account.email}</td><td className="px-4 py-4"><div className="grid justify-items-start gap-1"><span className={`rounded-full px-3 py-1 text-xs font-bold ${account.role === 'super_admin' ? 'bg-[#f5eff9] text-[#6b1742]' : account.role === 'management' ? 'bg-[#f0e5fb] text-[#6b1742]' : 'bg-[#edf3ee] text-[#315b50]'}`}>{accountTypeLabel(account.role)}</span><span className="text-xs text-[#587068]">{account.roles?.length ? account.roles.map((role) => role.name).join(', ') : access[account.role]}</span>{!account.is_active && <span className="text-xs font-semibold text-[#9b482c]">Nonaktif</span>}</div></td><td className="px-4 py-4 whitespace-nowrap text-[#49665d]">{createdAt(account.created_at)}</td><td className="px-4 py-4 text-center"><details className="relative inline-block text-left"><summary aria-label={`Buka aksi untuk ${account.username}`} className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-xl text-xl font-bold text-[#315b50] hover:bg-[#edf3ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b1742]">⋮</summary><div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-[#e6d8e9] bg-white py-1 shadow-lg"><button className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm text-[#49665d] hover:bg-[#f7f2f8] disabled:cursor-not-allowed disabled:opacity-60" disabled={locked} onClick={() => setEditingAccount(account)} type="button"><span aria-hidden="true">✎</span>Edit</button><button className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm text-[#c23268] hover:bg-[#fff1f5] disabled:cursor-not-allowed disabled:opacity-60" disabled={locked} onClick={() => onUpdate(account, { role: account.role, role_id: account.roles?.[0]?.id ?? null, is_active: !account.is_active })} type="button"><span aria-hidden="true">⌫</span>{account.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>{locked && <p className="border-t border-[#f0e7f1] px-4 py-2 text-xs text-[#6c8179]">Akun ini dilindungi.</p>}</div></details></td></tr>; }) : <tr><td className="px-4 py-10 text-center text-sm text-[#587068]" colSpan="6">{search ? 'Akun yang dicari tidak ditemukan.' : 'Belum ada akun yang dapat dikelola.'}</td></tr>}</tbody></table></div>
        {editingAccount && (() => { const draft = draftFor(editingAccount); const locked = editingAccount.role === 'super_admin'; return <div aria-label={`Edit akun ${editingAccount.username}`} aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-[#183f37]/55 p-4" role="dialog"><section className="w-full max-w-lg rounded-2xl bg-[#fbfaf6] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold tracking-[0.12em] text-[#b55234]">PENGATURAN AKUN</p><h2 className="mt-2 font-serif text-3xl font-bold">Edit akses</h2><p className="mt-2 text-sm text-[#587068]">{editingAccount.first_name} {editingAccount.last_name}</p></div><button aria-label="Tutup modal edit akun" className="min-h-11 min-w-11 rounded-xl border border-[#aebfb6] text-lg font-semibold text-[#315b50] hover:bg-[#edf3ee]" onClick={() => setEditingAccount(null)} type="button">×</button></div><div className="mt-6 grid gap-4"><label className="grid gap-1.5 text-sm font-semibold text-[#49665d]">Tipe akun<select className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 font-normal text-[#183f37]" disabled={locked} onChange={(event) => updateDraft(editingAccount, { role: event.target.value, role_id: event.target.value === 'management' ? draft.role_id : '' })} value={draft.role}><option value="employee">Karyawan</option><option value="management">Management</option></select></label>{draft.role === 'management' && <label className="grid gap-1.5 text-sm font-semibold text-[#49665d]">Role tambahan<select className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 font-normal text-[#183f37]" disabled={locked} onChange={(event) => updateDraft(editingAccount, { role_id: event.target.value })} value={draft.role_id}><option value="">Tanpa role tambahan</option>{roles.filter((role) => !['employee', 'super_admin'].includes(role.name)).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>}<label className="flex min-h-11 items-center gap-3 rounded-xl border border-[#d4ddd6] bg-white px-3 text-sm font-semibold text-[#49665d]"><input checked={editingAccount.is_active} disabled={locked} onChange={() => onUpdate(editingAccount, { role: draft.role, role_id: draft.role === 'management' ? draft.role_id || null : null, is_active: !editingAccount.is_active })} type="checkbox" />Akun aktif</label></div><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className="min-h-11 rounded-xl border border-[#aebfb6] px-4 text-sm font-semibold text-[#315b50] hover:bg-[#edf3ee]" onClick={() => setEditingAccount(null)} type="button">Batal</button><button className="min-h-11 rounded-xl bg-[#6b1742] px-4 text-sm font-semibold text-white hover:bg-[#841f55] disabled:cursor-not-allowed disabled:opacity-60" disabled={locked} onClick={() => { saveAccess(editingAccount); setEditingAccount(null); }} type="button">Simpan perubahan</button></div></section></div>; })()}
    </section>;
}

function Roles() {
    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState({ name: '', description: '' });
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const protectedRoles = ['employee', 'management', 'super_admin'];
    const loadRoles = () => jsonRequest('/management/roles').then((data) => setRoles(data.roles ?? [])).catch((exception) => setError(exception.message));

    useEffect(() => { loadRoles(); }, []);
    const save = async (event) => { event.preventDefault(); setError(''); try { if (editing) await jsonRequest(`/management/roles/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) }); else await jsonRequest('/management/roles', { method: 'POST', body: JSON.stringify(form) }); setForm({ name: '', description: '' }); setEditing(null); loadRoles(); } catch (exception) { setError(exception.message); } };
    const remove = async (role) => { if (!window.confirm(`Hapus role ${role.name}?`)) return; setError(''); try { await jsonRequest(`/management/roles/${role.id}`, { method: 'DELETE' }); loadRoles(); } catch (exception) { setError(exception.message); } };

    return <section><p className="text-sm font-semibold tracking-[0.14em] text-[#b55234]">SUPER ADMIN</p><h1 className="mt-2 font-serif text-4xl font-bold">Role &amp; hak akses</h1><p className="mt-2 text-sm leading-6 text-[#587068]">Tambahkan role untuk kebutuhan organisasi. Role bawaan sistem dilindungi agar akses utama tetap aman.</p>{error && <Notice>{error}</Notice>}<form className="mt-7 grid gap-3 rounded-[1.5rem] border border-[#d4ddd6] bg-[#fbfaf6] p-5 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end" onSubmit={save}><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Nama role<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label><label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Deskripsi hak akses<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal" onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} /></label><div className="flex gap-2"><button className="min-h-11 rounded-xl bg-[#183f37] px-4 text-sm font-semibold text-white hover:bg-[#315b50]" type="submit">{editing ? 'Simpan role' : 'Tambah role'}</button>{editing && <button className="min-h-11 rounded-xl border border-[#aebfb6] px-4 text-sm font-semibold" onClick={() => { setEditing(null); setForm({ name: '', description: '' }); }} type="button">Batal</button>}</div></form><div className="mt-5 grid gap-3">{roles.map((role) => <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d4ddd6] bg-[#fbfaf6] px-5 py-4" key={role.id}><div><h2 className="font-semibold">{role.name}</h2><p className="mt-1 text-sm text-[#587068]">{role.description || 'Deskripsi hak akses belum diisi.'}</p></div><div className="flex gap-2">{protectedRoles.includes(role.name) ? <span className="rounded-full bg-[#edf3ee] px-3 py-2 text-xs font-bold text-[#315b50]">Role sistem</span> : <><button className="min-h-10 rounded-xl border border-[#aebfb6] px-3 text-sm font-semibold" onClick={() => { setEditing(role); setForm({ name: role.name, description: role.description ?? '' }); }} type="button">Ubah</button><button className="min-h-10 rounded-xl bg-[#fff1e8] px-3 text-sm font-semibold text-[#9b482c]" onClick={() => remove(role)} type="button">Hapus</button></>}</div></article>)}</div></section>;
}

export default function ManagementPortal() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('tickets');
    const [suggestions, setSuggestions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [notice, setNotice] = useState('');
    const [liveNotice, setLiveNotice] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [ticketSearch, setTicketSearch] = useState('');
    const [responseFilter, setResponseFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [ticketPage, setTicketPage] = useState(1);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [detailTicket, setDetailTicket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const notificationReady = useRef(false);
    const unreadNotificationIds = useRef(new Set());
    const [dashboard, setDashboard] = useState({ total_tickets: 0, today_tickets: 0, anonymous_tickets: 0, management_responses: 0, active_categories: 0, recent_tickets: [], category_complaints: [] });

    const load = async (account = user, page = ticketPage, search = ticketSearch, response = responseFilter, from = dateFrom, to = dateTo, category = categoryFilter) => {
        if (!account) return;
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (search.trim()) params.set('search', search.trim());
            if (response !== 'all') params.set('response_filter', response);
            if (from) params.set('date_from', from);
            if (to) params.set('date_to', to);
            if (category !== 'all') params.set('category_id', category);
            const requests = [jsonRequest(`/management/suggestions?${params.toString()}`), jsonRequest('/management/categories'), jsonRequest('/management/dashboard')];
            if (account.role === 'super_admin') requests.push(jsonRequest('/management/users'));
            const [ticketData, categoryData, dashboardData, userData] = await Promise.all(requests);
            setSuggestions(ticketData.suggestions ?? []);
            setPagination(ticketData.pagination ?? { current_page: 1, last_page: 1, total: 0 });
            setCategories(categoryData.categories ?? []);
            setDashboard(dashboardData.dashboard ?? {});
            setUsers(userData?.users ?? []);
            setRoles(userData?.roles ?? []);
        } catch (exception) {
            setError(exception.message);
        } finally {
            setLoading(false);
        }
    };

    const loadNotifications = async () => {
        try {
            const data = await jsonRequest('/management/notifications');
            const incoming = data.notifications ?? [];
            const unreadIds = new Set(incoming.filter((notification) => !notification.read_at).map((notification) => notification.id));
            const newTickets = incoming.filter((notification) => notification.type === 'new_ticket' && !notification.read_at && !unreadNotificationIds.current.has(notification.id));
            if (notificationReady.current && newTickets.length) setLiveNotice(newTickets.length === 1 ? `Tiket baru masuk: ${newTickets[0].body}` : `${newTickets.length} tiket baru masuk.`);
            notificationReady.current = true;
            unreadNotificationIds.current = unreadIds;
            setNotifications(incoming);
        } catch (_) {}
    };

    useEffect(() => { jsonRequest('/management/auth/user').then(({ user: account }) => { setUser(account); load(account); }).catch(() => setLoading(false)); }, []);
    useEffect(() => {
        if (!user) return undefined;
        loadNotifications();
        if (!import.meta.env.VITE_REVERB_APP_KEY) return undefined;

        const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';
        const echo = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            Pusher,
            wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
            wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
            wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
        });
        const channel = echo.private('management.notifications').listen('.ticket.created', () => loadNotifications());

        return () => {
            channel.stopListening('.ticket.created');
            echo.disconnect();
        };
    }, [user?.id]);

    const perform = async (action, success) => { setError(''); setNotice(''); try { await action(); setNotice(success); await load(); } catch (exception) { setError(exception.message); } };
    const signOut = async () => { await jsonRequest('/management/auth/logout', { method: 'POST' }); setUser(null); setSuggestions([]); setCategories([]); setUsers([]); setRoles([]); };
    const changeFilters = (search, response = responseFilter, from = dateFrom, to = dateTo, category = categoryFilter) => { setTicketSearch(search); setResponseFilter(response); setDateFrom(from); setDateTo(to); setCategoryFilter(category); setTicketPage(1); load(user, 1, search, response, from, to, category); };
    const openTicket = async (id) => {
        if (id === 'page:previous' || id === 'page:next') {
            const page = id === 'page:previous' ? ticketPage - 1 : ticketPage + 1;
            setTicketPage(page);
            await load(user, page);
            return;
        }
        try {
            setError('');
            setDetailTicket((await jsonRequest(`/management/suggestions/${id}`)).suggestion);
        } catch (exception) {
            setError(exception.message);
        }
    };
    const replyToTicket = async (id, body) => {
        try {
            const data = await jsonRequest(`/management/suggestions/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
            setDetailTicket((ticket) => ticket ? { ...ticket, messages: [...(ticket.messages ?? []), data.message] } : ticket);
            setNotice('Respons berhasil dikirim.');
        } catch (exception) { setError(exception.message); }
    };
    const openNotification = async (notification) => {
        setNotificationOpen(false);
        if (!notification.read_at) {
            try {
                await jsonRequest(`/management/notifications/${notification.id}/read`, { method: 'PATCH' });
                setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
            } catch (exception) { setError(exception.message); }
        }
        if (notification.suggestion_id) {
            setView('tickets');
            await openTicket(notification.suggestion_id);
        }
    };

    if (!user) return <Login onLogin={(account) => { setUser(account); load(account); }} />;

    const menu = [{ key: 'dashboard', label: 'Dashboard' }, { key: 'tickets', label: 'Semua tiket' }, { key: 'categories', label: 'Kategori' }, ...(user.role === 'super_admin' ? [{ key: 'accounts', label: 'Akun & akses' }, { key: 'roles', label: 'Role' }] : [])];
    const unreadCount = notifications.filter((notification) => !notification.read_at).length;
    return <main className="management-portal min-h-screen bg-[#f5f1e8] text-[#183f37]"><header className="border-b border-[#d4ddd6] bg-[#fbfaf6]"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-10"><div><p className="font-serif text-xl font-bold">Suara Karyawan</p><p className="text-xs font-semibold text-[#587068]">Management</p></div><div className="flex items-center gap-3"><NotificationMenu notifications={notifications} onOpen={openNotification} open={notificationOpen} setOpen={setNotificationOpen} unreadCount={unreadCount} /><p className="hidden text-right text-sm sm:block"><span className="block font-semibold">{user.first_name} {user.last_name}</span><span className="text-xs text-[#587068]">{user.role === 'super_admin' ? 'Super Admin' : 'Management'}</span></p><button className="min-h-11 rounded-xl border border-[#aebfb6] px-4 text-sm font-semibold text-[#315b50] hover:bg-[#edf3ee]" onClick={signOut} type="button">Keluar</button></div></div></header><div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-10 lg:grid-cols-[13rem_1fr] lg:py-10"><nav aria-label="Menu Management" className="flex gap-2 overflow-x-auto lg:block lg:space-y-2">{menu.map((item) => <button aria-pressed={view === item.key} className={`min-h-11 shrink-0 rounded-xl px-4 text-left text-sm font-semibold ${view === item.key ? 'bg-[#183f37] text-white' : 'border border-[#d4ddd6] bg-[#fbfaf6] text-[#315b50] hover:bg-[#edf3ee]'} lg:block lg:w-full`} key={item.key} onClick={() => setView(item.key)} type="button">{item.label}</button>)}</nav><div><div className="space-y-4"><Notice type="success">{liveNotice}</Notice><Notice type="success">{notice}</Notice><Notice>{error}</Notice></div>{loading ? <p className="rounded-2xl border border-dashed border-[#b9c9bf] px-5 py-12 text-center text-sm text-[#587068]">Memuat data Management...</p> : view === 'roles' ? <Roles /> : view === 'dashboard' ? <Dashboard data={dashboard} onViewTickets={() => setView('tickets')} /> : view === 'tickets' ? <Tickets categories={categories} categoryFilter={categoryFilter} dateFrom={dateFrom} dateTo={dateTo} onCategoryChange={(value) => changeFilters(ticketSearch, responseFilter, dateFrom, dateTo, value)} onDateChange={(from, to) => changeFilters(ticketSearch, responseFilter, from, to)} onOpen={openTicket} onResponseFilterChange={(value) => changeFilters(ticketSearch, value)} onSearchChange={(value) => changeFilters(value)} pagination={pagination} responseFilter={responseFilter} search={ticketSearch} suggestions={suggestions} /> : view === 'categories' ? <Categories categories={categories} onCreate={(form) => perform(() => jsonRequest('/management/categories', { method: 'POST', body: JSON.stringify(form) }), 'Kategori berhasil ditambahkan.')} onUpdate={(category, changes) => perform(() => jsonRequest(`/management/categories/${category.id}`, { method: 'PATCH', body: JSON.stringify({ name: category.name, description: category.description, is_active: changes.is_active })}), 'Status kategori diperbarui.')} /> : <Accounts onCreate={(form) => perform(() => jsonRequest('/management/users', { method: 'POST', body: JSON.stringify(form) }), 'Akun management berhasil dibuat.')} onUpdate={(account, changes) => perform(() => jsonRequest(`/management/users/${account.id}/access`, { method: 'PATCH', body: JSON.stringify(changes) }), 'Akses akun berhasil diperbarui.')} roles={roles} users={users} />}</div></div>{detailTicket && <TicketModal onClose={() => setDetailTicket(null)} onReply={replyToTicket} ticket={detailTicket} />}</main>;
}
