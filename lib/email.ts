import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("[email] RESEND_API_KEY is not set — emails will NOT be sent. Add it in Railway environment variables.");
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "AgentBay <onboarding@resend.dev>";
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
    const { error } = await resend.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html });
    if (error) {
      console.error(`[email] Resend error for "${opts.subject}" to ${opts.to}:`, error);
      return false;
    }
    console.log(`[email] Sent "${opts.subject}" to ${opts.to}`);
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${opts.subject}" to ${opts.to}:`, err instanceof Error ? err.message : err);
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
  const firstName = name ? name.split(" ")[0] : "there";
  const tweetText = encodeURIComponent(`I just joined the AgentBay waitlist — an AI that buys, sells, and negotiates for you. Join me: ${referralUrl}`);
  const waText = encodeURIComponent(`I just joined the AgentBay waitlist — an AI commerce agent that handles buying, selling, and negotiating for you. Join here: ${referralUrl}`);

  const html = emailWrapper(`
    <h1 style="font-size:30px;font-weight:800;margin:0 0 8px;color:#F8FAFC;">Welcome to AgentBay, ${firstName}! 🎉</h1>
    <p style="color:#94A3B8;font-size:16px;line-height:1.6;margin:0 0 28px;">
      You're officially on the waitlist for the AI commerce platform that buys, sells, and negotiates for you — no browsing, no listing, no back-and-forth.
    </p>

    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1));border:1px solid rgba(99,102,241,0.4);border-radius:16px;padding:28px;margin:0 0 28px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;">Your current position</p>
      <div style="font-size:64px;font-weight:900;background:linear-gradient(135deg,#6366F1,#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.1;margin:8px 0;">#${position}</div>
      <p style="margin:0;font-size:14px;color:#94A3B8;">in the waitlist — refer friends to climb higher</p>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin:0 0 28px;">
      <p style="margin:0 0 10px;font-size:13px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Your unique referral link</p>
      <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:14px 16px;margin:0 0 14px;word-break:break-all;">
        <a href="${referralUrl}" style="color:#818CF8;font-size:15px;font-weight:600;text-decoration:none;">${referralUrl}</a>
      </div>
      <p style="margin:0;font-size:14px;color:#94A3B8;">Every friend who signs up with your link moves you <strong style="color:#F8FAFC;">10 spots up</strong> the waitlist. Top 100 referrers get early access first.</p>
    </div>

    <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#F8FAFC;">Share now and start climbing:</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <a href="https://twitter.com/intent/tweet?text=${tweetText}" style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#F8FAFC;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;text-decoration:none;">𝕏 Share on X</a>
      <a href="https://wa.me/?text=${waText}" style="display:inline-block;background:rgba(37,211,102,0.1);border:1px solid rgba(37,211,102,0.3);color:#25D366;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;text-decoration:none;">WhatsApp</a>
      <a href="${APP_URL}/waitlist" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#A855F7);color:white;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;text-decoration:none;">View your dashboard →</a>
    </div>

    <div style="margin:32px 0 0;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#F8FAFC;text-transform:uppercase;letter-spacing:0.06em;">What AgentBay does for you</p>
      <div style="display:grid;gap:8px;">
        <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#94A3B8;"><span style="color:#6366F1;font-weight:700;">→</span> Finds the best deals across every marketplace</div>
        <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#94A3B8;"><span style="color:#A855F7;font-weight:700;">→</span> Writes and posts listings for things you sell</div>
        <div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#94A3B8;"><span style="color:#06B6D4;font-weight:700;">→</span> Negotiates deals 24/7 without emotion</div>
      </div>
    </div>
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
