from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Flowable
from reportlab.pdfbase.pdfmetrics import stringWidth

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf' / 'Blueprint-PRD-ERD-Sistem-Saran-Karyawan.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor('#0D1834')
GREEN = colors.HexColor('#183F37')
TEAL = colors.HexColor('#315B50')
SAGE = colors.HexColor('#EAF3EC')
CREAM = colors.HexColor('#F5F1E8')
ORANGE = colors.HexColor('#C96740')
YELLOW = colors.HexColor('#FFE200')
PURPLE = colors.HexColor('#F2ECFA')
PINK = colors.HexColor('#FFF1F7')
LINE = colors.HexColor('#D4DDD6')
MUTED = colors.HexColor('#587068')
RED = colors.HexColor('#B85450')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='DocTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=29, leading=34, textColor=colors.white, spaceAfter=11))
styles.add(ParagraphStyle(name='Kicker', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=ORANGE, spaceAfter=5))
styles.add(ParagraphStyle(name='H1x', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=23, textColor=NAVY, spaceBefore=4, spaceAfter=10))
styles.add(ParagraphStyle(name='H2x', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=GREEN, spaceBefore=8, spaceAfter=6))
styles.add(ParagraphStyle(name='Bodyx', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.6, leading=13, textColor=colors.HexColor('#263B35'), spaceAfter=6))
styles.add(ParagraphStyle(name='Small', parent=styles['BodyText'], fontName='Helvetica', fontSize=7.2, leading=9.2, textColor=colors.HexColor('#263B35')))
styles.add(ParagraphStyle(name='Tiny', parent=styles['BodyText'], fontName='Helvetica', fontSize=6.35, leading=7.8, textColor=colors.HexColor('#263B35')))
styles.add(ParagraphStyle(name='TableHead', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=7, leading=8.3, textColor=colors.white, alignment=TA_LEFT))
styles.add(ParagraphStyle(name='CoverMeta', parent=styles['BodyText'], fontName='Helvetica', fontSize=9, leading=15, textColor=colors.HexColor('#CDD6E9')))
styles.add(ParagraphStyle(name='WhiteBody', parent=styles['BodyText'], fontName='Helvetica', fontSize=10, leading=15, textColor=colors.white))

def p(text, style='Bodyx'):
    return Paragraph(text, styles[style])

def table(headers, rows, widths, small=False):
    st = 'Tiny' if small else 'Small'
    data = [[p(h, 'TableHead') for h in headers]] + [[p(str(x), st) for x in row] for row in rows]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY), ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('VALIGN', (0,0), (-1,-1), 'TOP'), ('GRID', (0,0), (-1,-1), 0.35, LINE),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAF8')]),
        ('LEFTPADDING', (0,0), (-1,-1), 5), ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    return t

def section(kicker, title, intro=None):
    out = [p(kicker.upper(), 'Kicker'), p(title, 'H1x')]
    if intro: out += [p(intro)]
    return out

