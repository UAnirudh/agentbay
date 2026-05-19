# 06 — System Architecture: Full Technical Blueprint

## Architecture Overview

AgentBay is built as a **microservices platform** on Google Cloud Platform (GCP), using an event-driven architecture with Apache Kafka as the message bus. All agent workloads are stateless and horizontally scalable.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  React Native Mobile App     Next.js Web App     Partner API        │
└──────────────┬───────────────────────┬───────────────────┬──────────┘
               │                       │                   │
               ▼                       ▼                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Kong)                            │
│  Rate limiting · Auth (JWT) · Request routing · TLS termination     │
└──────────────┬───────────────────────────────────────────────────────┘
               │
     ┌─────────┴──────────────────────────────────────────┐
     │              CORE MICROSERVICES                     │
     │                                                     │
     │  ┌────────────┐  ┌────────────┐  ┌─────────────┐   │
     │  │ User       │  │ Listing    │  │ Search      │   │
     │  │ Service    │  │ Service    │  │ Service     │   │
     │  └────────────┘  └────────────┘  └─────────────┘   │
     │                                                     │
     │  ┌────────────┐  ┌────────────┐  ┌─────────────┐   │
     │  │ Agent      │  │ Negotiation│  │ Payment     │   │
     │  │ Service    │  │ Service    │  │ Service     │   │
     │  └────────────┘  └────────────┘  └─────────────┘   │
     │                                                     │
     │  ┌────────────┐  ┌────────────┐  ┌─────────────┐   │
     │  │ Fraud      │  │ Identity   │  │ Notification│   │
     │  │ Service    │  │ Service    │  │ Service     │   │
     │  └────────────┘  └────────────┘  └─────────────┘   │
     └──────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────────┐
│                    EVENT BUS (Apache Kafka)                        │
│  Topics: listing.created · offer.made · deal.closed · fraud.alert │
└───────────────────────────┬───────────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────────┐
│                     DATA LAYER                                     │
│  PostgreSQL (primary)  ·  Redis (cache)  ·  Pinecone (vectors)   │
│  Elasticsearch (search) ·  GCS (media)  ·  BigQuery (analytics)  │
└───────────────────────────────────────────────────────────────────┘
```

---

## Microservice Specifications

### 1. User Service

**Responsibility**: User registration, authentication, profile management, preferences.

**Endpoints**:
```
POST /users                  Create account
POST /auth/login             Email/password login
POST /auth/oauth             OAuth (Google, Apple)
GET  /users/:id              Get user profile
PUT  /users/:id/preferences  Update agent preferences
GET  /users/:id/stats        Get transaction statistics
```

**Database**: PostgreSQL — `users` table

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    identity_level  SMALLINT DEFAULT 0,       -- 0=email, 1=phone, 2=ID verified
    trust_score     DECIMAL(3,2) DEFAULT 3.00, -- 1.00 - 5.00
    agent_config    JSONB DEFAULT '{}',
    stripe_id       VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id          UUID PRIMARY KEY,
    user_id     UUID REFERENCES users(id),
    token_hash  VARCHAR(64),
    device_id   VARCHAR(100),
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. Listing Service

**Responsibility**: CRUD for listings, photo management, listing lifecycle.

**Endpoints**:
```
POST /listings               Create listing (triggers agent pipeline)
GET  /listings/:id           Get listing details
PUT  /listings/:id           Update listing
DELETE /listings/:id         Remove listing
POST /listings/:id/photos    Add photos
GET  /listings/:id/offers    Get all offers for a listing
PATCH /listings/:id/status   Update status (active/paused/sold)
```

**Database Schema**:

```sql
CREATE TABLE listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id       UUID REFERENCES users(id),
    title           VARCHAR(120) NOT NULL,
    description     TEXT,
    product_id      VARCHAR(100),          -- matches product database
    category        VARCHAR(50),
    subcategory     VARCHAR(50),
    condition       SMALLINT,              -- 1=New, 2=LikeNew, 3=Good, 4=Fair, 5=Poor
    asking_price    DECIMAL(10,2),
    floor_price     DECIMAL(10,2),         -- seller's minimum (private)
    auto_accept_threshold DECIMAL(10,2),   -- above this: auto-accept
    status          VARCHAR(20) DEFAULT 'active',
    location_lat    DECIMAL(9,6),
    location_lng    DECIMAL(9,6),
    location_city   VARCHAR(100),
    fulfillment     VARCHAR(20)[],         -- ['shipping', 'local_pickup']
    view_count      INTEGER DEFAULT 0,
    fraud_score     SMALLINT DEFAULT 0,
    ai_generated    BOOLEAN DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '60 days'
);

CREATE TABLE listing_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  UUID REFERENCES listings(id),
    url         TEXT NOT NULL,
    is_hero     BOOLEAN DEFAULT FALSE,
    order_idx   SMALLINT,
    gcs_path    TEXT
);

