export interface FraudSignals {
  score: number;
  flags: string[];
  action: "ALLOW" | "WARN" | "REVIEW" | "BLOCK";
}

export function detectListingFraud(params: {
  askingPrice: number;
  marketEstimate?: number;
  title: string;
  description: string;
  accountAgeDays: number;
  sellerListingCount: number;
}): FraudSignals {
  const { askingPrice, marketEstimate, title, description, accountAgeDays, sellerListingCount } =
    params;

  let score = 0;
  const flags: string[] = [];

  // Price anomaly
  if (marketEstimate && askingPrice < marketEstimate * 0.3) {
    score += 50;
    flags.push("Price far below market value — possible scam bait");
  }

  // New account with many listings
  if (accountAgeDays < 7 && sellerListingCount > 10) {
    score += 40;
    flags.push("New account with high listing volume");
  }

  // Scam keywords in description
  const scamPatterns = [
    /wire\s*transfer/i,
    /western\s*union/i,
    /gift\s*card/i,
    /send\s*money/i,
    /zelle.*outside/i,
    /venmo.*outside/i,
    /contact.*email.*directly/i,
    /text\s*me\s*at/i,
    /whatsapp\s*me/i,
  ];
  for (const pattern of scamPatterns) {
    if (pattern.test(description) || pattern.test(title)) {
      score += 60;
      flags.push("Suspicious keyword detected in listing");
      break;
    }
  }

  // Too-good-to-be-true language
  if (/\b(100%|brand\s*new|never\s*used|sealed)\b/i.test(description) && askingPrice < 50) {
    score += 20;
    flags.push("Suspicious condition claims for low-price item");
  }

  let action: FraudSignals["action"] = "ALLOW";
  if (score >= 90) action = "BLOCK";
  else if (score >= 60) action = "REVIEW";
  else if (score >= 30) action = "WARN";

  return { score, flags, action };
}

export function detectMessageFraud(message: string): { suspicious: boolean; reason?: string } {
  const patterns = [
    { pattern: /wire\s*transfer/i, reason: "Request for wire transfer — common scam method" },
    { pattern: /western\s*union/i, reason: "Request for Western Union — common scam method" },
    { pattern: /gift\s*card/i, reason: "Request for gift card payment — scam red flag" },
    { pattern: /pay\s*outside/i, reason: "Request to pay outside platform — loses buyer protection" },
    { pattern: /my\s*shipping\s*company/i, reason: "Fake shipping company scam pattern" },
    { pattern: /overpay.{0,30}send\s*back/i, reason: "Overpayment scam pattern detected" },
  ];

  for (const { pattern, reason } of patterns) {
    if (pattern.test(message)) {
      return { suspicious: true, reason };
    }
  }

  return { suspicious: false };
}
