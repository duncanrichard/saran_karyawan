from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, KeepTogether, Flowable)
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from reportlab.lib import utils
import os

OUT = os.path.join('output', 'pdf', 'Blueprint_Sistem_Notulensi_Bisnis_Proses_dan_ERD.pdf')
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# Palette: formal, readable, and deliberately restrained.
NAVY = HexColor('#12324A')
TEAL = HexColor('#007C7A')
GOLD = HexColor('#D69E2E')
INK = HexColor('#1F2933')
MUTED = HexColor('#5B6875')
LINE = HexColor('#C9D4DC')
PALE = HexColor('#F2F7F8')
PALE2 = HexColor('#E7F2F1')
WHITE = colors.white
RED = HexColor('#B42318')

try:
    pdfmetrics.registerFont(TTFont('Aptos', r'C:\\Windows\\Fonts\\aptos.ttf'))
    pdfmetrics.registerFont(TTFont('AptosBold', r'C:\\Windows\\Fonts\\aptosbd.ttf'))
    FONT, BOLD = 'Aptos', 'AptosBold'
except Exception:
    FONT, BOLD = 'Helvetica', 'Helvetica-Bold'

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='DocTitle', fontName=BOLD, fontSize=26, leading=31, textColor=WHITE, spaceAfter=8))
styles.add(ParagraphStyle(name='DocSub', fontName=FONT, fontSize=11, leading=16, textColor=HexColor('#D7E8EA')))
styles.add(ParagraphStyle(name='H1x', fontName=BOLD, fontSize=18, leading=23, textColor=NAVY, spaceBefore=4, spaceAfter=10))
styles.add(ParagraphStyle(name='H2x', fontName=BOLD, fontSize=12, leading=16, textColor=TEAL, spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name='Bodyx', fontName=FONT, fontSize=9.2, leading=13.5, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name='Smallx', fontName=FONT, fontSize=7.6, leading=10, textColor=INK))
styles.add(ParagraphStyle(name='Tinyx', fontName=FONT, fontSize=6.7, leading=8.3, textColor=INK))
styles.add(ParagraphStyle(name='Callout', fontName=FONT, fontSize=9.3, leading=14, textColor=INK, leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=4))
styles.add(ParagraphStyle(name='CoverMeta', fontName=FONT, fontSize=9, leading=13, textColor=WHITE))

def P(text, style='Bodyx'):
    return Paragraph(text, styles[style])

def footer(canv, doc):
    canv.saveState()
    w, h = A4
    canv.setStrokeColor(LINE); canv.setLineWidth(.5); canv.line(18*mm, 13*mm, w-18*mm, 13*mm)
    canv.setFont(FONT, 7.2); canv.setFillColor(MUTED)
    canv.drawString(18*mm, 8.5*mm, 'Blueprint Sistem Notulensi (MoM) Terintegrasi AI')
    canv.drawRightString(w-18*mm, 8.5*mm, f'Halaman {doc.page}')
    canv.restoreState()

def cover(canv, doc):
    canv.saveState(); w,h=A4
    canv.setFillColor(NAVY); canv.rect(0,0,w,h,fill=1,stroke=0)
    canv.setFillColor(TEAL); canv.rect(0,h-24*mm,w,24*mm,fill=1,stroke=0)
    canv.setFillColor(GOLD); canv.rect(20*mm, 46*mm, 5*mm, 96*mm,fill=1,stroke=0)
    canv.setFillColor(WHITE); canv.setFont(BOLD, 9); canv.drawString(20*mm,h-15*mm,'BLUEPRINT PRODUK  |  BISNIS PROSES  |  ERD')
    canv.setFillColor(HexColor('#D7E8EA')); canv.setFont(FONT,10); canv.drawString(31*mm, 133*mm,'Dokumen rancangan yang dirapikan untuk pembahasan dan persetujuan')
    canv.setFillColor(WHITE); canv.setFont(BOLD,28); canv.drawString(31*mm, 117*mm,'Sistem Notulensi')
    canv.drawString(31*mm, 105*mm,'(Minutes of Meeting)')
    canv.setFont(FONT,16); canv.setFillColor(HexColor('#A8DAD7')); canv.drawString(31*mm, 94*mm,'Terintegrasi AI')
    canv.setFillColor(HexColor('#D7E8EA')); canv.setFont(FONT,10)
    for i,t in enumerate(['Satu sumber kebenaran untuk rapat, keputusan, dan tindak lanjut.',
                          'AI mempercepat penyusunan; manusia tetap memverifikasi dan menyetujui.',
                          'Hak akses, kerahasiaan, notifikasi, dan audit dirancang sejak awal.']):
        canv.drawString(31*mm, (76-i*7)*mm, t)
    canv.setFillColor(WHITE); canv.setFont(BOLD,9); canv.drawString(31*mm, 37*mm, 'VERSI 2.0  |  11 NOVEMBER 2026')
    canv.setFont(FONT,8.5); canv.setFillColor(HexColor('#D7E8EA')); canv.drawString(31*mm, 29*mm,'Disusun berdasarkan Blueprint, PRD, dan ERD sumber; struktur proses dan model data diperbaiki.')
    canv.restoreState()

