<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SmartDesk password reset</title></head>
<body style="margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#10233e">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:36px 16px;background:#f3f6fb">
<tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,35,62,.10)">
<tr><td style="padding:28px 34px;background:#0b203a;color:#ffffff"><strong style="font-size:22px">SmartDesk</strong><div style="margin-top:4px;color:#9db4cf;font-size:12px">IT service workspace</div></td></tr>
<tr><td style="padding:34px"><h1 style="margin:0;font-size:24px">Password reset code</h1><p style="line-height:1.65;color:#536780">Hello {{ $recipient->firstname }}, use this one-time code to reset your SmartDesk password:</p><div style="margin:26px 0;padding:18px;border-radius:12px;background:#eef5ff;color:#1d4ed8;font-size:32px;font-weight:800;letter-spacing:10px;text-align:center">{{ $code }}</div><p style="line-height:1.65;color:#536780">This code expires in 10 minutes. If you did not request it, you can safely ignore this email. Never share this code with anyone.</p></td></tr>
<tr><td style="padding:20px 34px;background:#f7f9fc;color:#7b8ba1;font-size:11px">This is an automated security message from SmartDesk.</td></tr>
</table></td></tr></table>
</body>
</html>
