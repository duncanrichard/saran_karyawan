import { useEffect, useState } from 'react';
import EmployeePortal from './EmployeePortal';

const initialRegistration = {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
};

const inputClassName = 'min-h-12 w-full rounded-xl border border-[#526b9f] bg-[#0b1123] px-3 font-normal text-white outline-none placeholder:text-[#8090ad] focus:border-[#ffe200] focus:ring-2 focus:ring-[#ffe200]/30';

function requestHeaders() {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
    };
}

function AuthLayout({ children, subtitle, title }) {
    return (
        <main className="min-h-screen bg-[#0b0d14] px-5 py-8 text-[#f7f7f2] sm:px-10 sm:py-12">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <section>
                    <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffe200] font-serif text-xl font-bold text-[#111421]">S</span>
                        <span className="font-serif text-xl font-bold">Suara Karyawan</span>
                    </div>
                    <p className="mt-16 text-xs font-bold tracking-[0.18em] text-[#ffe200]">RUANG SARAN INTERNAL</p>
                    <h1 className="mt-5 max-w-lg font-serif text-5xl font-bold leading-[0.96] sm:text-6xl">{title}</h1>
                    <p className="mt-6 max-w-md text-base leading-8 text-[#c9d1dd]">{subtitle}</p>
                </section>
                <section className="rounded-[2rem] border border-[#344875] bg-[#111a31] p-6 shadow-[0_24px_55px_rgba(0,0,0,0.28)] sm:p-9">
                    {children}
                </section>
            </div>
        </main>
    );
}

function ErrorMessage({ error }) {
    return error ? (
        <p className="mb-5 rounded-xl border border-[#a82b68] bg-[#360d29] px-4 py-3 text-sm leading-6 text-[#ffd4e8]">{error}</p>
    ) : null;
}

function SuccessMessage({ message }) {
    return message ? (
        <p className="mb-5 rounded-xl border border-[#4d9b67] bg-[#123b2a] px-4 py-3 text-sm leading-6 text-[#c9f3d4]">{message}</p>
    ) : null;
}

function PasswordField({ autoComplete, label, onChange, onToggle, value, visible }) {
    return (
        <label className="grid gap-2 text-sm font-semibold">
            {label}
            <span className="flex min-h-12 overflow-hidden rounded-xl border border-[#526b9f] bg-[#0b1123] focus-within:border-[#ffe200] focus-within:ring-2 focus-within:ring-[#ffe200]/30">
                <input
                    autoComplete={autoComplete}
                    className="min-w-0 flex-1 bg-transparent px-3 font-normal text-white outline-none placeholder:text-[#8090ad]"
                    onChange={onChange}
                    type={visible ? 'text' : 'password'}
                    value={value}
                />
                <button
                    aria-label={`${visible ? 'Sembunyikan' : 'Tampilkan'} ${label.toLowerCase()}`}
                    className="shrink-0 border-l border-[#526b9f] px-3 text-xs font-bold text-[#ffe200] hover:bg-[#26375f] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#ffe200]"
                    onClick={onToggle}
                    type="button"
                >
                    {visible ? 'Tutup' : 'Lihat'}
                </button>
            </span>
        </label>
    );
}