class BoxDiagram(Flowable):
    def __init__(self, nodes, edges, width=500, height=180, font=7):
        Flowable.__init__(self); self.nodes=nodes; self.edges=edges; self.width=width; self.height=height; self.font=font
    def wrap(self, availWidth, availHeight):
        self.scale_factor = min(1, availWidth / self.width)
        return self.width * self.scale_factor, self.height * self.scale_factor
    def draw(self):
        c=self.canv
        c.saveState(); c.scale(getattr(self, 'scale_factor', 1), getattr(self, 'scale_factor', 1))
        # edges first
        c.setStrokeColor(TEAL); c.setLineWidth(1)
        for a,b,label in self.edges:
            x1,y1,w1,h1,_=self.nodes[a]; x2,y2,w2,h2,_=self.nodes[b]
            sx,sy=x1+w1/2,y1+h1/2; tx,ty=x2+w2/2,y2+h2/2
            c.line(sx,sy,tx,ty)
            # arrow head
            import math
            ang=math.atan2(ty-sy,tx-sx); d=5
            c.line(tx,ty,tx-d*math.cos(ang-.45),ty-d*math.sin(ang-.45)); c.line(tx,ty,tx-d*math.cos(ang+.45),ty-d*math.sin(ang+.45))
            if label:
                c.setFillColor(MUTED); c.setFont(FONT,6.2); c.drawCentredString((sx+tx)/2,(sy+ty)/2+3,label)
        for _,(x,y,w,h,label) in self.nodes.items():
            c.setFillColor(PALE); c.setStrokeColor(TEAL); c.roundRect(x,y,w,h,5,fill=1,stroke=1)
            c.setFillColor(NAVY); c.setFont(BOLD,self.font)
            lines=label.split('|')
            for i,line in enumerate(lines): c.drawCentredString(x+w/2, y+h/2+((len(lines)-1)/2-i)*self.font*1.3, line)
        c.restoreState()

