from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os, math

OUT = os.path.join('output', 'pdf', 'Blueprint_Sistem_Saran_Karyawan.pdf')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
NAVY, TEAL, GOLD = HexColor('#12324A'), HexColor('#007C7A'), HexColor('#D69E2E')
INK, MUTED, LINE, PALE, WHITE = HexColor('#1F2933'), HexColor('#536270'), HexColor('#C9D4DC'), HexColor('#F1F7F7'), colors.white
try:
    pdfmetrics.registerFont(TTFont('Aptos', r'C:\\Windows\\Fonts\\aptos.ttf')); pdfmetrics.registerFont(TTFont('AptosBold', r'C:\\Windows\\Fonts\\aptosbd.ttf')); FONT,BOLD='Aptos','AptosBold'
except Exception: FONT,BOLD='Helvetica','Helvetica-Bold'

s=getSampleStyleSheet()
s.add(ParagraphStyle(name='H1x',fontName=BOLD,fontSize=18,leading=23,textColor=NAVY,spaceAfter=10))
s.add(ParagraphStyle(name='H2x',fontName=BOLD,fontSize=12,leading=16,textColor=TEAL,spaceBefore=8,spaceAfter=5))
s.add(ParagraphStyle(name='Bodyx',fontName=FONT,fontSize=9.2,leading=13.5,textColor=INK,spaceAfter=5))
s.add(ParagraphStyle(name='Smallx',fontName=FONT,fontSize=7.6,leading=10,textColor=INK))
s.add(ParagraphStyle(name='Headerx',fontName=BOLD,fontSize=7.6,leading=10,textColor=WHITE))
s.add(ParagraphStyle(name='Tinyx',fontName=FONT,fontSize=6.6,leading=8,textColor=INK))
def P(t,style='Bodyx'): return Paragraph(t,s[style])

def footer(c,doc):
    c.saveState(); w,h=A4; c.setStrokeColor(LINE); c.line(18*mm,13*mm,w-18*mm,13*mm); c.setFont(FONT,7.2); c.setFillColor(MUTED)
    c.drawString(18*mm,8.5*mm,'Blueprint Sistem Saran Karyawan'); c.drawRightString(w-18*mm,8.5*mm,f'Halaman {doc.page}'); c.restoreState()
def cover(c,doc):
    c.saveState(); w,h=A4; c.setFillColor(NAVY); c.rect(0,0,w,h,fill=1,stroke=0); c.setFillColor(TEAL); c.rect(0,h-24*mm,w,24*mm,fill=1,stroke=0); c.setFillColor(GOLD); c.rect(20*mm,45*mm,5*mm,100*mm,fill=1,stroke=0)
    c.setFillColor(WHITE); c.setFont(BOLD,9); c.drawString(20*mm,h-15*mm,'BLUEPRINT PRODUK  |  PROSES BISNIS  |  ERD')
    c.setFont(BOLD,28); c.drawString(31*mm,119*mm,'Sistem Saran'); c.drawString(31*mm,107*mm,'Karyawan')
    c.setFont(FONT,15); c.setFillColor(HexColor('#A8DAD7')); c.drawString(31*mm,96*mm,'Portal tiket, respons, dan tindak lanjut')
    c.setFillColor(HexColor('#D7E8EA')); c.setFont(FONT,10)
    for i,t in enumerate(['Karyawan menyampaikan saran secara teridentifikasi atau anonim.', 'Management memverifikasi, menugaskan, merespons, dan menyelesaikan tiket.', 'Riwayat status, lampiran privat, notifikasi, dan SLA dapat ditelusuri.']): c.drawString(31*mm,(78-i*7)*mm,t)
    c.setFillColor(WHITE); c.setFont(BOLD,9); c.drawString(31*mm,37*mm,'VERSI 2.0  |  11 NOVEMBER 2026')
    c.setFont(FONT,8.5); c.setFillColor(HexColor('#D7E8EA')); c.drawString(31*mm,29*mm,'Diselaraskan dengan implementasi Laravel Sistem Saran Karyawan yang berjalan.')
    c.restoreState()

