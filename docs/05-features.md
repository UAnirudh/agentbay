# 05 — Feature Specification: MVP → Phase 2 → Future Vision

## MVP (Months 1–6)

### F-001: Seller Agent — Listing Generation

**Description**: AI-powered listing creation from photo or voice input.

**Inputs**:
- 1–6 photos (JPEG/PNG/HEIC, up to 10MB each)
- Optional voice description (up to 60 seconds)
- Optional text description

**Outputs**:
- Product title (60 char max)
- Description (500–1500 chars)
- Suggested price with rationale
- Category and subcategory tags
- Condition classification (New / Like New / Good / Fair / Poor)
- Enhanced photos (auto-cropped, brightness-corrected)

**Acceptance Criteria**:
- Item identified correctly for 90%+ of common consumer goods
- Listing generated in < 15 seconds
- Price within 15% of 30-day market median 90% of the time
- User editing time < 2 minutes on average (versus 45 min baseline)

**Technical Components**:
- Vision model: GPT-4o Vision or Claude 3.5 with vision
- Product database: 30M+ SKUs from Open Product Data, GS1, manufacturer data
- Pricing API: aggregated from eBay sold listings, Mercari, AgentBay internal

---

### F-002: Seller Agent — Pricing Engine

**Description**: Dynamic price recommendation based on real-time market data.

**Inputs**: Product ID, condition, location, user's floor price preference

**Outputs**:
- Recommended price
- Fast-sell price (25th percentile)
- Premium price (75th percentile)
- Confidence score
- Comparable sold items (last 30 days)

**Acceptance Criteria**:
- Recommendations update daily from market data
- User can override any recommendation
- Comparable items shown with source links

---

### F-003: Buyer Agent — Natural Language Search

**Description**: Accept buyer intent in natural language and return ranked listings.

**Inputs**: Natural language query (text or voice)

**Processing**:
1. Intent extraction (category, budget, condition, location preference)
2. Semantic search over listing embeddings (Pinecone/pgvector)
3. Ranking by composite score
4. Result presentation in natural language

**Acceptance Criteria**:
- Intent extracted correctly for 95%+ of queries
- Results returned in < 3 seconds
- Top result is "right" (user selects within top 3) 75%+ of the time

---

### F-004: Agent-to-Agent Negotiation Protocol (A2ANP)

**Description**: Structured machine-readable protocol for agents to negotiate prices and terms.

**Protocol Specification**:

```json
// Message structure for A2ANP
{
  "protocol": "A2ANP/1.0",
  "transaction_id": "uuid",
  "from_agent": "seller_agent_id",
  "to_agent": "buyer_agent_id",
  "listing_id": "listing_uuid",
  "message_type": "OFFER | COUNTER | ACCEPT | DECLINE | WITHDRAW",
  "payload": {
    "price": 168.00,
    "currency": "USD",
    "terms": {
      "fulfillment": "local_pickup | shipping",
      "condition_guarantee": true,
      "return_window_days": 3
    },
    "expires_at": "ISO8601_timestamp",
    "round": 2,
    "message": "Optional human-readable note"
  },
  "signature": "agent_cryptographic_signature"
}
```

**Constraints**:
- Maximum 4 negotiation rounds
- 30-minute expiry per round
- All messages logged immutably
- Agents cannot accept below floor price
- Agents cannot offer above budget ceiling

---

### F-005: Fraud Detection System

**Description**: Multi-layer fraud detection protecting buyers and sellers.

**Detection Layers**:

1. **Account-level signals**
   - New account (< 7 days) + high-value listing
   - Mismatched identity signals
   - VPN/proxy usage on account creation
   - Velocity: too many listings too fast

2. **Listing-level signals**
   - Price anomalies (far below market → possible scam bait)
   - Duplicate/stolen photos (reverse image search)
   - Keyword patterns matching known scams
   - Category/price mismatch

3. **Transaction-level signals**
   - Requests to pay outside platform
   - Requests for unusual payment methods
   - Abnormal negotiation patterns
   - Buyer/seller in same session (self-dealing)

**Actions**:
- Score 0–100 (higher = more suspicious)
- Score > 40: Warning shown to counterparty
- Score > 70: Manual review before transaction
- Score > 90: Automatic block + account flag

---

### F-006: Payment & Escrow System

**Description**: Secure payment processing with escrow protection.

**Flow**:
1. Buyer submits payment (Stripe)
2. Funds held in escrow (Stripe Connect, platform as intermediary)
3. Seller fulfills order
4. Buyer confirms receipt OR 48-hour auto-release
5. Funds released to seller (minus platform fee)

