<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kode verifikasi Suara Karyawan</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f1e8; color:#111a31; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f1e8;">
        <tr>
            <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px; background-color:#ffffff; border:1px solid #d7dfed; border-radius:20px; overflow:hidden;">
                    <tr>
                        <td style="padding:28px 32px 24px; background-color:#111a31;">
                            <p style="margin:0; color:#ffe200; font-size:12px; font-weight:700; letter-spacing:1.6px;">SUARA KARYAWAN</p>
                            <h1 style="margin:14px 0 0; color:#ffffff; font-family:Georgia, 'Times New Roman', serif; font-size:30px; line-height:1.2;">Verifikasi email Anda</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px 32px 32px;">
                            <p style="margin:0; color:#293650; font-size:16px; line-height:1.6;">Halo {{ $firstName }}, gunakan kode berikut untuk mengaktifkan akun Anda.</p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0;">
                                <tr>
                                    <td align="center" style="padding:24px 12px; border:1px solid #ffe200; border-radius:14px; background-color:#fffdf0; color:#111a31; font-family:Arial, Helvetica, sans-serif; font-size:38px; font-weight:700; letter-spacing:9px; line-height:1;">
                                        {{ $code }}
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0; color:#52627e; font-size:14px; line-height:1.6;">Kode berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
