import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder")
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "AgentBay <hello@agentbay.ai>";
const _rawUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const APP_URL = _rawUrl.startsWith("http") ? _rawUrl : `https://${_rawUrl}`;

interface SendOptions {
  to: string;
  subject: string;
  html: string;
  type: string;
}

export async function sendEmail(opts: SendOptions): Promise<boolean> {
  if (!resend) {
    console.log(`[EMAIL] Would send "${opts.subject}" to ${opts.to}`);
    return true;
  }
  try {
    await resend.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html });
    return true;
  } catch (err) {
    console.error("[EMAIL] Failed to send:", err);
    return false;
  }
}

const baseStyle = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #07070F;
  color: #F8FAFC;
`;

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AgentBay</title></head>
<body style="${baseStyle} margin:0;padding:0;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="margin-bottom:32px;">
    <span style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#6366F1,#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">AgentBay</span>
  </div>
  ${content}
  <div style="margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#64748B;">
    <p>© 2026 AgentBay. Your AI commerce agent.</p>
    <p><a href="${APP_URL}/waitlist" style="color:#6366F1;">View your waitlist dashboard</a></p>
  </div>
</div>
</body></html>`;
}

export async function sendWelcomeEmail(to: string, name: string, referralCode: string, position: number) {
  const referralUrl = `${APP_URL}/?ref=${referralCode}`;
  const html = emailWrapper(`
    <h1 style="font-size:28px;font-weight:800;margin:0 0 16px;">You're on the list! 🎉</h1>
    <p style="color:#94A3B8;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Welcome to AgentBay, ${name || "friend"}. You're <strong style="color:#6366F1;">#${position}</strong> in line for early access to the AI commerce platform that handles buying, selling, and negotiating for you.
    </p>
    <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:24px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:13px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">Your referral link</p>
      <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#6366F1;word-break:break-all;">${referralUrl}</p>
      <p style="margin:0;font-size:14px;color:#94A3B8;">Each friend you refer moves you <strong style="color:#F8FAFC;">10 spots</strong> up the waitlist.</p>
    </div>
    <a href="${referralUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#A855F7);color:white;font-weight:700;font-size:16px;padding:14px 28px;border-radius:10px;text-decoration:none;">Share Your Link →</a>
    <p style="margin:24px 0 0;font-size:14px;color:#64748B;">The more friends you invite, the faster you move up. Top referrers get priority access when we launch.</p>
  `);

  return sendEmail({ to, subject: `You're #${position} on the AgentBay waitlist 🚀`, html, type: "welcome" });
}

export async function sendMilestoneEmail(to: string, name: string, milestone: string, position: number, referralCode: string) {
  const referralUrl = `${APP_URL}/?ref=${referralCode}`;
  const milestoneMessages: Record<string, string> = {
    "top_100": "You've cracked the top 100! 🏆",
    "top_50": "Top 50! You're flying up the list! 🚀",
    "top_10": "TOP 10! You're almost there! 🔥",
    "first_referral": "First referral! Keep going! 🎯",
    "five_referrals": "5 referrals! You're on fire! 💪",
    "ten_referrals": "10 referrals! You're a legend! 🌟",
  };

  const message = milestoneMessages[milestone] || "New milestone achieved!";
  const html = emailWrapper(`
    <h1 style="font-size:28px;font-weight:800;margin:0 0 16px;">${message}</h1>
    <p style="color:#94A3B8;font-size:16px;line-height:1.6;margin:0 0 24px;">
      ${name || "You"}, you're now <strong style="color:#6366F1;">#${position}</strong> on the AgentBay waitlist. Keep sharing to climb higher!
    </p>
    <a href="${referralUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#A855F7);color:white;font-weight:700;font-size:16px;padding:14px 28px;border-radius:10px;text-decoration:none;">Share & Climb Higher →</a>
  `);

  return sendEmail({ to, subject: message, html, type: "milestone" });
}

export async function sendDailyRankingEmail(to: string, name: string, position: number, referralCount: number, referralCode: string, topUsers: Array<{ name: string | null; referralCount: number; position: number }>) {
  const referralUrl = `${APP_URL}/?ref=${referralCode}`;
  const leaderboardRows = topUsers.slice(0, 5).map((u, i) => `
    <tr>
      <td style="padding:8px 12px;color:#94A3B8;">#${i + 1}</td>
      <td style="padding:8px 12px;color:#F8FAFC;font-weight:600;">${u.name || "Anonymous"}</td>
      <td style="padding:8px 12px;color:#6366F1;font-weight:700;">${u.referralCount} referrals</td>
    </tr>
  `).join("");

  const html = emailWrapper(`
    <h1 style="font-size:24px;font-weight:800;margin:0 0 8px;">Your daily ranking update 📊</h1>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">Here's where you stand today</p>
    <div style="display:flex;gap:16px;margin:0 0 24px;">
      <div style="flex:1;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:32px;font-weight:800;color:#6366F1;">#${position}</div>
        <div style="font-size:12px;color:#94A3B8;margin-top:4px;">Your rank</div>
      </div>
      <div style="flex:1;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:32px;font-weight:800;color:#A855F7;">${referralCount}</div>
        <div style="font-size:12px;color:#94A3B8;margin-top:4px;">Referrals</div>
      </div>
    </div>
    <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#F8FAFC;">Top referrers today</h2>
    <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.03);border-radius:8px;overflow:hidden;">
      ${leaderboardRows}
    </table>
    <div style="margin-top:24px;">
      <a href="${referralUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#A855F7);color:white;font-weight:700;font-size:15px;padding:12px 24px;border-radius:10px;text-decoration:none;">Share Your Link & Climb →</a>
    </div>
  `);

  return sendEmail({ to, subject: `You're #${position} on AgentBay — daily update`, html, type: "daily_ranking" });
}

export async function sendWeeklySummaryEmail(to: string, name: string, position: number, referralCount: number, totalSignups: number, referralCode: string) {
  const referralUrl = `${APP_URL}/?ref=${referralCode}`;
  const html = emailWrapper(`
    <h1 style="font-size:24px;font-weight:800;margin:0 0 8px;">Weekly waitlist report 📈</h1>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">Here's how AgentBay is growing</p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin:0 0 24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;">Your stats this week</p>
      <p style="margin:0 0 8px;"><span style="color:#F8FAFC;font-weight:600;">Your rank:</span> <span style="color:#6366F1;font-weight:800;">#${position}</span></p>
      <p style="margin:0 0 8px;"><span style="color:#F8FAFC;font-weight:600;">Your referrals:</span> <span style="color:#A855F7;font-weight:800;">${referralCount}</span></p>
      <p style="margin:0;"><span style="color:#F8FAFC;font-weight:600;">Total on waitlist:</span> <span style="color:#06B6D4;font-weight:800;">${totalSignups.toLocaleString()}</span></p>
    </div>
    <p style="color:#94A3B8;font-size:15px;line-height:1.6;margin:0 0 24px;">
      The waitlist is growing fast. Refer more friends now to secure your spot before we launch.
    </p>
    <a href="${referralUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#A855F7);color:white;font-weight:700;font-size:16px;padding:14px 28px;border-radius:10px;text-decoration:none;">Share Your Link →</a>
  `);

  return sendEmail({ to, subject: `Weekly AgentBay update — you're #${position}`, html, type: "weekly_summary" });
}