function PasswordRequirements({ password }) {
    const requirements = [
        { label: 'Minimal 12 karakter', met: password.length >= 12 },
        { label: 'Huruf besar dan huruf kecil', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
        { label: 'Setidaknya satu angka', met: /\d/.test(password) },
        { label: 'Setidaknya satu simbol, contoh: ! @ #', met: /[^A-Za-z0-9]/.test(password) },
    ];

    return (
        <section aria-label="Aturan password" className="rounded-xl border border-[#344875] bg-[#0b1123] px-4 py-3">
            <p className="text-xs font-bold tracking-[0.08em] text-[#c9d1dd]">PASSWORD YANG AMAN</p>
            <ul className="mt-2 grid gap-1.5 text-xs">
                {requirements.map((requirement) => (
                    <li className={`flex items-center gap-2 ${requirement.met ? 'text-[#8ce7a3]' : 'text-[#aebbd1]'}`} key={requirement.label}>
                        <span aria-hidden="true" className="inline-grid h-4 w-4 shrink-0 place-items-center">{requirement.met ? '✓' : '○'}</span>
                        {requirement.label}
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function AuthPortal() {
    const resetToken = window.location.pathname.match(/^\/reset-password\/([^/]+)$/)?.[1] ?? '';
    const [mode, setMode] = useState(resetToken ? 'reset' : 'login');
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [registration, setRegistration] = useState(initialRegistration);
    const [login, setLogin] = useState({ username: '', password: '', remember: false });
    const [verification, setVerification] = useState({ email: '', code: '' });
    const [forgotPassword, setForgotPassword] = useState({ email: '' });
    const [resetPassword, setResetPassword] = useState({ email: new URLSearchParams(window.location.search).get('email') ?? '', password: '', password_confirmation: '', token: decodeURIComponent(resetToken) });
    const [passwordVisibility, setPasswordVisibility] = useState({ login: false, registration: false, confirmation: false, reset: false, resetConfirmation: false });

    useEffect(() => {
        fetch('/auth/user', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (['management', 'super_admin'].includes(data?.user?.role)) {
                    window.location.replace('/management');
                    return;
                }
                setUser(data?.user ?? null);
            });
    }, []);

    const submit = async (url, payload, onSuccess) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: requestHeaders(),
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(Object.values(data.errors ?? {}).flat().join(' ') || data.message || 'Permintaan tidak dapat diproses.');
            }

            onSuccess(data);
        } catch (exception) {
            setError(exception.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setPasswordVisibility((current) => ({ ...current, [field]: !current[field] }));
    };

    const signOut = async () => {
        await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin', headers: requestHeaders() });
        setUser(null);
        setMode('login');
    };

    if (user) {
        return (
            <div className="employee-session relative">
                <button className="session-sign-out fixed right-4 top-3 z-20 inline-flex min-h-11 items-center rounded-xl border border-[#4d668f] bg-[#111a31] px-4 text-sm font-semibold text-[#f3c2aa] shadow-[0_8px_18px_rgba(13,24,52,0.22)] hover:bg-[#1c2b52] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#c96740]" onClick={signOut} type="button">
                    <span className="sm:hidden">Keluar</span><span className="hidden sm:inline">Sign out</span>
                </button>
                <EmployeePortal />
            </div>
        );
    }

    if (mode === 'register') {
        return (
            <AuthLayout title="Buat akun karyawan" subtitle="Daftarkan akun menggunakan email perusahaan. Kami akan mengirimkan kode OTP untuk memverifikasi email Anda.">
                <p className="text-xs font-bold tracking-[0.14em] text-[#ffe200]">DAFTAR AKUN</p>
                <h2 className="mt-3 font-serif text-3xl font-bold">Informasi akun</h2>
                <p className="mt-2 text-sm leading-6 text-[#c9d1dd]">Gunakan username yang akan dipakai saat masuk.</p>
                <ErrorMessage error={error} />
                <form className="mt-6 grid gap-4" onSubmit={(event) => {
                    event.preventDefault();
                    submit('/auth/register', registration, (data) => {
                        setSuccess('');
                        setVerification({ email: data.email, code: '' });
                        setMode('verify');
                    });
                }}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">Nama depan<input className={inputClassName} onChange={(event) => setRegistration({ ...registration, first_name: event.target.value })} value={registration.first_name} /></label>
                        <label className="grid gap-2 text-sm font-semibold">Nama belakang<input className={inputClassName} onChange={(event) => setRegistration({ ...registration, last_name: event.target.value })} value={registration.last_name} /></label>
                    </div>
                    <label className="grid gap-2 text-sm font-semibold">Email perusahaan<input className={inputClassName} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} type="email" value={registration.email} /></label>
                    <label className="grid gap-2 text-sm font-semibold">
                        Username
                        <input autoComplete="username" className={inputClassName} onChange={(event) => setRegistration({ ...registration, username: event.target.value })} pattern="[A-Za-z0-9_-]+" placeholder="contoh: richard_pratama" title="Gunakan huruf, angka, tanda hubung (-), atau garis bawah (_)." value={registration.username} />
                        <span className="text-xs font-normal leading-5 text-[#aebbd1]">Gunakan huruf, angka, tanda hubung (-), atau garis bawah (_). Jangan gunakan alamat email.</span>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <PasswordField autoComplete="new-password" label="Password" onChange={(event) => setRegistration({ ...registration, password: event.target.value })} onToggle={() => togglePasswordVisibility('registration')} value={registration.password} visible={passwordVisibility.registration} />
                        <PasswordField autoComplete="new-password" label="Konfirmasi password" onChange={(event) => setRegistration({ ...registration, password_confirmation: event.target.value })} onToggle={() => togglePasswordVisibility('confirmation')} value={registration.password_confirmation} visible={passwordVisibility.confirmation} />
                    </div>
                    <PasswordRequirements password={registration.password} />
                    <button className="mt-2 min-h-12 rounded-xl bg-[#ffe200] px-5 text-sm font-bold text-[#111421] hover:bg-[#fff06a] disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">
                        {loading ? 'Mengirim OTP...' : 'Daftar dan kirim OTP'}
                    </button>
                </form>
                <button className="mt-5 text-sm font-semibold text-[#ffe200] hover:text-white" onClick={() => { setError(''); setMode('login'); }} type="button">Sudah memiliki akun? Sign in</button>
            </AuthLayout>
        );
    }

    if (mode === 'forgot') {
        return (
            <AuthLayout title="Atur ulang password" subtitle="Masukkan email perusahaan yang terdaftar. Kami akan mengirimkan tautan aman untuk membuat password baru.">
                <p className="text-xs font-bold tracking-[0.14em] text-[#ffe200]">LUPA PASSWORD</p>
                <h2 className="mt-3 font-serif text-3xl font-bold">Kirim tautan reset</h2>
                <SuccessMessage message={success} />
                <ErrorMessage error={error} />
                <form className="mt-6 grid gap-5" onSubmit={(event) => { event.preventDefault(); submit('/auth/forgot-password', forgotPassword, (data) => setSuccess(data.message)); }}>
                    <label className="grid gap-2 text-sm font-semibold">Email perusahaan<input autoComplete="email" className={inputClassName} onChange={(event) => setForgotPassword({ email: event.target.value })} type="email" value={forgotPassword.email} /></label>
                    <button className="min-h-12 rounded-xl bg-[#ffe200] px-5 text-sm font-bold text-[#111421] hover:bg-[#fff06a] disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Mengirim tautan...' : 'Kirim tautan reset'}</button>
                </form>
                <button className="mt-5 text-sm font-semibold text-[#ffe200] hover:text-white" onClick={() => { setError(''); setSuccess(''); setMode('login'); }} type="button">Kembali ke Sign in</button>
            </AuthLayout>
        );
    }

    if (mode === 'reset') {
        return (
            <AuthLayout title="Buat password baru" subtitle="Gunakan password baru yang kuat agar akun Anda tetap terlindungi.">
                <p className="text-xs font-bold tracking-[0.14em] text-[#ffe200]">RESET PASSWORD</p>
                <h2 className="mt-3 font-serif text-3xl font-bold">Password baru</h2>
                <ErrorMessage error={error} />
                <form className="mt-6 grid gap-5" onSubmit={(event) => { event.preventDefault(); submit('/auth/reset-password', resetPassword, (data) => { setSuccess(data.message); setMode('login'); }); }}>
                    <label className="grid gap-2 text-sm font-semibold">Email perusahaan<input autoComplete="email" className={inputClassName} onChange={(event) => setResetPassword({ ...resetPassword, email: event.target.value })} type="email" value={resetPassword.email} /></label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <PasswordField autoComplete="new-password" label="Password baru" onChange={(event) => setResetPassword({ ...resetPassword, password: event.target.value })} onToggle={() => togglePasswordVisibility('reset')} value={resetPassword.password} visible={passwordVisibility.reset} />
                        <PasswordField autoComplete="new-password" label="Konfirmasi password baru" onChange={(event) => setResetPassword({ ...resetPassword, password_confirmation: event.target.value })} onToggle={() => togglePasswordVisibility('resetConfirmation')} value={resetPassword.password_confirmation} visible={passwordVisibility.resetConfirmation} />
                    </div>
                    <PasswordRequirements password={resetPassword.password} />
                    <button className="min-h-12 rounded-xl bg-[#ffe200] px-5 text-sm font-bold text-[#111421] hover:bg-[#fff06a] disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Memperbarui password...' : 'Simpan password baru'}</button>
                </form>
            </AuthLayout>
        );
    }

    if (mode === 'verify') {
        return (
            <AuthLayout title="Verifikasi email perusahaan" subtitle="Masukkan kode OTP enam digit yang dikirim ke email perusahaan Anda.">
                <p className="text-xs font-bold tracking-[0.14em] text-[#ffe200]">VERIFIKASI OTP</p>
                <h2 className="mt-3 font-serif text-3xl font-bold">Aktifkan akun</h2>
                <ErrorMessage error={error} />
                <form className="mt-6 grid gap-5" onSubmit={(event) => { event.preventDefault(); submit('/auth/verify-email', verification, (data) => { setSuccess(data.message); setMode('login'); }); }}>
                    <label className="grid gap-2 text-sm font-semibold">Email perusahaan<input className={inputClassName} onChange={(event) => setVerification({ ...verification, email: event.target.value })} type="email" value={verification.email} /></label>
                    <label className="grid gap-2 text-sm font-semibold">Kode OTP<input className={`${inputClassName} font-mono text-lg tracking-[0.35em]`} inputMode="numeric" maxLength="6" onChange={(event) => setVerification({ ...verification, code: event.target.value.replace(/\D/g, '') })} value={verification.code} /></label>
                    <button className="min-h-12 rounded-xl bg-[#ffe200] px-5 text-sm font-bold text-[#111421] hover:bg-[#fff06a] disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Memverifikasi...' : 'Verifikasi email'}</button>
                </form>
                <button className="mt-5 text-sm font-semibold text-[#ffe200] hover:text-white" onClick={() => { setError(''); setMode('login'); }} type="button">Kembali ke Sign in</button>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Sampaikan saran dengan aman." subtitle="Masuk menggunakan username dan password yang sudah diverifikasi melalui email perusahaan.">
            <p className="text-xs font-bold tracking-[0.14em] text-[#ffe200]">SIGN IN KARYAWAN</p>
            <h2 className="mt-3 font-serif text-3xl font-bold">Masuk ke akun Anda</h2>
            <SuccessMessage message={success} />
            <ErrorMessage error={error} />
            <form className="mt-7 grid gap-5" onSubmit={(event) => { event.preventDefault(); submit('/auth/login', login, (data) => { if (data.redirect_to) window.location.assign(data.redirect_to); else setUser(data.user); }); }}>
                <label className="grid gap-2 text-sm font-semibold">Username<input autoComplete="username" className={inputClassName} onChange={(event) => setLogin({ ...login, username: event.target.value })} value={login.username} /></label>
                <PasswordField autoComplete="current-password" label="Password" onChange={(event) => setLogin({ ...login, password: event.target.value })} onToggle={() => togglePasswordVisibility('login')} value={login.password} visible={passwordVisibility.login} />
                <button className="w-fit text-sm font-semibold text-[#ffe200] hover:text-white" onClick={() => { setError(''); setSuccess(''); setMode('forgot'); }} type="button">Lupa password?</button>
                <button className="min-h-12 rounded-xl bg-[#ffe200] px-5 text-sm font-bold text-[#111421] hover:bg-[#fff06a] disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Memeriksa akun...' : 'Sign in'}</button>
            </form>
            <div className="mt-6 border-t border-[#344875] pt-5">
                <p className="text-sm text-[#c9d1dd]">Belum memiliki akun?</p>
                <button className="mt-2 text-sm font-semibold text-[#ffe200] hover:text-white" onClick={() => { setError(''); setMode('register'); }} type="button">Daftar sebagai karyawan</button>
                <a className="mt-3 block text-sm font-semibold text-[#f3c2aa] hover:text-white" href="/management/login">Masuk sebagai Management</a>
            </div>
        </AuthLayout>
    );
}