class ProcessFlow(Flowable):
    def __init__(self): super().__init__(); self.width=17.1*cm; self.height=11.7*cm
    def draw(self):
        c=self.canv; x0=7; y=222; w=70; h=42; gap=11
        nodes=[('Karyawan\nKirim saran', SAGE), ('Validasi\nHR', colors.HexColor('#EEF4FB')), ('Triage &\nPrioritas', PURPLE), ('Tugaskan\nPIC', colors.HexColor('#FFF3DF')), ('Evaluasi &\nTindak lanjut', SAGE), ('Respons &\nPenutupan', colors.HexColor('#EEF4FB'))]
        for i,(label,bg) in enumerate(nodes):
            x=x0+i*(w+gap); c.setFillColor(bg); c.setStrokeColor(TEAL); c.roundRect(x,y,w,h,8,fill=1,stroke=1)
            c.setFillColor(NAVY); c.setFont('Helvetica-Bold',7.3)
            for j,line in enumerate(label.split('\n')): c.drawCentredString(x+w/2,y+25-j*10,line)
            if i<len(nodes)-1:
                c.setStrokeColor(TEAL); c.line(x+w,y+h/2,x+w+gap-5,y+h/2); c.line(x+w+gap-5,y+h/2,x+w+gap-10,y+h/2+3); c.line(x+w+gap-5,y+h/2,x+w+gap-10,y+h/2-3)
        c.setFillColor(ORANGE); c.setFont('Helvetica-Bold',8); c.drawString(12,320,'Alur utama: saran terlacak dari pengiriman sampai keputusan dan umpan balik.')
        decisions=[('Valid?', 82, 'Tidak: ditolak/diarsipkan dengan alasan'), ('Butuh klarifikasi?', 245, 'Ya: percakapan tiket, lalu evaluasi ulang'), ('Disetujui?', 410, 'Tidak: tidak dilanjutkan, alasan tercatat')]
        for label,x,note in decisions:
            yy=140; size=40; c.setFillColor(colors.HexColor('#FFF3DF')); c.setStrokeColor(ORANGE); c.saveState(); c.translate(x,yy); c.rotate(45); c.rect(-size/2,-size/2,size,size,fill=1,stroke=1); c.restoreState()
            c.setFillColor(NAVY); c.setFont('Helvetica-Bold',6.5); c.drawCentredString(x,yy+2,label)
            c.setFillColor(MUTED); c.setFont('Helvetica',6.5); c.drawCentredString(x,98,note)
        c.setStrokeColor(MUTED); c.setDash(2,2); c.line(7,75,480,75); c.setDash()
        c.setFillColor(MUTED); c.setFont('Helvetica',7); c.drawString(12,58,'Keluaran terukur: tiket, status, PIC, catatan evaluasi, bukti tindak lanjut, dan notifikasi.')

class ERD(Flowable):
    def __init__(self): super().__init__(); self.width=17.2*cm; self.height=15.7*cm
    def box(self,c,x,y,w,h,title,fields,color):
        c.setFillColor(color); c.setStrokeColor(TEAL); c.roundRect(x,y,w,h,5,fill=1,stroke=1)
        c.setFillColor(NAVY); c.setFont('Helvetica-Bold',7.2); c.drawString(x+6,y+h-12,title)
        c.setStrokeColor(TEAL); c.line(x+5,y+h-17,x+w-5,y+h-17)
        c.setFillColor(colors.HexColor('#263B35')); c.setFont('Helvetica',5.8)
        for i,f in enumerate(fields): c.drawString(x+6,y+h-28-i*8,f)
    def rel(self,c,x1,y1,x2,y2):
        c.setStrokeColor(colors.HexColor('#728A82')); c.setLineWidth(.65); c.line(x1,y1,x2,y2); c.circle(x1,y1,1.2,fill=1,stroke=0); c.setLineWidth(1)
    def draw(self):
        c=self.canv
        self.box(c,10,350,118,78,'departments',['PK id','UK code, name','is_active'],colors.HexColor('#E8F0F8'))
        self.box(c,155,350,125,94,'users',['PK id','FK department_id','name, username','UK email','is_active'],colors.HexColor('#E8F0F8'))
        self.box(c,307,355,120,74,'roles',['PK id','UK name','description'],PURPLE)
        self.box(c,455,355,130,80,'user_roles',['PK id','FK user_id','FK role_id','UK user_id + role_id'],PURPLE)
        self.box(c,10,205,130,78,'suggestion_categories',['PK id','UK name','description','is_active'],colors.HexColor('#FFF3D4'))
        self.box(c,180,165,165,150,'suggestions (tiket)',['PK id, UK ticket_number','FK category_id','FK submitted_by (nullable)','FK department_id (nullable)','title, details, is_anonymous','tracking_token, status, priority','submitted_at, closed_at'],SAGE)
        self.box(c,385,235,130,75,'attachments',['PK id','FK suggestion_id','name, path, mime, size'],colors.HexColor('#FFF3D4'))
        self.box(c,385,135,135,92,'assignments',['PK id','FK suggestion_id','FK assignee_id','FK assigned_by','assigned_at, completed_at'],colors.HexColor('#EEF4FB'))
        self.box(c,545,235,135,90,'messages',['PK id','FK suggestion_id','FK sender_id','body, sender_type','is_internal, read_at'],PINK)
        self.box(c,545,125,135,82,'status_histories',['PK id','FK suggestion_id','FK changed_by','from_status, to_status','note'],PURPLE)
        self.box(c,385,35,135,72,'notifications',['PK id','FK user_id','FK suggestion_id','type, title, read_at'],colors.HexColor('#FFF3D4'))
        for a in [(128,389,155,397),(280,398,307,392),(427,392,455,395),(140,244,180,238),(280,350,262,315),(263,350,263,315),(345,255,385,272),(345,205,385,181),(345,260,545,280),(345,190,545,166),(280,350,452,227),(280,350,452,107)]: self.rel(c,*a)
        c.setFillColor(MUTED); c.setFont('Helvetica',6.6); c.drawString(10,12,'Relasi utama 1:N. Tabel rekomendasi: audit_logs, suggestion_votes, suggestion_implementations, notification_preferences.')