-- Vector embeddings stored in Pinecone (external), indexed by listing_id
-- Schema for Pinecone vector: {id: listing_id, values: float[1536], metadata: {title, category, price, condition}}
```

---

### 3. Agent Service

**Responsibility**: Orchestrates AI agent actions for both buyers and sellers.

**Architecture**: Stateless agent runner backed by LLM API. State persisted in PostgreSQL + Redis.

**Endpoints**:
```
POST /agents/seller/generate-listing    Start listing generation pipeline
POST /agents/buyer/search               Initiate buyer search
POST /agents/buyer/negotiate            Start negotiation on buyer's behalf
GET  /agents/:user_id/history           Agent action history
PUT  /agents/:user_id/config            Update agent config (autonomy level, limits)
```

**Agent Config Schema**:
```json
{
  "autonomy_level": 2,
  "seller": {
    "auto_accept_above_percent": 95,
    "auto_decline_below_percent": 80,
    "max_rounds": 4,
    "preferred_fulfillment": ["local_pickup", "shipping"]
  },
  "buyer": {
    "max_budget_ceiling": 500,
    "condition_minimum": "good",
    "max_distance_miles": 25,
    "preferred_categories": ["electronics", "furniture"],
    "standing_searches": [...]
  },
  "notifications": {
    "offer_received": true,
    "deal_closed": true,
    "price_drop": true,
    "weekly_summary": true
  }
}
```

**LLM Integration**:
- Primary model: Claude Sonnet 4.6 (complex reasoning, listing generation, negotiation strategy)
- High-volume model: Claude Haiku 4.5 (FAQ answering, simple categorization)
- Vision model: Claude Sonnet 4.6 with vision (item identification from photos)

**Agent Tool Set** (via Anthropic tool use):
```python
tools = [
    {
        "name": "search_product_database",
        "description": "Look up product info by description or image analysis",
        "input_schema": {"query": "str", "confidence_threshold": "float"}
    },
    {
        "name": "get_market_price",
        "description": "Get current market price data for a product",
        "input_schema": {"product_id": "str", "condition": "str", "location": "str"}
    },
    {
        "name": "search_listings",
        "description": "Search available listings by semantic query and filters",
        "input_schema": {"query": "str", "filters": "object", "limit": "int"}
    },
    {
        "name": "send_negotiation_message",
        "description": "Send a negotiation message to another agent",
        "input_schema": {"transaction_id": "str", "message_type": "str", "price": "float", "terms": "object"}
    },
    {
        "name": "flag_fraud_suspicion",
        "description": "Flag a listing or user for fraud review",
        "input_schema": {"target_id": "str", "reason": "str", "evidence": "object"}
    }
]
```

---

### 4. Negotiation Service

**Responsibility**: Manages A2ANP sessions, enforces protocol rules, logs all messages.

**Database Schema**:

```sql
CREATE TABLE negotiations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID REFERENCES listings(id),
    buyer_id        UUID REFERENCES users(id),
    seller_id       UUID REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'active',
    final_price     DECIMAL(10,2),
    final_terms     JSONB,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE negotiation_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id  UUID REFERENCES negotiations(id),
    from_role       VARCHAR(10),           -- 'buyer' or 'seller'
    message_type    VARCHAR(20),           -- OFFER, COUNTER, ACCEPT, DECLINE
    price           DECIMAL(10,2),
    terms           JSONB,
    agent_reasoning TEXT,                  -- stored for transparency/audit
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Protocol Enforcement**:
- Max rounds: enforced server-side (not by agents)
- Floor price validation: server verifies offer ≥ seller's floor before relaying
- Ceiling validation: server verifies offer ≤ buyer's ceiling
- Expiry enforcement: round timeouts trigger automatic decline

---

### 5. Search & Ranking Service

**Architecture**: Elasticsearch for full-text + Pinecone for semantic vector search. Hybrid retrieval with re-ranking.

**Search Pipeline**:
```
Query → Intent Extraction → Keyword Search + Vector Search (parallel)
     → Merge & Deduplicate → Scoring Model → Re-ranking → Return top N
```

**Elasticsearch Index Mapping**:
```json
{
  "mappings": {
    "properties": {
      "listing_id": {"type": "keyword"},
      "title": {"type": "text", "analyzer": "english"},
      "description": {"type": "text", "analyzer": "english"},
      "category": {"type": "keyword"},
      "condition": {"type": "integer"},
      "price": {"type": "float"},
      "location": {"type": "geo_point"},
      "seller_trust_score": {"type": "float"},
      "created_at": {"type": "date"},
      "status": {"type": "keyword"}
    }
  }
}
```