class ERD(Flowable):
    def __init__(self): Flowable.__init__(self); self.width=520; self.height=365
    def wrap(self, availWidth, availHeight):
        return self.width, self.height
    def draw_entity(self,c,x,y,w,title,rows):
        rowh=9; h=17+rowh*len(rows)
        c.setStrokeColor(NAVY); c.setLineWidth(.7); c.setFillColor(WHITE); c.roundRect(x,y,w,h,3,fill=1,stroke=1)
        c.setFillColor(NAVY); c.roundRect(x,y+h-17,w,17,3,fill=1,stroke=0); c.setFillColor(WHITE); c.setFont(BOLD,7.3); c.drawString(x+4,y+h-12,title)
        c.setFont(FONT,5.9); c.setFillColor(INK)
        for i,r in enumerate(rows):
            c.drawString(x+4,y+h-25-i*rowh,r)
        return (x,y,w,h)
    def arrow(self,c,a,b,label='1:N'):
        x1,y1,w1,h1=a; x2,y2,w2,h2=b
        sx,sy=x1+w1/2,y1+h1/2; tx,ty=x2+w2/2,y2+h2/2
        # pick horizontal/vertical sensible endpoints
        if abs(tx-sx)>abs(ty-sy): sx=x1+w1 if tx>sx else x1; tx=x2 if tx>sx else x2+w2
        else: sy=y1+h1 if ty>sy else y1; ty=y2 if ty>sy else y2+h2
        c.setStrokeColor(HexColor('#78909C')); c.setLineWidth(.55); c.line(sx,sy,tx,ty)
        c.setFillColor(MUTED); c.setFont(FONT,5.6); c.drawCentredString((sx+tx)/2,(sy+ty)/2+2,label)
    def draw(self):
        c=self.canv
        # positions deliberately spaced for legible relationship map
        d=self.draw_entity(c,8,282,104,'divisions',['PK id','FK head_user_id -> users','UK name, slug'])
        u=self.draw_entity(c,145,278,112,'users',['PK id','FK division_id','UK email','role, is_active'])
        mt=self.draw_entity(c,286,285,108,'meeting_templates',['PK id','name, meeting_type','sections_json'])
        m=self.draw_entity(c,144,185,128,'meetings',['PK id','FK template_id','FK division_id','FK created_by, approved_by','status, confidentiality'])
        p=self.draw_entity(c,8,167,111,'meeting_participants',['PK id','FK meeting_id','FK user_id nullable','external_name, email','UK meeting_id + user_id'])
        g=self.draw_entity(c,290,170,112,'meeting_access_grants',['PK id','FK meeting_id','FK user_id / division_id','grant_type','UK meeting + subject'])
        t=self.draw_entity(c,418,270,92,'topics',['PK id','UK name, slug','status'])
        tag=self.draw_entity(c,418,174,94,'meeting_tags',['PK id','FK meeting_id','FK user/division/topic','position_json','CHECK exactly_one_target'])
        dec=self.draw_entity(c,8,72,110,'decisions',['PK id','FK meeting_id','FK topic_id','content, decided_at'])
        act=self.draw_entity(c,145,64,118,'action_items',['PK id','FK meeting_id','FK pic_user_id','FK division_id','due_date, status'])
        ai=self.draw_entity(c,290,60,112,'ai_summaries',['PK id','FK meeting_id','FK topic_id/division_id','FK generated_by/approved_by','scope, version, status'])
        att=self.draw_entity(c,420,83,91,'attachments',['PK id','FK meeting_id','FK uploaded_by','kind, path/url'])
        aud=self.draw_entity(c,8,2,110,'audit_logs',['PK id','FK actor_user_id','FK meeting_id nullable','action, changes_json'])
        notif=self.draw_entity(c,145,0,118,'notifications',['UUID PK id','FK recipient_user_id','FK meeting_id nullable','type, data_json, read_at'])
        # FK paths are listed inside each entity and in the relationship matrix below.
        # Omitting crossing connector lines keeps the complete schema readable at A4 size.
        c.setFillColor(TEAL); c.setFont(BOLD,6.2)
        c.drawString(8,355,'IDENTITY & ORGANIZATION')
        c.drawString(144,355,'MEETING CORE')
        c.drawString(418,355,'CLASSIFICATION')
        c.drawString(8,150,'PARTICIPATION & ACCESS')
        c.drawString(8,55,'EXECUTION, AI & AUDIT')