**Supported Payment Methods**:
- Credit/debit cards (Visa, MC, Amex, Discover)
- Apple Pay, Google Pay
- ACH bank transfer (lower fees, 3-day settlement)

**Payout Options**:
- Direct bank transfer (standard: 2 business days)
- Instant payout (Stripe Instant, 1.5% fee, immediate)

**Platform Fee**: 8% of transaction, deducted at payout

---

### F-007: User Dashboards

**Seller Dashboard Features**:
- Active listings with view/offer counts
- Pending offers and negotiation status
- Sold items with earnings history
- Payout summary and withdrawal controls
- Agent settings (autonomy level, floor prices, preferences)

**Buyer Dashboard Features**:
- Active searches and standing requests
- Offers in progress (negotiation status)
- Purchases history with tracking
- Saved searches (auto-alerts)
- Agent settings (budget limits, preferences)

---

## Phase 2 (Months 7–12)

### F-008: Cross-Platform Search

**Description**: Buyer agent searches AgentBay + external platforms.

**Supported External Sources**:
- eBay (API)
- Amazon (product listings for price comparison)
- Craigslist (scraper with rate limiting)
- Facebook Marketplace (limited scraper, user-authorized)
- Mercari (API)

**Normalization Layer**: All results mapped to AgentBay's canonical listing schema before ranking and presentation.

**Legal Note**: All scraping governed by robots.txt compliance and platform ToS review. API integrations preferred.

---

### F-009: Shipping Automation

**Description**: End-to-end shipping logistics handled by platform.

**Features**:
- Auto-generate prepaid shipping labels (USPS, UPS, FedEx, DHL)
- Weight/dimension estimation from product database
- Real-time rate comparison across carriers
- Automated tracking updates sent to buyer
- Return label generation for disputes

**Integration**: EasyPost API (multi-carrier aggregation)

---

### F-010: Dispute Resolution Agent

**Description**: AI-mediated dispute handling for transaction problems.

**Triggers**:
- Buyer reports item "not as described"
- Item not received after expected delivery date
- Payment not released after confirmed delivery

**Process**:
1. Both parties submit their account (text + photos)
2. Dispute Agent analyzes evidence
3. Compares listing claims vs. reported condition
4. Proposes resolution: full refund / partial refund / no action
5. Both parties accept or escalate to human review

**Resolution SLA**: 72 hours for automated resolution

---

### F-011: Seller Analytics Dashboard

**Description**: Performance insights for active sellers.

**Metrics**:
- Listing conversion rate (views → offers → sales)
- Average price vs. market price achieved
- Time-to-sale by category
- Repeat buyer rate
- Agent performance summary

**Visualizations**: Time-series charts, category breakdowns, peer benchmarks (anonymized)

---

## Future Vision (Year 2+)

### F-012: Fully Autonomous Commerce Mode

Users grant agents authority to complete purchases and sales within defined parameters with zero human intervention. Agent handles everything end-to-end. User reviews a weekly summary.

Use case: Recurring buyers (Keisha's Air Jordan alerts), bulk sellers (estate clearouts), business sellers.

---

### F-013: Real-Time Negotiation Tournaments

Multiple buyer agents compete simultaneously for a single listing. Seller agent runs a sealed-bid auction among the top 5 interested buyers. Highest qualifying bid wins. Transparent to all parties.

---

### F-014: Physical Store Integration

AgentBay API available to physical thrift stores, pawn shops, and consignment stores. Store employees scan items; AgentBay agent generates pricing and handles online sales. Store gets 60% of sale price.

---

### F-015: AI-Enhanced Product Photography

Computer vision model that:
- Detects optimal shot angles for each category
- Guides users through photo session in real time
- Removes backgrounds, fixes lighting
- Flags damage before the buyer sees it (transparency feature)

---

### F-016: Universal Shopping Agent

Buyer agent extended to shop across all e-commerce:
- New goods (Amazon, Walmart, Target)
- Resale (AgentBay, eBay, Mercari)
- Rentals (Fat Llama, RentACenter)
- Subscriptions (subscription boxes, services)

Becomes the user's single shopping interface for all commerce.

---

### F-017: AgentBay Business API

B2B API allowing:
- Liquidators to list bulk inventory via API
- Insurance companies to resell recovered items
- Retailers to list open-box/returned items
- Corporate asset managers to dispose of IT equipment

Pricing: Tiered API access fee + reduced transaction fee (4–5%)
