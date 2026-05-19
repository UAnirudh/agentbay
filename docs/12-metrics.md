# 12 — Success Metrics: Clear KPIs

## North Star Metric

**Agent-Facilitated GMV** — the total dollar value of transactions where the agent played a meaningful role (generated the listing, negotiated, or initiated the purchase).

This is the north star because it captures both the core value (commerce happening) and the agent's contribution (it's not just a listing directory). A healthy AgentBay has high GMV and high agent participation in that GMV.

---

## Tier 1: Business Metrics (Board/Investor Level)

| Metric | Definition | Target (Y1) | Target (Y2) |
|---|---|---|---|
| **GMV** | Total transaction value on platform | $10M | $120M |
| **Net Revenue** | Total revenue after Stripe fees | $1.2M | $25M |
| **MAU** | Monthly active users (any action in 30 days) | 100K | 2M |
| **Transacting Users** | Users who complete ≥1 transaction/month | 20K | 400K |
| **Gross Margin** | Revenue minus direct COGS (hosting, AI inference, payment) | 70% | 80% |

---

## Tier 2: Product Metrics (PM/Engineering Level)

### Seller Metrics

| Metric | Definition | Target |
|---|---|---|
| **Listing Creation Time** | Time from photo capture to listing posted | < 3 minutes |
| **Listing Quality Score** | Composite: completeness, accuracy, photo quality (0–100) | > 80 average |
| **Time-to-First-Offer** | Hours from listing created to first offer received | < 48 hours |
| **Time-to-Sale** | Days from listing created to transaction completed | < 14 days |
| **Seller Revenue Lift** | Final sale price vs. what comparable manual sellers achieve | +15% vs. baseline |
| **Listing Acceptance Rate** | % of AI-generated listings posted without major edits | > 80% |
| **Price Accuracy** | % of recommendations within 15% of final sale price | > 80% |
| **Seller Retention (D30)** | % of sellers who list again within 30 days of first sale | > 40% |

### Buyer Metrics

| Metric | Definition | Target |
|---|---|---|
| **Search-to-Offer Rate** | % of buyer searches that result in an offer | > 35% |
| **Offer-to-Purchase Rate** | % of agent-sourced offers the buyer accepts | > 60% |
| **Buyer Savings Rate** | Average % discount from asking price | > 10% |
| **Search Result Satisfaction** | % of searches where buyer selects from top-3 results | > 70% |
| **Time Saved Per Transaction** | Estimated time saved vs. manual browsing/negotiating | > 45 min |
| **Buyer Retention (D30)** | % of buyers who make a second purchase within 30 days | > 25% |

### Agent Metrics

| Metric | Definition | Target |
|---|---|---|
| **Agent Autonomy Rate** | % of transactions completed without user intervention | > 60% by Y1 end |
| **Negotiation Success Rate** | % of negotiations that result in a deal | > 65% |
| **Negotiation Efficiency** | Average rounds to close (lower = better) | < 3 rounds |
| **Agent Error Rate** | % of agent actions that require user correction | < 5% |
| **LLM Listing Accuracy** | % of AI listings with no factual errors (audited sample) | > 95% |

---

## Tier 3: Safety & Trust Metrics

| Metric | Definition | Target |
|---|---|---|
| **Fraud Rate** | % of transactions with confirmed fraud | < 0.1% |
| **Scam Attempt Block Rate** | % of scam attempts detected and blocked before harm | > 85% |
| **Dispute Rate** | % of transactions that result in a dispute | < 2% |
| **Dispute Resolution Rate** | % of disputes resolved satisfactorily to both parties | > 80% |
| **Dispute Resolution Time** | Hours to resolve (automated + human) | < 48 hours |
| **Trust Score Accuracy** | Correlation between trust score and actual user behavior | > 0.75 |

---

## Tier 4: User Experience Metrics

| Metric | Definition | Target |
|---|---|---|
| **Net Promoter Score (NPS)** | Likelihood to recommend (0–100) | > 65 |
| **App Store Rating** | Average rating iOS + Android | > 4.5 stars |
| **Listing Creation Drop Rate** | % of users who start but don't complete a listing | < 20% |
| **First Transaction Success Rate** | % of new users who complete a transaction within 7 days | > 30% |
| **Support Ticket Volume** | Tickets per 1,000 transactions | < 15 |
| **Support Satisfaction (CSAT)** | User rating of support interactions | > 85% |

---

## Measurement Infrastructure

### Data Collection
- **Event tracking**: Mixpanel (user behavior), with custom events for all agent actions
- **Server-side analytics**: BigQuery (all transaction and agent log data)
- **Error tracking**: Sentry (frontend + backend)
- **User session recording**: FullStory (qualitative UX insight)

### Dashboards
- **Executive Dashboard** (weekly): GMV, revenue, MAU, NPS
- **Product Dashboard** (daily): Listing volume, agent autonomy rate, search satisfaction
- **Safety Dashboard** (real-time): Fraud rate, active disputes, flagged accounts
- **Agent Performance Dashboard** (daily): Per-model accuracy, negotiation outcomes, error rate

### Alerting
| Alert | Threshold | Action |
|---|---|---|
| Fraud rate spike | > 0.3% in any 4-hour window | Page on-call, auto-slow new registrations |
| Agent error rate | > 10% in any 1-hour window | Roll back model, page ML team |
| Payment failure rate | > 5% in any 1-hour window | Page infrastructure, notify Stripe |
| NPS drop | 7-day rolling NPS drops > 10 points | Emergency user research call |

---

## Qualitative Success Indicators

Beyond metrics, we measure success through user stories. We track these through:
- Monthly user interviews (20+ users across personas)
- Support ticket sentiment analysis
- App store review analysis (NLP-powered)

**Green flags** (signals we're winning):
- "I didn't even know it sold until the money showed up"
- "I finally cleared my basement"
- "I got a better deal than I would have negotiated myself"
- Users referring family members ("my mom uses it now")

**Red flags** (signals we're failing):
- "I don't trust the price it set"
- "I had to edit everything the agent wrote"
- "The buyer tried to scam me and nothing happened"
- "I don't understand what my agent is doing"