def table(data, widths, header=True, font=7.5):
    converted=[]
    for row in data:
        converted.append([x if isinstance(x,Flowable) else P(str(x),'Smallx' if font>=7 else 'Tinyx') for x in row])
    t=Table(converted, colWidths=widths, repeatRows=1 if header else 0, hAlign='LEFT')
    ts=[('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.35,LINE),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]
    if header: ts += [('BACKGROUND',(0,0),(-1,0),NAVY),('TEXTCOLOR',(0,0),(-1,0),WHITE),('FONTNAME',(0,0),(-1,0),BOLD)]
    for r in range(1 if header else 0,len(data)):
        if r%2==0: ts.append(('BACKGROUND',(0,r),(-1,r),PALE))
    t.setStyle(TableStyle(ts)); return t

story=[]
story.append(Spacer(1,190*mm)); story.append(PageBreak())

story += [P('Ringkasan dan keputusan rancangan','H1x'),
          P('Dokumen ini mengonsolidasikan Blueprint, PRD, alur bisnis, dan ERD Sistem Notulensi (MoM) Terintegrasi AI. Rancangan dipusatkan pada siklus hidup rapat yang dapat ditelusuri: notulen dibuat, diverifikasi, difinalkan, didistribusikan, lalu ditindaklanjuti hingga action item selesai.'),
          P('<b>Tujuan bisnis.</b> Menjadikan notulen, keputusan, dan tugas tindak lanjut sebagai catatan operasional yang dapat dicari, diakses sesuai otorisasi, dan diaudit.'),
          P('<b>Prinsip desain.</b> AI mempercepat rangkuman dan ekstraksi, tetapi tidak pernah memfinalkan notulen atau membuat keputusan tanpa verifikasi manusia.'),
          P('<b>Ruang lingkup rilis awal.</b> Editor notulen, template, peserta, tagging, keputusan, action item, resume AI, finalisasi, notifikasi, pencarian, audit, dan pengaturan administrasi.'),
          Spacer(1,5), P('Perbaikan utama dibanding rancangan sumber','H2x'),
          table([
              ['Area','Perbaikan rancangan','Dampak'],
              ['Integritas tag','Tag dipisah ke FK eksplisit user/division/topic dengan CHECK tepat satu target.','Tidak ada target yatim; query dan akses lebih aman.'],
              ['Kerahasiaan','Tambahkan <i>meeting_access_grants</i> untuk akses eksplisit pengguna/divisi.','Akses restricted dan secret dapat dibuktikan serta diaudit.'],
              ['Notifikasi','Penerima disimpan sebagai FK langsung ke users, bukan polymorphic.','Integritas penerima dan retensi lebih mudah dijaga.'],
              ['Peserta','Tambahkan unique constraint peserta internal per rapat.','Mencegah duplikasi peserta serta notifikasi ganda.'],
              ['Lifecycle','Pisahkan status notulen, persetujuan AI, dan status tugas.','Aturan bisnis dapat diuji dan tidak saling tumpang tindih.'],
          ], [31*mm,67*mm,72*mm]),
          P('Batasan: sistem bukan pengganti kalender, aplikasi video meeting, atau manajemen proyek penuh. Action item hanya mewakili tindak lanjut yang lahir dari rapat.','Smallx'), PageBreak()]

story += [P('Arsitektur dan batas tanggung jawab','H1x'),
          P('Sistem dibangun sebagai aplikasi internal berbasis web. Pembagian komponen berikut menjaga pengalaman pengguna tetap cepat, sementara proses AI dan notifikasi dijalankan asinkron.'), Spacer(1,4)]
arch_nodes={
 'ui':(12,112,105,34,'Browser web|desktop dan mobile'), 'app':(154,112,125,34,'Aplikasi inti|auth, policy, notulen'), 'db':(323,132,90,30,'PostgreSQL|data transaksi'),
 'queue':(323,75,90,30,'Queue & scheduler|job asinkron'), 'ai':(450,112,90,34,'Layanan AI|resume dan ekstraksi'),
 'obj':(450,57,90,30,'Object storage|lampiran'), 'mail':(154,57,105,30,'Email / in-app|notifikasi')}
arch_edges=[('ui','app','HTTPS'),('app','db','query'),('app','queue','dispatch'),('queue','ai','request'),('app','obj','file'),('queue','mail','send')]
story += [BoxDiagram(arch_nodes,arch_edges,540,165,7.2), Spacer(1,6),
          table([['Lapisan','Tanggung jawab','Kontrol penting'],
                 ['Antarmuka','Editor dokumen, dashboard, pencarian, board tugas.','Validasi form, aksesibilitas, indikator status.'],
                 ['Aplikasi inti','Policy akses, workflow notulen, tagging, audit, API internal.','Otorisasi di server dan query scope.'],
                 ['Data','Transaksi MoM, metadata, indeks pencarian, riwayat.','FK, CHECK, unique index, soft delete pada notulen.'],
                 ['Worker','Resume AI, ekstraksi tugas, pengingat, rekap, pengiriman email.','Retry terukur, idempotensi, log kegagalan.'],
                 ['Integrasi','LLM, email, storage, SSO dan kalender pada fase lanjut.','Kontrak API, timeout, redaksi data rahasia.']], [28*mm,83*mm,59*mm]),
          P('<b>Keputusan arsitektur:</b> proses AI tidak mengunci editor; hasilnya disimpan sebagai draf terpisah, diberi versi, lalu disetujui atau ditolak notulis.','Callout'),
          P('Akses aplikasi untuk Management','H2x'),
          table([['Item','Nilai / instruksi'],
                 ['URL aplikasi','https://dev.saran-karyawan.dsicorp.id/'],
                 ['URL login Management','https://dev.saran-karyawan.dsicorp.id/management/login'],
                 ['Peran','Management - gunakan akun yang telah disediakan administrator.'],
                 ['Form login','Username: [diisi oleh pengguna]  |  Password: [diisi oleh pengguna]'],
                 ['Kontrol keamanan','Kredensial tidak dicantumkan dalam blueprint; gunakan manajer kata sandi, HTTPS, dan logout setelah selesai.']], [48*mm,122*mm]),
          P('Alur akses: buka URL login Management -> isi username -> isi password -> pilih Login -> sistem memvalidasi akun dan mengarahkan pengguna ke dashboard Management sesuai otorisasi.','Smallx'), PageBreak()]

story += [P('Proses bisnis end-to-end','H1x'), P('Alur operasional berikut menjadi acuan implementasi, UAT, SOP notulis, dan konfigurasi notifikasi.'), Spacer(1,4)]
bp_nodes={'p1':(7,120,63,30,'1. Siapkan|rapat'), 'p2':(82,120,63,30,'2. Catat|notulen'), 'p3':(157,120,63,30,'3. AI proses|draf'), 'p4':(232,120,68,30,'4. Verifikasi|manusia'), 'p5':(312,120,63,30,'5. Finalkan|notulen'), 'p6':(387,120,68,30,'6. Distribusi|terkontrol'), 'p7':(467,120,63,30,'7. Tindak|lanjut')}
bp_edges=[('p1','p2','draf'),('p2','p3','minta AI'),('p3','p4','hasil draf'),('p4','p5','setuju'),('p5','p6','final'),('p6','p7','tugas')]
story += [BoxDiagram(bp_nodes,bp_edges,540,170,7.5), Spacer(1,4),
          table([['Tahap','Aktor utama','Input dan aktivitas','Output / kontrol'],
                 ['1. Perencanaan','Notulis','Pilih template, jadwal, agenda, peserta, klasifikasi.','Meeting draft; pembuat dan hak akses awal tercatat.'],
                 ['2. Pencatatan','Notulis / peserta','Tuliskan pembahasan, keputusan, tag, dan action item.','Autosave; tag dan peserta tervalidasi.'],
                 ['3. Pemrosesan AI','Sistem AI','Worker membuat resume, keputusan, usulan tugas dan tag.','Hasil draft berlabel AI; kegagalan tidak menghambat notulen.'],
                 ['4. Verifikasi','Notulis','Koreksi resume, konfirmasi PIC/tenggat, tolak saran yang tidak tepat.','Resume approved/rejected; tugas siap final.'],
                 ['5. Finalisasi','Notulis / admin','Validasi isi wajib dan transisi status.','Meeting final; versi terkunci; audit dibuat.'],
                 ['6. Distribusi','Sistem','Hitung penerima melalui peserta/tag/grant lalu cek policy.','Notifikasi in-app dan email hanya ke pihak berhak.'],
                 ['7. Tindak lanjut','PIC / manajer','PIC memperbarui progres; scheduler mengirim pengingat.','Status tugas, overdue turunan, rekap berkala.']], [27*mm,34*mm,72*mm,53*mm]), PageBreak()]

story += [P('Alur keputusan dan kontrol proses','H1x'),
          P('Diagram berikut menjelaskan cabang yang kritis terhadap kualitas notulen, keamanan, dan pemberitahuan.'), Spacer(1,4)]
flow_nodes={'a':(14,155,110,28,'Draf notulen tersimpan'), 'b':(158,155,110,28,'Data wajib lengkap?'), 'c':(302,155,110,28,'PIC dan tenggat valid?'), 'd':(446,155,80,28,'Final'),
            'e':(158,95,110,28,'Kembalikan ke editor'), 'f':(302,95,110,28,'Distribusi: cek akses'), 'g':(446,95,80,28,'Kirim'),
            'h':(302,35,110,28,'AI tersedia?'), 'i':(446,35,80,28,'Resume draft'), 'j':(158,35,110,28,'Lanjut manual')}
flow_edges=[('a','b','submit'),('b','c','ya'),('b','e','tidak'),('c','d','ya'),('c','e','tidak'),('d','f','event'),('f','g','penerima berhak'),('a','h','opsional'),('h','i','ya'),('h','j','tidak')]
story += [BoxDiagram(flow_nodes,flow_edges,540,205,7.3), Spacer(1,5),
          table([['Kontrol','Aturan yang diberlakukan','Bukti audit'],
                 ['Finalisasi','Hanya draft; judul, peserta, action item, dan semua PIC/tenggat wajib tervalidasi.','meeting.finalized + approved_by + finalized_at'],
                 ['Kerahasiaan','Policy berlaku sebelum data dibaca, sebelum AI dipanggil, dan sebelum notifikasi dikirim.','meeting.viewed / notification.sent'],
                 ['AI','Output merupakan draf; hasil tidak dapat mengubah notulen final tanpa tindakan manusia.','ai_summary.generated / approved / rejected'],
                 ['Perubahan final','Hanya admin melalui prosedur koreksi yang terdokumentasi.','meeting.corrected + alasan perubahan'],
                 ['Overdue','Nilai dihitung dari due_date dan status, bukan disimpan sebagai status baru.','action_item.reminded / updated']], [31*mm,92*mm,62*mm]),
          P('<b>Rumus overdue:</b> due_date &lt; tanggal hari ini AND status NOT IN (done, cancelled). Rumus dihitung pada query/dashboard agar selalu aktual.','Callout'), PageBreak()]

story += [P('Lifecycle dan peran','H1x'), P('State machine membatasi perubahan status agar proses dapat diaudit dan diuji secara konsisten.'), Spacer(1,5)]
state_nodes={'d':(25,140,90,28,'DRAFT'), 'f':(165,140,90,28,'FINAL'), 'l':(305,140,90,28,'LOCKED'), 'x':(445,140,65,28,'ARCHIVED'), 'r':(165,72,90,28,'RETURN TO DRAFT')}
state_edges=[('d','f','finalize'),('f','l','lock / retention'),('l','x','archive'),('f','r','admin correction'),('r','d','reopen')]
story += [BoxDiagram(state_nodes,state_edges,530,190,8), Spacer(1,4),
          table([['Peran','Boleh melakukan','Tidak boleh melakukan'],
                 ['Admin','Kelola master data; membaca seluruh notulen; koreksi final beralasan; audit.','Mengabaikan audit atau policy kerahasiaan.'],
                 ['Notulis','Membuat dan menyunting draf; meminta AI; menerima/menolak hasil AI; finalisasi.','Mengubah locked atau mengakses secret tanpa grant.'],
                 ['PIC','Membaca notulen yang berhak; memperbarui status tugas sendiri.','Memfinalkan notulen atau mengubah tugas pihak lain tanpa otorisasi.'],
                 ['Manajer / pembaca','Membaca sesuai policy; melihat rekap sesuai cakupan akses.','Mendapat data melalui tag bila notulen secret.']], [33*mm,78*mm,73*mm]),
          P('Catatan: status <b>locked</b> dipakai untuk rekaman yang selesai retensi atau perlu dibekukan; archive bukan penghapusan fisik. Notulen memakai soft delete dan hanya admin yang dapat memulihkan.','Callout'), PageBreak()]

story += [P('ERD konseptual dan fisik yang diperbaiki','H1x'),
          P('ERD berikut menggunakan FK eksplisit untuk relasi domain yang penting. Pembagian ini menghindari relasi polimorfik pada tag dan notifikasi, sehingga integritas referensial dan kontrol akses dapat ditegakkan oleh database.'), Spacer(1,4), ERD(), Spacer(1,4),
          P('<b>Catatan relasi penting.</b> Akses eksplisit disimpan sebagai grant pengguna atau divisi. Untuk notulen open, grant tidak diperlukan; untuk secret, policy mengabaikan tag dan hanya mempertimbangkan peserta, pembuat, admin, serta grant eksplisit yang diizinkan.','Smallx'), PageBreak()]

story += [P('Kamus data inti','H1x'), P('Tabel berikut merangkum struktur minimal untuk implementasi MVP. Kolom audit standar <i>created_at</i> dan <i>updated_at</i> berlaku pada semua entitas transaksi kecuali jika ditentukan lain.'),
          table([['Entitas','Kolom inti','Aturan / indeks penting'],
                 ['users','id, division_id, name, email, role, is_active','UK(email); index division_id, role.'],
                 ['divisions','id, head_user_id, name, slug','UK(name), UK(slug); head nullable untuk memutus circular FK.'],
                 ['meetings','id, template_id, division_id, created_by, approved_by, title, content_json, status, confidentiality','Index (status, scheduled_at), (division_id, scheduled_at); soft delete; content_text untuk FTS.'],
                 ['meeting_participants','id, meeting_id, user_id nullable, external_name, external_email, attendance','UK(meeting_id, user_id) WHERE user_id IS NOT NULL; external peserta tervalidasi di aplikasi.'],
                 ['meeting_access_grants','id, meeting_id, user_id nullable, division_id nullable, grant_type','CHECK satu subjek; UK(meeting_id, subject).'],
                 ['meeting_tags','id, meeting_id, user_id / division_id / topic_id, position_json','CHECK tepat satu target; index meeting_id dan masing-masing FK target.'],
                 ['action_items','id, meeting_id, pic_user_id, division_id, title, due_date, status','Index (pic_user_id,status), due_date; PIC/due date nullable saat draft saja.'],
                 ['ai_summaries','id, meeting_id, scope, content_json, version, status, generated_by, approved_by','UK(meeting_id, scope, version); hasil AI selalu draft sebelum approved.'],
                 ['notifications','uuid id, recipient_user_id, meeting_id, type, data_json, read_at','Index(recipient_user_id, read_at); payload JSONB untuk query/retensi.']], [34*mm,91*mm,58*mm]), PageBreak()]

story += [P('Aturan integritas dan migrasi','H1x'),
          P('Aturan berikut wajib diterapkan melalui kombinasi migrasi database, validasi aplikasi, policy, dan pengujian otomatis.'),
          table([['ID','Aturan','Lapisan penegak'],
                 ['BR-01','Meeting dimulai sebagai draft. Hanya pembuat, notulis berwenang, atau admin yang dapat menyuntingnya.','Policy + DB enum/check'],
                 ['BR-02','Finalisasi wajib memiliki title, scheduled_at, dan seluruh action item ber-PIC serta due_date.','Service finalization + transaction'],
                 ['BR-03','Tag harus menunjuk persis satu target: user, division, atau topic.','CHECK constraint + FK'],
                 ['BR-04','Notulen secret tidak dibuka oleh tag divisi maupun tag orang.','Query scope + policy test'],
                 ['BR-05','AI hanya menerima dokumen yang lolos scope akses pengguna peminta.','AI query builder + audit'],
                 ['BR-06','AI summary tidak dapat mengubah meeting atau action item tanpa persetujuan notulis.','Workflow service'],
                 ['BR-07','Notifikasi tidak dapat dibuat tanpa recipient_user_id yang valid.','FK + queue idempotency key'],
                 ['BR-08','Setiap perubahan status meeting/action item dan setiap akses sensitif dicatat.','Audit observer + append-only table'],
                 ['BR-09','Penghapusan user tidak boleh menghapus meeting; FK created_by menggunakan RESTRICT atau SET NULL sesuai kebijakan.','FK policy'],
                 ['BR-10','Hasil pencarian, rekap, dan ekspor selalu menerapkan scope akses yang sama.','Shared visibility scope']], [14*mm,111*mm,58*mm]),
          Spacer(1,5), P('Urutan migrasi disarankan','H2x'),
          P('1. users dan divisions (FK head_user_id dibuat setelah users tersedia)  •  2. topics dan meeting_templates  •  3. meetings  •  4. participants, grants, tags, decisions, action items, attachments  •  5. ai_summaries  •  6. audit_logs dan notifications  •  7. indeks FTS/trigram dan job scheduler.'), PageBreak()]

story += [P('Matriks traceability dan UAT','H1x'), P('Matriks ini menghubungkan hasil bisnis dengan area yang perlu diuji sebelum pilot.'),
          table([['Sasaran','Fitur / proses','Skenario UAT minimum','Kriteria lulus'],
                 ['Notulen tersentralisasi','Template, editor, draft','Notulis membuat notulen dari template dan membukanya kembali.','Konten, peserta, dan metadata tersimpan sebagai draft.'],
                 ['Tindak lanjut jelas','Action item, finalisasi','Coba finalisasi dengan PIC/tenggat kosong.','Ditolak dengan pesan jelas; lolos setelah data lengkap.'],
                 ['Kerahasiaan terjaga','Policy, grants, tagging','Uji open/division/restricted/secret oleh empat peran.','Tidak ada data bocor lewat detail, search, AI, atau notifikasi.'],
                 ['AI terkendali','Resume, ekstraksi','Minta resume; koreksi dan tolak salah satu usulan.','Hasil berlabel draft dan tidak mengubah data tanpa approval.'],
                 ['Distribusi tepat','Queue, notifications','Finalkan meeting dengan peserta serta tag.','Hanya penerima berhak mendapat satu notifikasi.'],
                 ['Kepatuhan audit','Audit log','Ubah tugas, finalkan, lihat secret sebagai admin.','Aktor, aksi, objek, waktu, dan perubahan tercatat.'],
                 ['Pengingat efektif','Scheduler','Action item H-3, H-1, dan overdue.','Pengingat terkirim idempotent dan dapat ditelusuri.']], [31*mm,43*mm,65*mm,44*mm]),
          Spacer(1,7), P('Indikator pilot','H2x'),
          table([['Indikator','Target 6 bulan','Sumber data'],
                 ['Rapat resmi tercatat','>= 90%','Register meeting'],
                 ['Action item dengan PIC dan tenggat','100%','Action items final'],
                 ['Action item selesai tepat waktu','>= 80%','Status dan due_date'],
                 ['Resume AI dipakai','>= 70%','Approval summary'],
                 ['Waktu muat / pencarian','<= 2 dtk / <= 3 dtk','APM dan log pencarian']], [62*mm,44*mm,77*mm]), PageBreak()]

story += [P('Rencana implementasi dan keputusan terbuka','H1x'),
          table([['Fase','Durasi indikatif','Keluaran'],
                 ['0. Discovery','1 minggu','Kebijakan kerahasiaan, taksonomi divisi/topik, contoh notulen, definisi pilot.'],
                 ['1. MVP dan pilot','10 minggu','Editor, template, action item, tagging, AI summary, policy, notifikasi, audit.'],
                 ['2. Perluasan','7 minggu','Board tugas, pengingat, rekap, ekspor, halaman divisi/orang, hardening indeks.'],
                 ['3. Integrasi','2 minggu','SSO, kalender/chat, Q&A lintas notulen, evaluasi manfaat dan retensi.']], [37*mm,41*mm,105*mm]),
          Spacer(1,8), P('Keputusan yang perlu dikonfirmasi klien','H2x'),
          table([['No.','Pertanyaan','Dampak rancangan'],
                 ['1','Penyedia AI mana yang diizinkan dan apakah data boleh diproses di luar lingkungan perusahaan?','Menentukan provider, DPA, redaksi data, dan pengecualian secret.'],
                 ['2','Siapa yang berwenang memberi grant untuk notulen restricted dan secret?','Menentukan policy grant, UI approval, dan audit.'],
                 ['3','Apakah SSO tersedia sejak pilot atau login lokal + MFA digunakan sementara?','Memengaruhi identity provisioning dan role mapping.'],
                 ['4','Apakah peserta eksternal perlu menerima notifikasi langsung?','Memengaruhi verifikasi email, consent, dan kebijakan akses.'],
                 ['5','Berapa retensi notulen, lampiran, rekaman, audit log, dan notifikasi?','Menentukan archive, purge job, dan storage tier.'],
                 ['6','Apakah action item perlu sinkron dengan alat manajemen proyek perusahaan?','Menentukan batas integrasi fase berikutnya.']], [13*mm,83*mm,87*mm]),
          Spacer(1,12), P('Penutup','H2x'), P('Blueprint ini siap digunakan sebagai dasar discovery, backlog, desain database, SOP notulis, dan UAT. Implementasi sebaiknya dimulai setelah keputusan terbuka disepakati dan contoh data pilot tersedia.'),]

doc=SimpleDocTemplate(OUT, pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=17*mm, bottomMargin=19*mm, title='Blueprint Sistem Notulensi (MoM) Terintegrasi AI')
doc.build(story, onFirstPage=cover, onLaterPages=footer)
print(os.path.abspath(OUT))