def footer(canvas, doc):
    canvas.saveState(); w,h=A4
    canvas.setStrokeColor(LINE); canvas.line(1.6*cm,1.2*cm,w-1.6*cm,1.2*cm)
    canvas.setFillColor(MUTED); canvas.setFont('Helvetica',7)
    canvas.drawString(1.6*cm,.78*cm,'Blueprint - Sistem Saran Karyawan | Dokumen rancangan internal')
    canvas.drawRightString(w-1.6*cm,.78*cm,f'Hal. {doc.page}')
    canvas.restoreState()

story=[]
# Cover
story += [Spacer(1,2.3*cm), Table([[p('BLUEPRINT PRODUK | PRD | ERD', 'Kicker')],[p('Sistem Saran\nKaryawan', 'DocTitle')],[p('Rancangan yang disesuaikan dengan aplikasi Laravel yang telah tersedia: autentikasi, tiket saran, opsi anonim, kategori, lampiran, penugasan, percakapan, histori status, dan notifikasi.', 'WhiteBody')],[Spacer(1,.5*cm)],[p('<b>Kode dokumen</b> DOC-BLP-SK-001<br/><b>Versi</b> 1.0<br/><b>Tanggal</b> 10 November 2026<br/><b>Status</b> Rancangan rekomendasi implementasi<br/><b>Audiens</b> Manajemen, HR, PIC Departemen, IT, QA', 'CoverMeta')]], colWidths=[17.3*cm], rowHeights=[.7*cm,2.3*cm,2.0*cm,.3*cm,2.5*cm], style=TableStyle([('BACKGROUND',(0,0),(-1,-1),NAVY),('LEFTPADDING',(0,0),(-1,-1),24),('RIGHTPADDING',(0,0),(-1,-1),24),('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),12)])), Spacer(1,1.1*cm), p('Tujuan dokumen ini adalah memberi acuan tunggal untuk pengembangan, pengujian, dan pengambilan keputusan sistem saran karyawan. Angka target dan SLA bersifat usulan awal yang perlu disetujui pemilik bisnis.', 'Bodyx'), PageBreak()]

story += section('01 - Ringkasan eksekutif','Saran yang didengar, ditelusuri, dan ditindaklanjuti','Sistem Saran Karyawan adalah kanal internal untuk menerima ide, keluhan, dan usulan perbaikan secara terstruktur. Setiap masukan menjadi tiket dengan status, pemilik tindak lanjut, riwayat keputusan, serta respons yang dapat dipantau oleh pengirim.')
story += [p('<b>Kondisi yang sudah tersedia di kode:</b> registrasi dan login karyawan, verifikasi email OTP, reset password, portal formulir saran, kategori, lampiran, pilihan anonim, tiket, peran, penugasan PIC, pesan, riwayat status, dan notifikasi.'), p('<b>Arah rekomendasi:</b> hubungkan portal saat ini ke backend tiket, tambahkan triage HR yang jelas, SLA, audit trail, pengaturan privasi anonim, pelaporan manajemen, serta bukti implementasi agar saran tidak berhenti pada status.'), Spacer(1,6), table(['Masalah','Dampak','Solusi rancangan'],[['Saran masuk lewat kanal berbeda','Sulit ditelusuri dan rawan hilang','Tiket tunggal dengan nomor, status, dan histori'],['Pengirim tidak tahu progres','Kepercayaan dan partisipasi rendah','Notifikasi dan halaman pelacakan aman'],['PIC dan keputusan tidak konsisten','Tindak lanjut terlambat','Triage, penugasan, SLA, dan eskalasi'],['Anonimitas belum terstandardisasi','Risiko privasi atau penyalahgunaan','Token pelacakan, pembatasan akses, dan audit'],['Manajemen tidak mendapat pola masalah','Perbaikan reaktif','Dashboard tren kategori, SLA, dan hasil implementasi']], [3.3*cm,4.0*cm,9.0*cm])]
story.append(PageBreak())

story += section('02 - Tujuan dan ruang lingkup','Tujuan produk dan indikator awal','Target perlu dikalibrasi setelah baseline 1-2 bulan. Tidak ada angka di bawah ini yang menyatakan kondisi aktual perusahaan.')
story += [table(['Tujuan','Metrik','Target usulan 6 bulan','Sumber data'],[['Transparansi proses','Tiket memiliki status dan histori','100% tiket','suggestions + status histories'],['Respons awal','Median waktu dari masuk ke triage','<= 2 hari kerja','timestamp status'],['Kejelasan kepemilikan','Tiket valid memiliki PIC atau alasan penolakan','>= 95%','assignments'],['Penyelesaian','Tiket diselesaikan sesuai target','>= 75%','closed_at / due_at rekomendasi'],['Kualitas umpan balik','Tiket selesai memiliki respons akhir','100%','messages / closure note'],['Adopsi','Karyawan aktif yang memakai kanal','ditetapkan setelah baseline','analytics']], [3.3*cm,4.1*cm,4.3*cm,4.6*cm]), Spacer(1,8), p('<b>Termasuk rilis inti:</b> autentikasi, pengiriman saran teridentifikasi atau anonim, lampiran, triage, prioritas, penugasan, percakapan, status, notifikasi, pelacakan, administrasi kategori/role, dan pelaporan dasar.'), p('<b>Di luar ruang lingkup awal:</b> aplikasi mobile native, sistem manajemen proyek penuh, integrasi HRIS/SSO, integrasi WhatsApp/Teams, voting publik, dan penilaian AI otomatis. Seluruhnya dapat menjadi fase lanjutan setelah proses dasar stabil.')]
story.append(PageBreak())

story += section('03 - Aktor dan hak akses','Peran kerja yang dapat dipertanggungjawabkan','Hak akses dibatasi di server melalui policy dan query, bukan hanya penyembunyian menu.')
story += [table(['Aksi','Karyawan','HR/Triage','PIC','Manajer','Admin'],[['Kirim dan pantau tiket sendiri','Ya','Ya','Ya','Ya','Ya'],['Kirim anonim','Ya','-','-','-','-'],['Buka identitas pengirim anonim','Tidak','Tidak*','Tidak','Tidak','Tidak'],['Validasi, klasifikasi, prioritas','Tidak','Ya','Tidak','Lihat','Ya'],['Menetapkan PIC','Tidak','Ya','Tidak','Lihat','Ya'],['Berikan respons eksternal','Tanggapi tiket sendiri','Ya','Ya','Lihat','Ya'],['Catatan internal','Tidak','Ya','Ya','Lihat sesuai kewenangan','Ya'],['Ubah status penyelesaian','Tidak','Ya','Ya bila ditugaskan','Lihat','Ya'],['Kelola kategori, role, SLA','Tidak','Tidak','Tidak','Tidak','Ya'],['Lihat dashboard lintas departemen','Milik sendiri','Operasional','Milik sendiri','Ya','Ya']], [3.9*cm,2.35*cm,2.35*cm,2.35*cm,2.35*cm,2.35*cm], small=True), Spacer(1,7), p('* Untuk saran anonim, identitas tidak disimpan pada tiket. Token pelacakan dipakai untuk membuka percakapan/pembaruan tanpa mengungkapkan identitas. Jika kebijakan bisnis membutuhkan pelaporan pelanggaran, buat jalur khusus dengan otorisasi dan audit yang terpisah.')]
story.append(PageBreak())

story += section('04 - Proses bisnis','Alur operasional tiket saran','Setiap cabang menghasilkan alasan yang dapat dibaca karyawan atau catatan internal sesuai hak akses.')
story += [ProcessFlow(), Spacer(1,4), table(['Tahap','Pemilik','Output wajib','SLA usulan'],[['1. Pengiriman','Karyawan','Tiket, kategori, detail, opsi anonim','langsung'],['2. Validasi','HR','hasil validasi dan alasan bila ditolak','2 hari kerja'],['3. Triage','HR','prioritas, departemen tujuan, rute','1 hari kerja'],['4. Evaluasi','PIC','penilaian manfaat, biaya, risiko, klarifikasi','5 hari kerja'],['5. Keputusan','HR + PIC','dilanjutkan/tidak, alasan, target tindakan','2 hari kerja setelah evaluasi'],['6. Tindak lanjut','PIC','catatan aksi dan bukti','sesuai target tiket'],['7. Penutupan','HR/PIC','respons akhir dan survei opsional','1 hari kerja']], [2.2*cm,2.4*cm,7.6*cm,4.3*cm])]
story.append(PageBreak())

story += section('05 - Siklus hidup tiket','Status yang sederhana dan dapat diaudit','Status yang direkomendasikan menggantikan penggunaan teks bebas agar dashboard dan SLA konsisten.')
story += [table(['Status','Arti','Transisi yang diizinkan','Aktor'],[['Baru','Tiket berhasil dibuat','Ditinjau, Ditolak','Sistem/HR'],['Ditinjau','HR memeriksa kelengkapan dan relevansi','Perlu Klarifikasi, Ditugaskan, Ditolak','HR'],['Perlu Klarifikasi','Menunggu jawaban pengirim','Ditinjau, Ditolak','HR/PIC'],['Ditugaskan','PIC telah ditentukan','Dalam Evaluasi, Ditolak','HR/PIC'],['Dalam Evaluasi','PIC menilai atau menyusun tindakan','Diproses, Tidak Dilanjutkan, Perlu Klarifikasi','PIC'],['Diproses','Keputusan disetujui dan tindakan berjalan','Selesai, Tidak Dilanjutkan','PIC'],['Selesai','Tindakan/respons akhir tercatat','Dibuka Kembali (terbatas)','HR/PIC'],['Ditolak / Tidak Dilanjutkan','Tiket ditutup dengan alasan','Dibuka Kembali (otorisasi)','HR/Admin']], [3.0*cm,4.4*cm,6.3*cm,3.0*cm], small=True), Spacer(1,8), p('<b>Aturan status:</b> setiap perubahan membuat baris <i>suggestion_status_histories</i>; status terminal wajib memiliki alasan; tiket tidak dapat dihapus permanen dari antarmuka operasional; pembukaan kembali memiliki catatan penyebab dan auditor.')]
story.append(PageBreak())

story += section('06 - Kebutuhan fungsional','Matriks modul dan rilis','R1 berfokus pada pengoperasian tiket dari ujung ke ujung. R2 memperkuat kendali dan insight, bukan memperluas fungsi sebelum proses inti terbukti berjalan.')
story += [table(['ID','Modul / kebutuhan','Prioritas','Rilis'],[['F-01','Registrasi, OTP, login, reset password','P0','R1 - tersedia'],['F-02','Buat tiket, kategori, detail, lampiran, anonim','P0','R1 - UI tersedia; sambungkan backend'],['F-03','Triage, prioritas, departemen tujuan, penugasan PIC','P0','R1'],['F-04','Percakapan pengirim - HR/PIC dan catatan internal','P0','R1'],['F-05','Status terkontrol, histori, alasan penolakan/penutupan','P0','R1'],['F-06','Notifikasi in-app/email dan preferensi','P1','R1/R2'],['F-07','Pelacakan anonim dengan token aman','P0','R1'],['F-08','Dashboard operasional dan ekspor rekap','P1','R2'],['F-09','SLA, pengingat, eskalasi manajer','P1','R2'],['F-10','Voting/duplikasi dan knowledge base solusi','P2','R3'],['F-11','SSO/HRIS/chat perusahaan','P2','R3']], [1.1*cm,10.3*cm,2.3*cm,3.0*cm], small=True)]
story.append(PageBreak())

story += section('07 - Blueprint data','Data yang sudah ada dan rekomendasi penguatan','Skema aktual sudah baik untuk inti tiket. Rekomendasi berikut menutup kebutuhan SLA, audit, implementasi, dan analitik.')
story += [table(['Entitas','Status','Fungsi / rekomendasi'],[['departments, users','Ada','Karyawan dan unit organisasi. Tambahkan job_title bila butuh routing berbasis jabatan.'],['roles, user_roles','Ada','RBAC many-to-many. Seed role: employee, hr, pic, manager, admin.'],['suggestion_categories','Ada','Klasifikasi. Tambahkan target_department_id dan sla_days bila routing/SLA per kategori diperlukan.'],['suggestions','Ada','Tiket inti. Tambahkan due_at, reviewed_at, decision_at, closure_reason, impact_score, duplicate_of_id.'],['suggestion_attachments','Ada','Metadata lampiran. Tambahkan uploaded_by jika perlu jejak pengunggah.'],['suggestion_assignments','Ada','Riwayat PIC. Tambahkan assignment_note dan active unique constraint per tiket.'],['suggestion_messages','Ada','Pesan eksternal/internal. Tambahkan attachment support hanya jika diperlukan.'],['suggestion_status_histories','Ada','Audit transisi. Tambahkan event_source bila ada sistem/scheduler.'],['notifications','Ada','Notifikasi in-app. Gunakan queue dan link/action payload.'],['audit_logs','Rekomendasi R2','Aktor, aksi, objek, perubahan, IP/user agent untuk audit.'],['suggestion_implementations','Rekomendasi R2','Rencana aksi, hasil, bukti, nilai manfaat, implementer.'],['notification_preferences','Rekomendasi R2','Preferensi kanal dan jenis notifikasi per pengguna.']], [3.5*cm,2.6*cm,10.6*cm], small=True)]
story.append(PageBreak())

story += section('08 - ERD inti','Relasi database Sistem Saran Karyawan','Diagram menampilkan tabel saat ini; tabel rekomendasi dicatat sebagai perluasan fase berikutnya.')
story += [ERD(), PageBreak()]

story += section('09 - Kamus data','Tabel inti: suggestions dan relasi pendukung','Gunakan UUID sesuai implementasi Laravel saat ini. FK dan indeks harus mengutamakan halaman dashboard, filter, dan pelacakan tiket.')
story += [table(['Tabel / kolom','Tipe','Aturan data'],[['suggestions.id','uuid','PK'],['suggestions.ticket_number','varchar','unik, ditampilkan ke pengguna'],['suggestions.category_id','uuid','FK - restrict delete'],['suggestions.submitted_by','uuid nullable','null bila anonim'],['suggestions.department_id','uuid nullable','departemen yang relevan, bukan wajib departemen pengirim'],['suggestions.is_anonymous','boolean','default false'],['suggestions.tracking_token','varchar nullable','unik; hash/token aman untuk tiket anonim'],['suggestions.status','varchar / enum aplikasi','nilai dari state machine'],['suggestions.priority','varchar nullable','low, normal, high, critical - ditetapkan HR'],['suggestions.due_at','timestamp nullable','rekomendasi untuk SLA'],['suggestion_messages.is_internal','boolean','tidak boleh terlihat pengirim'],['suggestion_assignments.is_active','boolean','satu PIC aktif per tiket bila kebijakan demikian'],['suggestion_status_histories','append-only','tidak diubah setelah dicatat']], [5.5*cm,3.2*cm,8.0*cm]), Spacer(1,8), p('<b>Indeks yang disarankan:</b> suggestions(status, department_id), suggestions(category_id, submitted_at), suggestions(assignee status melalui assignment aktif), suggestions(due_at, status), messages(suggestion_id, created_at), histories(suggestion_id, created_at). Pastikan indeks unik untuk ticket_number, tracking_token, dan (user_id, role_id).')]
story.append(PageBreak())

story += section('10 - Aturan bisnis dan privasi','Kontrol yang menjaga kepercayaan karyawan','Aturan berikut menjadi acuan FormRequest, policy, service layer, dan pengujian.')
rules=[['BR-01','Setiap pengiriman sukses memperoleh ticket_number; tiket baru berstatus Baru dan menulis histori awal.'],['BR-02','Pengirim anonim tidak disimpan pada submitted_by. Sistem menampilkan dan mengirimkan token pelacakan satu kali.'],['BR-03','Pesan is_internal hanya terbuka untuk HR/PIC/Admin yang diberi hak pada tiket.'],['BR-04','Status tidak boleh diubah bebas. Setiap transisi divalidasi dan ditulis ke status history.'],['BR-05','Tiket Ditolak atau Tidak Dilanjutkan wajib memiliki alasan yang dapat ditampilkan kepada pengirim.'],['BR-06','Penugasan PIC memiliki riwayat. Hanya penugasan aktif yang digunakan untuk tugas dan notifikasi.'],['BR-07','Lampiran divalidasi MIME type, ukuran, dan disimpan di storage non-public dengan URL sementara.'],['BR-08','Akses pengirim teridentifikasi hanya untuk tiket yang dibuatnya; akses token anonim hanya untuk satu tiket terkait.'],['BR-09','Admin/HR dapat melihat dashboard sesuai kewenangan; manajer melihat data agregat atau departemennya.'],['BR-10','Penghapusan tiket menggunakan soft delete dan tidak menghapus audit trail. Retensi disesuaikan kebijakan perusahaan.'],['BR-11','Job notifikasi harus idempoten agar event status tidak menghasilkan pemberitahuan ganda.'],['BR-12','AI atau analisis otomatis, bila ditambahkan, hanya memberi rekomendasi; keputusan dan respons akhir tetap oleh manusia.']]
story += [table(['ID','Aturan'], rules, [1.5*cm,15.2*cm], small=True)]
story.append(PageBreak())

story += section('11 - Notifikasi, SLA, dan eskalasi','Komunikasi yang memberi kepastian tanpa spam','Gunakan queue agar pengiriman email tidak menghambat pembuatan atau perubahan tiket.')
story += [table(['Peristiwa','Penerima','Kanal','Syarat'],[['Tiket dibuat','Pengirim / token anonim','In-app atau email bila tersedia','Berisi nomor tiket, bukan detail sensitif'],['Tiket ditinjau / perlu klarifikasi','Pengirim','In-app/email','Pesan eksternal saja'],['PIC ditugaskan','PIC','In-app/email','Penugasan aktif'],['Status atau respons berubah','Pengirim + PIC','In-app/email','Tidak mengirim catatan internal'],['SLA mendekati / terlambat','PIC, HR, manajer sesuai aturan','In-app/email','Tiket non-terminal dengan due_at'],['Tiket selesai / ditutup','Pengirim','In-app/email','Sertakan ringkasan hasil dan alasan'],['Rekap periodik','HR/manajer/admin','Email / dashboard','Data teragregasi sesuai akses']], [4.0*cm,3.4*cm,3.3*cm,6.0*cm]), Spacer(1,8), p('<b>Rekomendasi SLA:</b> gunakan kalender kerja perusahaan; hitung due_at saat triage berdasarkan prioritas/kategori; pause SLA saat status Perlu Klarifikasi; tampilkan alasan eskalasi dan jangan mengubah status otomatis menjadi Selesai.')]
story.append(PageBreak())

story += section('12 - Arsitektur dan pengamanan','Rancangan teknis yang cocok dengan repositori saat ini','Sistem dapat tetap monolit Laravel + React/Vite selama volume masih moderat. Queue dan scheduler dipisahkan sebagai worker ketika notifikasi/SLA mulai aktif.')
story += [table(['Lapisan','Kondisi / rekomendasi','Tujuan'],[['Frontend','React 19 + Vite + Tailwind yang sudah ada','Portal karyawan; tambah halaman tiket nyata, pelacakan, dan feedback.'],['Backend','Laravel 13, controller/service/policy/FormRequest','API tiket, RBAC, state machine, validasi.'],['Database','SQLite lokal saat ini; MySQL/PostgreSQL untuk produksi','Integritas FK, indeks, backup, operasional multi-user.'],['Storage','Laravel filesystem - private disk atau S3-compatible','Lampiran dengan akses sementara dan audit.'],['Asinkron','Laravel Queue + Scheduler','Email, notifikasi, pengingat SLA, pembersihan token.'],['Observabilitas','Laravel log, failed jobs, audit_logs','Investigasi insiden dan bukti proses.'],['Keamanan','HTTPS, session secure, password hash, rate limit, policy','Lindungi data karyawan dan mencegah akses lintas tiket.']], [3.0*cm,7.1*cm,6.6*cm]), Spacer(1,8), p('<b>Catatan implementasi penting:</b> portal React yang ada masih menyimpan tiket di state browser. Langkah R1 adalah mengganti fungsi submit dan riwayat tiket dengan endpoint Laravel yang terautentikasi, serta menyimpan lampiran melalui API/storage.')]
story.append(PageBreak())

story += section('13 - Rencana implementasi','Tahapan pengembangan dan UAT','Urutan ini memanfaatkan fondasi yang sudah ada dan menghindari dashboard yang mengandalkan data simulasi.')
story += [table(['Fase','Cakupan','Keluaran / kriteria'],[['0 - Penyelarasan','Kebijakan anonim, daftar kategori, role, SLA, template respons','Keputusan bisnis dan master data disetujui'],['1 - Tiket end-to-end','API ticket, upload, list/detail, policy, triage HR, PIC, histori','Karyawan membuat tiket nyata dan melacak statusnya'],['2 - Operasional','Pesan, notifikasi queue, due_at, pengingat, admin kategori/role','HR/PIC menjalankan workflow tanpa spreadsheet terpisah'],['3 - Insight','Dashboard, ekspor, audit log, implementasi/bukti hasil','Manajer melihat backlog, SLA, tren, dan dampak'],['4 - Integrasi','SSO/HRIS/chat, voting, klasifikasi bantu','Hanya setelah kontrol akses dan proses stabil']], [3.0*cm,7.0*cm,6.7*cm]), Spacer(1,10), p('<b>UAT minimum:</b> (1) karyawan terverifikasi membuat tiket teridentifikasi; (2) tiket anonim dapat dilacak via token tanpa menampilkan identitas; (3) HR mengubah status dan menetapkan PIC; (4) PIC hanya membuka tiket yang ditugaskan/diizinkan; (5) catatan internal tidak bocor ke pengirim; (6) alasan penutupan terlihat; (7) histori dan notifikasi sesuai event; (8) akses lintas akun/tiket ditolak; (9) lampiran yang tidak valid ditolak; (10) laporan menggunakan data transaksi aktual.')]
story.append(PageBreak())

story += section('14 - Risiko, keputusan terbuka, dan persetujuan','Hal yang perlu diputuskan sebelum production','Dokumen ini bukan pengganti kebijakan SDM atau investigasi pelanggaran. Kasus sensitif memerlukan prosedur pelaporan dan retensi tersendiri.')
story += [table(['Risiko','Mitigasi awal'],[['Anonimitas dipakai untuk penyalahgunaan','Rate limiting, moderasi HR, kategori yang jelas, alasan penolakan, audit proses tanpa membongkar identitas yang tidak tersimpan.'],['Tiket menumpuk tanpa pemilik','SLA, dashboard backlog, assignment wajib, eskalasi manajer.'],['PIC menerima data yang tidak relevan','Triage HR dan pembatasan akses berdasarkan departemen/role.'],['Lampiran berbahaya atau data sensitif','Whitelist MIME, antivirus bila tersedia, private storage, URL temporary.'],['Notifikasi berlebihan','Preferensi kanal, batching untuk rekap, event penting saja.'],['Laporan menyesatkan','Definisi status dan timestamp dikontrol; tampilkan periode/filter.']], [5.0*cm,11.7*cm]), Spacer(1,10), p('<b>Pertanyaan terbuka:</b> siapa pemilik triage per kategori? Apa kebijakan retensi tiket/lampiran? Apakah tiket anonim wajib memiliki email/akun atau murni token? Prioritas dan SLA mana yang disetujui? Apakah manajer melihat detail atau hanya agregat? Apa jalur khusus untuk dugaan pelanggaran/pelecehan?'), Spacer(1,14), table(['Peran','Nama','Persetujuan / tanggal'],[['Pemilik Produk / HR','',''],['IT / Pengembang','',''],['Manajer Departemen','',''],['Manajemen','','']], [5.0*cm,5.8*cm,5.9*cm])]

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=1.6*cm,leftMargin=1.6*cm,topMargin=1.55*cm,bottomMargin=1.6*cm,title='Blueprint Sistem Saran Karyawan',author='Codex')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
