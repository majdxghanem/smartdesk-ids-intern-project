<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ $mailSubject }}</title></head>
<body style="margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#10233e">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:36px 16px;background:#f3f6fb">
<tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,35,62,.10)">
<tr><td style="padding:28px 34px;background:#0b203a;color:#ffffff"><strong style="font-size:22px">SmartDesk</strong><div style="margin-top:4px;color:#9db4cf;font-size:12px">IT service workspace</div></td></tr>
<tr><td style="padding:34px"><div style="color:#2563eb;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">{{ str_replace('_', ' ', $smartDeskNotification->type) }}</div><h1 style="margin:10px 0 0;font-size:23px">{{ $mailSubject }}</h1><p style="margin-top:18px;line-height:1.7;color:#536780">Hello {{ $recipient->firstname }},</p><p style="line-height:1.7;color:#536780">{{ $smartDeskNotification->message }}</p>@if($smartDeskNotification->ticket)<div style="margin:20px 0;padding:15px;border-left:4px solid #2563eb;background:#f5f8fd"><strong>Ticket #{{ $smartDeskNotification->ticket->id }}</strong><div style="margin-top:5px;color:#536780">{{ $smartDeskNotification->ticket->title }}</div></div>@endif @if($actionUrl)<a href="{{ $actionUrl }}" style="display:inline-block;margin-top:8px;padding:12px 18px;border-radius:9px;background:#2563eb;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none">Open in SmartDesk</a>@endif</td></tr>
<tr><td style="padding:20px 34px;background:#f7f9fc;color:#7b8ba1;font-size:11px">You received this because this SmartDesk activity concerns your account.</td></tr>
</table></td></tr></table>
</body>
</html>