def table(data,widths,header=True):
    rows=[]
    for row_index, row in enumerate(data):
        style='Headerx' if header and row_index == 0 else 'Smallx'
        rows.append([x if isinstance(x,Flowable) else P(str(x),style) for x in row])
    t=Table(rows,colWidths=widths,repeatRows=1 if header else 0,hAlign='LEFT')
    st=[('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.35,LINE),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]
    if header: st += [('BACKGROUND',(0,0),(-1,0),NAVY),('TEXTCOLOR',(0,0),(-1,0),WHITE),('FONTNAME',(0,0),(-1,0),BOLD)]
    for i in range(1 if header else 0,len(rows)):
        if i%2==0: st.append(('BACKGROUND',(0,i),(-1,i),PALE))
    t.setStyle(TableStyle(st)); return t

class Flow(Flowable):
    def __init__(self,nodes,edges,w=530,h=150): Flowable.__init__(self); self.nodes,self.edges,self.width,self.height=nodes,edges,w,h
    def wrap(self,aw,ah): self.sc=min(1,aw/self.width); return self.width*self.sc,self.height*self.sc
    def draw(self):
        c=self.canv; c.saveState(); c.scale(getattr(self,'sc',1),getattr(self,'sc',1)); c.setStrokeColor(TEAL); c.setLineWidth(1)
        for a,b,l in self.edges:
            x,y,w,h,_=self.nodes[a]; x2,y2,w2,h2,_=self.nodes[b]; sx,sy=x+w/2,y+h/2; tx,ty=x2+w2/2,y2+h2/2
            c.line(sx,sy,tx,ty); ang=math.atan2(ty-sy,tx-sx); d=4; c.line(tx,ty,tx-d*math.cos(ang-.45),ty-d*math.sin(ang-.45)); c.line(tx,ty,tx-d*math.cos(ang+.45),ty-d*math.sin(ang+.45))
            if l: c.setFillColor(MUTED); c.setFont(FONT,6); c.drawCentredString((sx+tx)/2,(sy+ty)/2+3,l)
        for _,(x,y,w,h,label) in self.nodes.items():
            c.setFillColor(PALE); c.setStrokeColor(TEAL); c.roundRect(x,y,w,h,5,fill=1,stroke=1); c.setFillColor(NAVY); c.setFont(BOLD,7.2)
            ls=label.split('|')
            for i,line in enumerate(ls): c.drawCentredString(x+w/2,y+h/2+((len(ls)-1)/2-i)*9,line)
        c.restoreState()

class ERD(Flowable):
    def __init__(self): Flowable.__init__(self); self.width,self.height=520,350
    def wrap(self,aw,ah): return self.width,self.height
    def ent(self,c,x,y,w,title,rows):
        h=17+9*len(rows); c.setFillColor(WHITE); c.setStrokeColor(NAVY); c.roundRect(x,y,w,h,3,fill=1,stroke=1); c.setFillColor(NAVY); c.roundRect(x,y+h-17,w,17,3,fill=1,stroke=0); c.setFillColor(WHITE); c.setFont(BOLD,7.2); c.drawString(x+4,y+h-12,title); c.setFillColor(INK); c.setFont(FONT,5.8)
        for i,r in enumerate(rows): c.drawString(x+4,y+h-25-i*9,r)
    def draw(self):
        c=self.canv; c.setFillColor(TEAL); c.setFont(BOLD,6.2); c.drawString(8,338,'ORGANIZATION & ACCESS'); c.drawString(185,338,'CORE TICKET'); c.drawString(395,338,'COMMUNICATION & AUDIT')
        self.ent(c,8,250,110,'departments',['PK id','UK name, code','is_active'])
        self.ent(c,142,248,112,'users',['PK id','FK department_id','UK username, email','is_active'])
        self.ent(c,282,266,105,'roles / permissions',['PK id','UK name, guard_name','Spatie RBAC'])
        self.ent(c,405,260,102,'model_has_roles',['FK role_id','model_id, model_type','PK composite'])
        self.ent(c,8,155,110,'suggestion_categories',['PK id','UK name','is_active'])
        self.ent(c,142,145,132,'suggestions',['UUID PK id, UK ticket_number','FK category_id, submitted_by','FK created_by, department_id','status, priority, sla_due_at'])
        self.ent(c,302,160,105,'suggestion_assignments',['UUID PK id','FK suggestion_id','FK assignee_id, assigned_by','is_active, completed_at'])
        self.ent(c,425,165,86,'notifications',['UUID PK id','FK user_id','FK suggestion_id','type, read_at'])
        self.ent(c,8,50,112,'suggestion_attachments',['UUID PK id','FK suggestion_id','FK created_by','location, url_system'])
        self.ent(c,140,42,132,'suggestion_messages',['UUID PK id','FK suggestion_id','FK sender_id','sender_type, is_internal'])
        self.ent(c,302,50,130,'suggestion_status_histories',['UUID PK id','FK suggestion_id','FK changed_by','from_status, to_status'])
        self.ent(c,450,60,60,'email_verification_codes',['UUID PK id','FK user_id','expires_at'])
        c.setFillColor(MUTED); c.setFont(FONT,6); c.drawString(8,7,'Relasi FK dibaca dari kolom setiap entitas; matriks relasi dan aturan akses dijabarkan pada halaman berikutnya.')

story=[Spacer(1,190*mm),PageBreak()]
story += [P('Ringkasan sistem','H1x'),P('Sistem Saran Karyawan adalah aplikasi internal untuk menerima usulan, keluhan, atau masukan karyawan sebagai tiket terstruktur. Karyawan dapat mengirim saran dengan identitas atau secara anonim; Management kemudian menangani tiket melalui dashboard yang memiliki pembatasan peran dan izin.'),
P('<b>Nilai utama.</b> Setiap saran memperoleh nomor tiket, kategori, riwayat status, jalur respons, dan notifikasi. Pengirim tetap dapat memantau tiket anonim melalui riwayat akun atau token pelacakan, tanpa identitasnya ditampilkan kepada Management.'),P('Cakupan yang terimplementasi','H2x'),
table([['Modul','Fungsi aktual','Pengguna'],['Autentikasi karyawan','Registrasi, verifikasi OTP email, login, lupa/reset password.','Employee'],['Tiket saran','Buat tiket, pilih kategori, mode anonim, lampiran privat, riwayat tiket.','Employee'],['Management','Dashboard, daftar/detail tiket, respons, status, prioritas, penugasan, notifikasi.','Management'],['Administrasi','Kategori, akun Management, role, permission, status aktif akun.','Super Admin'],['Keamanan','Session auth, role/permission middleware, file attachment privat, throttle login.','Semua peran']], [34*mm,89*mm,58*mm]),
P('Akses uji coba','H2x'),table([['Area','URL / langkah uji'],['Portal karyawan','https://dev.saran-karyawan.dsicorp.id/ - pilih Daftar, isi data karyawan, verifikasi OTP email, lalu login.'],['Login Management','https://dev.saran-karyawan.dsicorp.id/management/login'],['Management API','POST /management/auth/login dengan username dan password']], [43*mm,128*mm]),
table([['Akun uji Management','Username','Password','Hak akses'],['Super Admin (akun seed)','superadmin','SuperAdmin!2026','Akses penuh Management dan administrasi; dapat login melalui URL Management.'],['Karyawan','Daftar mandiri','Buat password sendiri','Akses portal karyawan setelah verifikasi email.']], [42*mm,37*mm,42*mm,50*mm]),
P('<b>Catatan keamanan:</b> akun Super Admin di atas adalah kredensial default seeder aplikasi dan dapat berubah jika environment memakai SUPER_ADMIN_USERNAME atau SUPER_ADMIN_PASSWORD. Ganti password ini sebelum produksi dan jangan gunakan sebagai akun produksi.' ,'Smallx'),PageBreak()]

story += [P('Arsitektur aplikasi dan hak akses','H1x'),P('Aplikasi menggunakan Laravel dengan autentikasi berbasis session. Pengamanan tidak bergantung pada tampilan: route Management diproteksi role dan permission di server.'),
Flow({'a':(15,93,105,32,'Portal karyawan|form saran dan riwayat'),'b':(150,93,120,32,'Laravel aplikasi inti|auth, ticket, policy'),'c':(300,112,95,30,'Database|PostgreSQL'),'d':(300,52,95,30,'Storage privat|lampiran'),'e':(425,93,90,32,'Management|dashboard tiket'),'f':(150,30,120,30,'Mail|OTP dan reset')},[('a','b','HTTPS'),('b','c','ORM'),('b','d','file'),('e','b','session'),('b','f','OTP')],520,145),
table([['Peran','Akses utama','Batasan'],['Employee','Membuat saran, mengakses riwayat dan lampiran tiket miliknya.','Tidak dapat membuka dashboard atau API Management.'],['Management','Melihat, membalas, mengubah workflow tiket, mengelola kategori.','Tidak mengelola akun/role kecuali diberi hak melalui Super Admin.'],['Super Admin','Seluruh akses Management, akun, role, permission, dan kategori.','Tidak dapat mengubah role Super Admin aktif melalui UI.']], [32*mm,83*mm,66*mm]),
P('Kontrol akses route','H2x'),table([['Area','Middleware / aturan'],['Karyawan','auth untuk /suggestions; pemilik tiket diverifikasi melalui created_by.'],['Management','auth + role:management,super_admin + permission ticket.view / ticket.reply / ticket.update.'],['Super Admin','auth + role:super_admin untuk pengguna dan role.'],['Lampiran','File berada di storage privat; endpoint open hanya mengizinkan owner tiket.']], [36*mm,145*mm]),PageBreak()]

story += [P('Proses bisnis tiket saran','H1x'),P('Proses berfokus pada satu objek utama, yaitu tiket saran. Anonimitas memisahkan identitas yang tampil ke Management dari pemilik teknis untuk riwayat dan notifikasi.'),
Flow({'a':(8,105,65,32,'1. Login|karyawan'),'b':(85,105,65,32,'2. Isi|saran'),'c':(162,105,65,32,'3. Simpan|tiket'),'d':(239,105,65,32,'4. Notifikasi|Management'),'e':(316,105,65,32,'5. Triage &|penugasan'),'f':(393,105,65,32,'6. Respons|dan update'),'g':(470,105,55,32,'7. Selesai')},[('a','b',''),('b','c',''),('c','d',''),('d','e',''),('e','f',''),('f','g','')],530,155),
table([['Tahap','Aktor','Aktivitas sistem','Output'],['Pengajuan','Employee','Pilih kategori, tulis judul/detail, pilih anonim, unggah lampiran opsional.','Ticket number SRN-YYYYMMDD-XXXXXX; status Baru.'],['Pencatatan','Sistem','Simpan owner teknis di created_by; submitted_by dikosongkan bila anonim.','Token pelacakan, status history awal, file privat.'],['Pemberitahuan','Sistem','Kirim notifikasi ke user aktif dengan role management/super_admin.','Notifikasi tiket baru.'],['Triage','Management','Tentukan prioritas, PIC, status; SLA dihitung menurut prioritas.','Tiket Diproses atau Menunggu karyawan.'],['Respons','Management','Kirim pesan ke ticket; pemilik menerima notifikasi.','Percakapan dan history terbarui.'],['Penutupan','Management','Ubah status menjadi Selesai.','closed_at dan status history tercatat.']], [25*mm,28*mm,79*mm,49*mm]),PageBreak()]

story += [P('Workflow, SLA, dan anonimitas','H1x'),P('Status utama yang digunakan aplikasi: <b>Baru</b>, <b>Diproses</b>, <b>Menunggu karyawan</b>, dan <b>Selesai</b>. Perubahan status selalu disertai catatan riwayat.'),
Flow({'a':(20,100,82,30,'BARU'),'b':(145,100,82,30,'DIPROSES'),'c':(270,100,110,30,'MENUNGGU KARYAWAN'),'d':(423,100,82,30,'SELESAI'),'e':(145,38,82,30,'REOPEN')},[('a','b',''),('b','c',''),('c','b',''),('b','d',''),('d','e',''),('e','b','')],520,150),
table([['Prioritas','SLA default','Tindakan Management'],['Tinggi','1 hari sejak workflow diperbarui.','Triage cepat, tetapkan PIC, beri respons awal.'],['Sedang','3 hari sejak workflow diperbarui.','Pantau penugasan dan komunikasi dengan pengirim.'],['Rendah','7 hari sejak workflow diperbarui.','Tangani dalam antrean normal.']], [40*mm,50*mm,91*mm]),
P('Aturan anonimitas','H2x'),table([['Aturan','Implementasi aktual'],['Identitas pengirim','submitted_by diset null bila is_anonymous=true, sehingga identitas tidak ditampilkan sebagai pengirim pada tiket.'],['Pemilik teknis','created_by tetap merekam pemilik untuk riwayat pribadi, notifikasi, dan kontrol lampiran.'],['Pelacakan','tracking_token acak tersedia pada tiket anonim sebagai alternatif pelacakan.'],['Akses Management','Management melihat tiket untuk ditangani; representasi anonim tidak memperlihatkan identitas pengirim.']], [49*mm,122*mm]),PageBreak()]

story += [P('ERD Sistem Saran Karyawan','H1x'),P('ERD ini disusun dari migrasi dan model aplikasi yang ada. Semua entitas domain memakai UUID; RBAC menggunakan tabel Spatie untuk role dan permission.'),ERD(),Spacer(1,4),
table([['Relasi inti','Kardinalitas','Keterangan'],['Department -> User','1 : N','User dapat memiliki satu department; department pada tiket mengikuti pengirim saat pengajuan.'],['Category -> Suggestion','1 : N','Kategori aktif dipilih saat membuat tiket; penghapusan kategori dibatasi.'],['User -> Suggestion','1 : N','created_by adalah pemilik teknis; submitted_by kosong bila tiket anonim.'],['Suggestion -> Attachment/Message/History','1 : N','Setiap file, respons, dan perubahan status melekat pada satu tiket.'],['User -> Notification','1 : N','Notifikasi dapat mereferensikan suggestion.'],['User <-> Role','N : N','model_has_roles menghubungkan user dan role.']], [44*mm,32*mm,95*mm]),PageBreak()]

story += [P('Kamus data dan integritas','H1x'),table([['Entitas','Kolom kunci','Aturan penting'],['departments','id, name, code, is_active','name dan code unik.'],['users','id, department_id, username, email, password, is_active','username/email unik; password ter-hash; email dapat diverifikasi OTP.'],['suggestion_categories','id, name, description, is_active','name unik; hanya kategori aktif dikembalikan untuk formulir employee.'],['suggestions','id, ticket_number, category_id, submitted_by, created_by, department_id, is_anonymous, status, priority, sla_due_at','ticket_number unik; category restrict delete; created_by/submitted_by nullable; status awal Baru.'],['suggestion_attachments','id, suggestion_id, created_by, original_name, location, url_system, mime_type, size','File disimpan di private storage dan dibuka melalui endpoint berotorisasi.'],['suggestion_messages','id, suggestion_id, sender_id, body, sender_type, is_internal, read_at','sender_type membedakan Management dan pengirim.'],['suggestion_assignments','id, suggestion_id, assignee_id, assigned_by, assigned_at, completed_at, is_active','Penugasan memperjelas PIC penanganan.'],['suggestion_status_histories','id, suggestion_id, changed_by, from_status, to_status, note','Jejak transisi status yang dapat diaudit.'],['notifications','id, user_id, suggestion_id, type, title, body, read_at','Tiket baru untuk Management; respons/status untuk owner.']], [38*mm,85*mm,48*mm]),
P('Aturan integritas yang perlu dipertahankan','H2x'),table([['ID','Aturan'],['BR-01','Tiket baru selalu berstatus Baru dan memiliki nomor ticket_number unik.'],['BR-02','Tiket anonim tidak menyimpan submitted_by; created_by dipakai hanya untuk ownership teknis.'],['BR-03','Satu perubahan workflow membuat satu suggestion_status_histories.'],['BR-04','SLA dihitung dari prioritas Tinggi 1 hari, Sedang 3 hari, Rendah 7 hari.'],['BR-05','Lampiran hanya dapat dibuka oleh pemilik tiket melalui storage privat.'],['BR-06','Notifikasi tiket baru hanya diberikan kepada akun Management/Super Admin yang aktif.']], [18*mm,157*mm]),PageBreak()]

story += [P('UAT dan rencana perbaikan','H1x'),table([['Skenario UAT','Hasil yang diharapkan'],['Employee terverifikasi membuat saran teridentifikasi.','Tiket dibuat, status Baru, created_by dan submitted_by terisi, Management mendapat notifikasi.'],['Employee membuat saran anonim.','submitted_by null, created_by tetap tersimpan, token pelacakan tersedia, Management tidak menerima identitas pengirim.'],['Employee membuka tiket atau lampiran milik pengguna lain.','Akses ditolak; endpoint lampiran mengembalikan 403.'],['Management login dengan akun non-management / tidak aktif.','Login ditolak dengan pesan validasi.'],['Management mengubah status, prioritas, dan PIC.','sla_due_at dihitung, history dibuat, owner menerima notifikasi.'],['Management mengirim respons.','Pesan tersimpan sebagai sender_type management; owner menerima notifikasi.'],['Employee mencoba membuka dashboard Management.','Redirect/403 sesuai route dan middleware.']], [85*mm,86*mm]),
P('Rekomendasi hardening berikutnya','H2x'),table([['Prioritas','Usulan','Alasan'],['Tinggi','Batasi tipe/ukuran file secara eksplisit dan lakukan antivirus scan asinkron.','Mengurangi risiko attachment berbahaya.'],['Tinggi','Tambahkan audit trail login dan akses lampiran.','Memperkuat investigasi keamanan.'],['Sedang','Tambahkan notifikasi SLA mendekati lewat dan dashboard antrean per PIC.','Membantu Management memenuhi target layanan.'],['Sedang','Tambahkan kebijakan retensi/purge untuk tiket, file, dan notifikasi.','Mengendalikan risiko penyimpanan data.'],['Rendah','Tambahkan laporan tren kategori dan waktu penyelesaian.','Mendukung pengambilan keputusan berbasis data.']], [28*mm,91*mm,52*mm]),
P('Dokumen ini menjadi acuan untuk operasi, UAT, dan pengembangan berikutnya. Perubahan database atau hak akses perlu memperbarui bagian ERD, workflow, dan matriks UAT ini.'),]

doc=SimpleDocTemplate(OUT,pagesize=A4,leftMargin=18*mm,rightMargin=18*mm,topMargin=17*mm,bottomMargin=19*mm,title='Blueprint Sistem Saran Karyawan')
doc.build(story,onFirstPage=cover,onLaterPages=footer)
print(os.path.abspath(OUT))