**Ranking Score Formula**:
```
score = w1 * price_score
      + w2 * condition_score
      + w3 * seller_trust_score
      + w4 * proximity_score
      + w5 * listing_quality_score
      + w6 * freshness_score

Where weights [w1..w6] are tuned per user based on their preference history
```

---

### 6. Fraud Detection Service

**Architecture**: Two-stage system — real-time rules engine + async ML model scoring.

**Real-Time Rules** (< 50ms, Redis-based):
```python
RULES = [
    {"name": "new_account_high_value", "condition": "account_age_days < 7 AND listing_price > 500", "score": 40},
    {"name": "price_too_low", "condition": "listing_price < market_price * 0.3", "score": 50},
    {"name": "duplicate_photos", "condition": "reverse_image_search_hits > 0", "score": 60},
    {"name": "scam_keywords", "condition": "description MATCHES scam_pattern_list", "score": 70},
    {"name": "payment_redirect", "condition": "message CONTAINS external_payment_keywords", "score": 90},
]
```

**ML Model** (async, runs within 5s):
- XGBoost classifier trained on labeled fraud cases
- Features: account signals, listing signals, behavioral signals
- Output: fraud probability 0.0–1.0

**Action Matrix**:
| Score | Action |
|---|---|
| 0–29 | Allow, no action |
| 30–49 | Log, show "Be Careful" tip to counterparty |
| 50–69 | Require manual listing review, warn counterparty |
| 70–89 | Block transaction, manual account review |
| 90–100 | Instant block, account suspension, escalate |

---

### 7. Payment & Escrow Service

**Provider**: Stripe Connect (marketplace model)

**Flow**:
```
Buyer pays → Stripe PaymentIntent (platform account)
           → Funds held in Stripe escrow
           → Delivery confirmed
           → Stripe Transfer to seller's connected account (minus fee)
```

**Database**:
```sql
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id      UUID REFERENCES negotiations(id),
    buyer_id            UUID REFERENCES users(id),
    seller_id           UUID REFERENCES users(id),
    amount              DECIMAL(10,2),
    platform_fee        DECIMAL(10,2),
    seller_payout       DECIMAL(10,2),
    currency            CHAR(3) DEFAULT 'USD',
    stripe_payment_id   VARCHAR(100),
    stripe_transfer_id  VARCHAR(100),
    status              VARCHAR(30) DEFAULT 'pending',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);
```

---

### 8. Identity & Trust Layer

**Verification Levels**:
- Level 0: Email verified (all users)
- Level 1: Phone number verified (SMS OTP)
- Level 2: Government ID verified (Stripe Identity API)
- Level 3: Social verification (linked to verified social account)

**Trust Score Algorithm**:
```
trust_score = BASE (3.0)
            + (completed_transactions * 0.02)      -- up to +0.8
            + (avg_buyer_rating - 3.0) * 0.1       -- ±0.2
            + (avg_seller_rating - 3.0) * 0.1      -- ±0.2
            + identity_level_bonus                  -- 0 / 0.1 / 0.2 / 0.3
            - (disputes_lost * 0.3)                 -- penalty
            - (fraud_flags * 0.5)                   -- penalty

Clamped to range: [1.0, 5.0]
```

---

## Event-Driven Architecture

### Kafka Topics

| Topic | Producers | Consumers | Retention |
|---|---|---|---|
| `listing.created` | Listing Service | Agent Service, Fraud Service, Search Service | 7 days |
| `listing.updated` | Listing Service | Search Service (re-index) | 7 days |
| `offer.made` | Negotiation Service | Notification Service, Agent Service | 30 days |
| `deal.closed` | Negotiation Service | Payment Service, Analytics, Trust Service | 90 days |
| `payment.completed` | Payment Service | Notification Service, Fulfillment | 90 days |
| `fraud.alert` | Fraud Service | Moderation team, Notification Service | 180 days |
| `dispute.opened` | Dispute Service | Agent Service, Notification | 180 days |

---

## Scaling Strategy

### Traffic Projections
- Year 1: 100K MAU, 500K listings, 50K transactions/month
- Year 2: 2M MAU, 10M listings, 1M transactions/month
- Year 3: 20M MAU, 100M listings, 10M transactions/month

### Scaling Approach

**Agent Service** (LLM-heavy):
- Stateless pods on GKE, auto-scaled by queue depth
- LLM calls: async via job queue (Bull/Redis), not synchronous
- Model inference: Anthropic API (no self-hosting in Year 1)
- Caching: prompt + response cache in Redis for identical queries (30-min TTL)

**Search Service**:
- Elasticsearch cluster: 3-node initially, scale horizontally
- Pinecone: managed scaling, no ops burden
- Read replicas for search; primary for writes

**Database**:
- PostgreSQL: read replicas for high-read services (listings, search)
- PgBouncer for connection pooling
- Horizontal sharding by user_id when > 50M users

**CDN**: Cloudflare for static assets and photo delivery (GCS origin)
