import { useEffect, useRef, useState } from 'react';

function Icon({ name, className = 'h-5 w-5' }) {
    const paths = {
        arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
        plus: <path d="M12 5v14M5 12h14" />,
        ticket: <><path d="M4 5.5h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5v-4Z" /><path d="M13 8v8" /></>,
        profile: <><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20c.8-3.4 3.05-5.1 6.5-5.1s5.7 1.7 6.5 5.1" /></>,
        file: <><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 13h6M9 16h6" /></>,
        back: <path d="m14 6-6 6 6 6" />,
    };

    return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name]}</svg>;
}

function BackButton({ onClick }) {
    return <button aria-label="Kembali ke area layanan" className="session-back-button inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#45645a] hover:bg-[#edf3ee] hover:text-[#183f37] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#c96740]" onClick={onClick} type="button"><Icon name="back" className="h-4 w-4" /><span className="sm:hidden">Kembali</span><span className="hidden sm:inline">Kembali ke area layanan</span></button>;
}

function SuggestionSubmission({ attachment, categories, fileInput, form, inputClass, message, onBack, onSubmit, setAttachment, setForm, submitting }) {
    return <section className="mx-auto max-w-5xl px-5 py-8 sm:px-10 sm:py-12"><BackButton onClick={onBack} /><div className="mt-9 overflow-hidden rounded-[2rem] border border-[#162d5e] bg-[#0d1834] text-white shadow-[0_20px_55px_rgba(13,24,52,0.18)]"><div className="grid gap-6 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-bold tracking-[0.16em] text-[#ffe200]">TIKET BARU</p><h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">Sampaikan saran Anda</h1><p className="mt-4 max-w-xl text-sm leading-7 text-[#cdd6e9]">Tuliskan hal yang ingin diperbaiki. Tiket akan diteruskan kepada HR dan PIC yang sesuai.</p></div><div className="flex gap-2"><span className="rounded-full border border-[#4f6fbd] bg-[#172a57] px-3 py-2 text-xs font-semibold text-[#dbe5ff]">Tercatat sebagai tiket</span><span className="rounded-full bg-[#ffe200] px-3 py-2 text-xs font-semibold text-[#17223d]">Privasi terjaga</span></div></div></div>{message && <p className="mt-6 rounded-xl border border-[#e8c4b3] bg-[#fff4ee] px-4 py-3 text-sm text-[#8e4129]">{message}</p>}<form className="mt-6 rounded-[2rem] border border-[#d4ddd6] bg-[#fbfaf6] p-6 shadow-[0_15px_35px_rgba(43,65,57,0.06)] sm:p-10" onSubmit={onSubmit}><fieldset><legend className="text-lg font-semibold text-[#183f37]">Detail saran</legend><p className="mt-1 text-sm leading-6 text-[#587068]">Berikan konteks secukupnya agar tim dapat menilai dan menindaklanjuti saran Anda.</p><div className="mt-7 grid gap-6"><label className="grid gap-2 text-sm font-semibold">Kategori <span className="text-[#b55234]">*</span><select className={inputClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">Pilih kategori saran</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold">Judul saran <span className="text-[#b55234]">*</span><input className={inputClass} maxLength="120" placeholder="Contoh: Perbaikan sistem peminjaman ruang rapat" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="grid gap-2 text-sm font-semibold">Ceritakan saran Anda <span className="text-[#b55234]">*</span><textarea className={`${inputClass} min-h-48 resize-y py-3 leading-6`} maxLength="2000" placeholder="Jelaskan kondisi saat ini, usulan perbaikan, serta manfaat yang diharapkan." value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} /><span className="text-right text-xs font-normal text-[#6c8179]">{form.details.length}/2000 karakter</span></label></div></fieldset><div className="mt-9 grid gap-6 border-t border-[#e0e7e1] pt-8 lg:grid-cols-2"><div><p className="text-lg font-semibold">Lampiran pendukung</p><p className="mt-1 text-sm leading-6 text-[#587068]">Tambahkan PDF, Word, atau gambar hingga 5 MB bila membantu menjelaskan saran.</p><input accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" ref={fileInput} className="sr-only" id="attachment" type="file" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} /><label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#9eb9aa] bg-[#f3f8f3] px-4 py-4 text-sm font-medium text-[#315b50] transition hover:bg-[#e7f1e8]" htmlFor="attachment"><Icon name="file" className="h-5 w-5 shrink-0" />{attachment?.name || 'Pilih file pendukung'}</label></div><label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f5eff9] p-5"><input checked={form.anonymous} className="mt-0.5 h-5 w-5 accent-[#a40054]" type="checkbox" onChange={(event) => setForm({ ...form, anonymous: event.target.checked })} /><span><span className="block font-semibold text-[#371a55]">Kirim secara anonim</span><span className="mt-2 block text-sm leading-6 text-[#69577a]">Identitas tidak disimpan pada tiket. Simpan nomor tiket dan token pelacakan yang tampil setelah pengiriman.</span></span></label></div><div className="mt-9 flex flex-col-reverse gap-3 border-t border-[#e0e7e1] pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-xs leading-5 text-[#6c8179]">Dengan mengirim tiket, Anda menyetujui proses peninjauan sesuai kebijakan internal perusahaan.</p><div className="flex gap-3"><button className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#587068] hover:bg-[#edf3ee]" onClick={onBack} type="button">Batal</button><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0d1834] px-5 text-sm font-semibold text-white hover:bg-[#17346f] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#c96740] disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting} type="submit">{submitting ? 'Menyimpan...' : 'Kirim tiket'} <Icon name="arrow" className="h-4 w-4" /></button></div></div></form></section>;
}

function TicketInbox({ onBack, onCreate, selectedTicket, setSelectedTicket, tickets }) {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const [query, setQuery] = useState('');
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const anonymousCount = tickets.filter((item) => item.is_anonymous).length;
    const filteredTickets = tickets.filter((item) => {
        const haystack = `${item.ticket_number} ${item.title} ${item.category?.name ?? ''}`.toLowerCase();
        const submittedDate = item.submitted_at?.slice(0, 10) ?? '';
        const isWithinDateRange = (!dateFrom || submittedDate >= dateFrom) && (!dateTo || submittedDate <= dateTo);

        return isWithinDateRange && haystack.includes(query.trim().toLowerCase());
    });
    const ticket = filteredTickets.find((item) => item.id === selectedTicket) ?? filteredTickets[0];

    return <section className="ticket-inbox mx-auto max-w-7xl px-5 py-8 sm:px-10 sm:py-12">
        <BackButton onClick={onBack} />
        <div className="ticket-inbox-heading mt-10 flex flex-wrap items-end justify-between gap-5">
            <div>
                <p className="text-sm font-semibold tracking-[0.14em] text-[#b55234]">RIWAYAT SAYA</p>
                <h1 className="mt-3 font-serif text-4xl font-bold">Tiket &amp; respons</h1>
                <p className="mt-3 text-sm leading-6 text-[#587068]">{tickets.length} tiket tersimpan. Pilih tiket untuk membaca detail dan responsnya.</p>
            </div>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#183f37] px-4 text-sm font-semibold text-white hover:bg-[#315b50] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#c96740]" onClick={onCreate} type="button"><Icon name="plus" className="h-4 w-4" /> Buat tiket</button>
        </div>

        <div className="ticket-summary mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#d4ddd6] bg-[#fbfaf6] px-5 py-4"><p className="text-xs font-semibold text-[#6c8179]">Total tiket</p><p className="mt-1 font-serif text-3xl font-bold text-[#183f37]">{tickets.length}</p></div>
            <div className="rounded-2xl border border-[#ded3eb] bg-[#faf7fd] px-5 py-4"><p className="text-xs font-semibold text-[#69577a]">Dikirim anonim</p><p className="mt-1 font-serif text-3xl font-bold text-[#5a1240]">{anonymousCount}</p></div>
        </div>

        <div className="ticket-workspace mt-8 grid gap-5 lg:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <aside className="ticket-list-panel rounded-[1.75rem] border border-[#d4ddd6] bg-[#fbfaf6] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4"><h2 className="font-serif text-2xl font-bold">Daftar tiket</h2><span className="rounded-full bg-[#edf3ee] px-3 py-1 text-xs font-bold text-[#315b50]">{filteredTickets.length} tampil</span></div>
                <div className="ticket-filters mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Cari tiket<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal outline-none focus:border-[#183f37] focus:ring-3 focus:ring-[#c9ddd1]" onChange={(event) => setQuery(event.target.value)} placeholder="Nomor, judul, kategori" value={query} /></label>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Dari tanggal<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal outline-none focus:border-[#183f37] focus:ring-3 focus:ring-[#c9ddd1]" max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} /></label>
                    <label className="grid gap-1.5 text-xs font-semibold text-[#49665d]">Sampai tanggal<input className="min-h-11 rounded-xl border border-[#aebfb6] bg-white px-3 text-sm font-normal outline-none focus:border-[#183f37] focus:ring-3 focus:ring-[#c9ddd1]" min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} /></label>
                </div>
                <button className="mt-3 min-h-10 text-left text-xs font-semibold text-[#315b50] hover:text-[#183f37] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#c96740]" onClick={() => { setDateFrom(''); setDateTo(''); }} type="button">Tampilkan semua tanggal</button>
                <div className="ticket-list-scroll mt-5 grid max-h-[30rem] gap-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-20rem)]">
                    {filteredTickets.length === 0 ? <p className="rounded-xl border border-dashed border-[#b9c9bf] px-4 py-8 text-center text-sm leading-6 text-[#587068]">Tidak ada tiket yang sesuai dengan pencarian atau filter.</p> : filteredTickets.map((item) => <button aria-pressed={ticket?.id === item.id} className={`ticket-row w-full rounded-xl border p-4 text-left transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c96740] ${ticket?.id === item.id ? 'border-[#315b50] bg-[#edf3ee]' : 'border-[#e0e7e1] bg-white hover:border-[#9bb2a5] hover:bg-[#f7faf7]'}`} key={item.id} onClick={() => { setSelectedTicket(item.id); setMobileDetailOpen(true); }} type="button"><div className="flex items-start justify-between gap-3"><p className="text-[0.68rem] font-bold tracking-wide text-[#b55234]">{item.ticket_number}</p><span className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-bold ${item.is_anonymous ? 'bg-[#f5eff9] text-[#6b1742]' : 'bg-[#edf3ee] text-[#315b50]'}`}>{item.is_anonymous ? 'Anonim' : 'Tidak anonim'}</span></div><p className="mt-2 line-clamp-2 font-semibold text-[#183f37]">{item.title}</p><p className="mt-3 text-xs text-[#587068]">{item.category?.name}</p></button>)}
                </div>
            </aside>
            {ticket ? <article className={`ticket-detail-panel ${mobileDetailOpen ? 'mobile-detail-open' : 'mobile-detail-closed'} rounded-[1.75rem] border border-[#d4ddd6] bg-[#fbfaf6] p-6 sm:p-8 lg:sticky lg:top-6`}>
                <button className="mobile-back-to-list inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b50] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#c96740]" onClick={() => setMobileDetailOpen(false)} type="button"><Icon name="back" className="h-4 w-4" /> Kembali ke daftar</button>
                <div className="flex flex-wrap items-start justify-between gap-3"><p className="text-xs font-bold tracking-wide text-[#b55234]">{ticket.ticket_number}</p><span className={`rounded-full px-3 py-1 text-xs font-bold ${ticket.is_anonymous ? 'bg-[#f5eff9] text-[#6b1742]' : 'bg-[#edf3ee] text-[#315b50]'}`}>{ticket.is_anonymous ? 'Dikirim anonim' : 'Dikirim melalui akun'}</span></div>
                <h2 className="mt-3 font-serif text-3xl font-bold leading-tight">{ticket.title}</h2>
                <div className="mt-6 border-y border-[#e0e7e1] py-5"><p className="text-sm"><span className="block text-xs text-[#6c8179]">Kategori</span><span className="mt-1 block font-semibold">{ticket.category?.name}</span></p></div>
                <p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#49665d]">{ticket.details}</p>
                {ticket.attachments?.map((attachment) => <a className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#edf3ee] px-3 py-2 text-sm font-semibold text-[#315b50] hover:bg-[#dcebe1] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#c96740]" href={attachment.url_system} key={attachment.id} rel="noreferrer" target="_blank"><Icon name="file" className="h-4 w-4" />Buka {attachment.original_name}</a>)}
                <div className="mt-8 border-t border-[#e0e7e1] pt-6"><h3 className="font-semibold">Respons Management</h3>{ticket.messages?.length ? <div className="mt-3 grid gap-3">{ticket.messages.map((message) => <article className="rounded-xl border border-[#d4ddd6] bg-white p-4" key={message.id}><p className="text-xs font-bold text-[#315b50]">{message.sender?.first_name ?? 'Management'} {message.sender?.last_name ?? ''}</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#587068]">{message.body}</p></article>)}</div> : <p className="mt-3 text-sm leading-6 text-[#587068]">Belum ada respons dari Management.</p>}</div>
            </article> : <article className="rounded-[1.75rem] border border-dashed border-[#b9c9bf] bg-[#fbfaf6] px-6 py-16 text-center"><h2 className="font-serif text-2xl font-bold">Pilih tiket</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#587068]">Pilih satu tiket dari daftar untuk melihat detailnya.</p></article>}
        </div>
    </section>;
}

export default function EmployeePortal() {
    const [page, setPage] = useState('home');
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState('');
    const [form, setForm] = useState({ category: '', title: '', details: '', anonymous: false });
    const [categories, setCategories] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [claim, setClaim] = useState({ ticketNumber: '', trackingToken: '' });
    const [claiming, setClaiming] = useState(false);
    const [profile, setProfile] = useState({ name: '', email: '', department: '' });
    const fileInput = useRef(null);

    const moveTo = (nextPage) => {
        setPage(nextPage === 'new' ? 'form' : nextPage === 'tickets' ? 'ticket-inbox' : nextPage);
        setMessage('');
    };

    useEffect(() => {
        if (page === 'tickets') setPage('ticket-inbox');
    }, [page]);

    useEffect(() => {
        const headers = { Accept: 'application/json' };

        Promise.all([
            fetch('/suggestions/categories', { credentials: 'same-origin', headers }),
            fetch('/suggestions', { credentials: 'same-origin', headers }),
        ]).then(async ([categoryResponse, ticketResponse]) => {
            if (categoryResponse.ok) setCategories((await categoryResponse.json()).categories ?? []);
            if (ticketResponse.ok) {
                const items = (await ticketResponse.json()).suggestions ?? [];
                setTickets(items);
                setSelectedTicket(items[0]?.id ?? null);
            }
        });
    }, []);

    const submitTicket = async (event) => {
        event.preventDefault();
        if (!form.category || !form.title.trim() || !form.details.trim()) {
            setMessage('Lengkapi kategori, judul, dan isi saran terlebih dahulu.');
            return;
        }
        setSubmitting(true);
        setMessage('');
        const payload = new FormData();
        payload.append('category_id', form.category);
        payload.append('title', form.title.trim());
        payload.append('details', form.details.trim());
        payload.append('is_anonymous', form.anonymous ? '1' : '0');
        if (attachment) payload.append('attachment', attachment);

        try {
            const response = await fetch('/suggestions', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '' },
                body: payload,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(Object.values(data.errors ?? {}).flat().join(' ') || data.message || 'Saran tidak dapat disimpan.');

            const ticket = data.suggestion;
            setTickets((items) => [ticket, ...items]);
            setSelectedTicket(ticket.id);
            setForm({ category: '', title: '', details: '', anonymous: false });
            setAttachment(null);
            if (fileInput.current) fileInput.current.value = '';
            setPage('ticket-inbox');
            setMessage(`Tiket ${ticket.ticket_number} telah disimpan.${ticket.is_anonymous ? ` Simpan token pelacakan: ${data.tracking_token}` : ''}`);
        } catch (exception) {
            setMessage(exception.message);
        } finally {
            setSubmitting(false);
        }
    };

    const claimAnonymousTicket = async (event) => {
        event.preventDefault();
        setClaiming(true);
        setMessage('');

        try {
            const response = await fetch('/suggestions/claim-anonymous', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({ ticket_number: claim.ticketNumber.trim(), tracking_token: claim.trackingToken.trim() }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(Object.values(data.errors ?? {}).flat().join(' ') || data.message || 'Tiket anonim tidak dapat dihubungkan.');

            setTickets((items) => [data.suggestion, ...items]);
            setSelectedTicket(data.suggestion.id);
            setClaim({ ticketNumber: '', trackingToken: '' });
            setMessage(data.message);
        } catch (exception) {
            setMessage(exception.message);
        } finally {
            setClaiming(false);
        }
    };

    const ticket = tickets.find((item) => item.id === selectedTicket);
    const inputClass = 'min-h-12 rounded-xl border border-[#aebfb6] bg-white px-3 font-normal outline-none focus:border-[#183f37] focus:ring-3 focus:ring-[#c9ddd1]';

    return <main className="employee-portal min-h-screen bg-[#f5f1e8] text-[#183f37]">
        {page === 'home' && <section className="min-h-screen px-5 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-16"><div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20"><div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#183f37] font-serif text-xl font-bold text-white">S</span><span className="font-serif text-xl font-bold">Suara Karyawan</span></div><p className="mt-16 text-sm font-semibold tracking-[0.16em] text-[#b55234]">RUANG SARAN INTERNAL</p><h1 className="mt-5 max-w-xl font-serif text-5xl font-bold leading-[0.96] tracking-tight sm:text-6xl">Satu tempat untuk menyampaikan perbaikan.</h1><p className="mt-7 max-w-md text-base leading-8 text-[#587068]">Saran Anda masuk sebagai tiket agar HR dan PIC dapat memberi respons serta tindak lanjut yang jelas.</p><button className="mt-9 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b50] hover:text-[#183f37] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c96740]" onClick={() => moveTo('profile')} type="button"><Icon name="profile" className="h-4 w-4" /> Kelola profil karyawan</button></div><div className="grid gap-5"><button className="group relative min-h-64 overflow-hidden rounded-[2rem] bg-[#183f37] p-7 text-left text-white shadow-[0_18px_45px_rgba(24,63,55,0.18)] transition hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c96740] sm:p-9" onClick={() => moveTo('new')} type="button"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e6b49f] text-[#183f37]"><Icon name="plus" className="h-7 w-7" /></span><p className="mt-8 font-serif text-3xl font-bold">Kirim saran</p><p className="mt-3 max-w-sm text-sm leading-6 text-[#cfddd4]">Buat tiket untuk ide, kendala, atau usulan perubahan di tempat kerja.</p><span className="absolute bottom-8 inline-flex items-center gap-2 text-sm font-semibold text-[#f3c2aa]">Buat tiket baru <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></span><span aria-hidden="true" className="absolute -bottom-14 -right-9 h-40 w-40 rounded-full border-[1.5rem] border-[#e6b49f]/30" /></button><button className="group relative min-h-64 overflow-hidden rounded-[2rem] border border-[#d4ddd6] bg-[#fbfaf6] p-7 text-left shadow-[0_18px_45px_rgba(43,65,57,0.07)] transition hover:-translate-y-1 hover:border-[#9eb5a8] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c96740] sm:p-9" onClick={() => moveTo('tickets')} type="button"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#dcebe1] text-[#315b50]"><Icon name="ticket" className="h-7 w-7" /></span><p className="mt-8 font-serif text-3xl font-bold">Tiket &amp; respons</p><p className="mt-3 max-w-sm text-sm leading-6 text-[#587068]">Periksa status tiket dan jawaban dari HR atau PIC perusahaan.</p><span className="absolute bottom-8 inline-flex items-center gap-2 text-sm font-semibold text-[#315b50]">Lihat tiket saya <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></span><span aria-hidden="true" className="absolute -bottom-12 -right-8 h-32 w-32 rounded-full bg-[#e7eee8]" /></button></div></div></section>}

        {page === 'form' && <SuggestionSubmission attachment={attachment} categories={categories} fileInput={fileInput} form={form} inputClass={inputClass} message={message} onBack={() => moveTo('home')} onSubmit={submitTicket} setAttachment={setAttachment} setForm={setForm} submitting={submitting} />}

        {page === 'ticket-inbox' && <TicketInbox onBack={() => moveTo('home')} onCreate={() => moveTo('new')} selectedTicket={selectedTicket} setSelectedTicket={setSelectedTicket} tickets={tickets} />}

        {page === 'tickets' && <section className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-12"><BackButton onClick={() => moveTo('home')} /><div className="mt-12 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold tracking-[0.14em] text-[#b55234]">RIWAYAT SAYA</p><h1 className="mt-3 font-serif text-4xl font-bold">Tiket &amp; respons</h1></div><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#183f37] px-4 text-sm font-semibold text-white hover:bg-[#315b50]" onClick={() => moveTo('new')} type="button"><Icon name="plus" className="h-4 w-4" /> Buat tiket</button></div>{message && <p className="mt-6 rounded-xl border border-[#b7d2be] bg-[#edf7ef] px-4 py-3 text-sm text-[#255a37]">{message}</p>}{tickets.length === 0 ? <div className="mt-8 rounded-[2rem] border border-dashed border-[#b9c9bf] bg-[#fbfaf6] px-6 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#dcebe1] text-[#315b50]"><Icon name="ticket" /></span><h2 className="mt-5 font-serif text-2xl font-bold">Belum ada tiket</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#587068]">Tiket yang Anda buat akan muncul di sini bersama respons perusahaan.</p></div> : <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="space-y-3">{tickets.map((item) => <button className={`w-full rounded-2xl border p-5 text-left transition ${selectedTicket === item.id ? 'border-[#315b50] bg-[#edf3ee]' : 'border-[#d4ddd6] bg-[#fbfaf6] hover:border-[#9bb2a5]'}`} key={item.id} onClick={() => setSelectedTicket(item.id)} type="button"><p className="text-xs font-bold tracking-wide text-[#b55234]">{item.ticket_number}</p><p className="mt-2 font-semibold">{item.title}</p><p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-sm text-[#587068]"><span>{item.category?.name}</span><span aria-hidden="true">·</span><span className="font-semibold text-[#9b482c]">{item.status}</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.is_anonymous ? 'bg-[#f5eff9] text-[#6b1742]' : 'bg-[#edf3ee] text-[#315b50]'}`}>{item.is_anonymous ? 'Anonim' : 'Tidak anonim'}</span></p></button>)}</div>{ticket && <article className="rounded-[2rem] border border-[#d4ddd6] bg-[#fbfaf6] p-6 sm:p-8"><p className="text-xs font-bold tracking-wide text-[#b55234]">{ticket.ticket_number}</p><h2 className="mt-2 font-serif text-3xl font-bold">{ticket.title}</h2><div className="mt-6 grid gap-4 border-y border-[#e0e7e1] py-5 sm:grid-cols-2"><p className="text-sm"><span className="block text-xs text-[#6c8179]">Kategori</span><span className="mt-1 block font-semibold">{ticket.category?.name}</span></p><p className="text-sm"><span className="block text-xs text-[#6c8179]">Status pengiriman</span><span className="mt-1 block font-semibold">{ticket.is_anonymous ? 'Anonim' : 'Tidak anonim'}</span></p></div><p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#49665d]">{ticket.details}</p>{ticket.attachments?.[0] && <p className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#edf3ee] px-3 py-2 text-sm text-[#315b50]"><Icon name="file" className="h-4 w-4" />{ticket.attachments[0].original_name}</p>}<div className="mt-8 border-t border-[#e0e7e1] pt-6"><h3 className="font-semibold">Respons tiket</h3><p className="mt-3 text-sm leading-6 text-[#587068]">Tiket telah diterima dan akan ditinjau oleh tim yang bertanggung jawab.</p></div></article>}</div>}</section>}

        {page === 'profile' && <section className="mx-auto max-w-3xl px-5 py-8 sm:px-10 sm:py-12"><BackButton onClick={() => moveTo('home')} /><p className="mt-12 text-sm font-semibold tracking-[0.14em] text-[#b55234]">AKUN KARYAWAN</p><h1 className="mt-3 font-serif text-4xl font-bold">Profil Anda</h1><p className="mt-3 text-sm leading-7 text-[#587068]">Data ini dipakai pada tiket yang Anda kirim tanpa opsi anonim.</p><form className="mt-8 rounded-[2rem] border border-[#d4ddd6] bg-[#fbfaf6] p-6 shadow-[0_15px_35px_rgba(43,65,57,0.06)] sm:p-9" onSubmit={(event) => { event.preventDefault(); setMessage('Profil tersimpan untuk tampilan ini.'); }}><div className="grid gap-6 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold sm:col-span-2">Nama lengkap<input className={inputClass} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label className="grid gap-2 text-sm font-semibold">Email kerja<input className={inputClass} type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label><label className="grid gap-2 text-sm font-semibold">Departemen<input className={inputClass} value={profile.department} onChange={(event) => setProfile({ ...profile, department: event.target.value })} /></label></div>{message && <p className="mt-6 rounded-xl bg-[#edf7ef] px-4 py-3 text-sm text-[#255a37]">{message}</p>}<button className="mt-8 min-h-11 rounded-xl bg-[#183f37] px-5 text-sm font-semibold text-white hover:bg-[#315b50]" type="submit">Simpan profil</button></form></section>}
    </main>;
}
