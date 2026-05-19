# 04 — User Journeys: Fully Mapped

## Seller Journey

### Phase 1: Item Capture

```
USER ACTION
    │
    ├── Option A: Photo Capture
    │       User opens app → taps camera icon → takes 1-6 photos
    │       [Vision Model] analyzes images
    │       → Identifies item type, brand, model, condition
    │       → Flags any damage or missing components
    │
    ├── Option B: Voice Description
    │       User taps microphone → speaks naturally
    │       "I have a KitchenAid stand mixer, red, barely used"
    │       [Speech-to-text → LLM parsing]
    │       → Extracts: product type, brand, color, condition
    │
    └── Option C: Text Description
            User types: "selling my son's Xbox Series S with controller"
            [LLM parsing]
            → Extracts: product, accessories included, implied condition
```

### Phase 2: Item Identification & Enrichment

```
[Seller Agent] receives raw input
    │
    ├── Calls Product Identification API
    │       → Matches to product database (30M+ SKUs)
    │       → Returns: official product name, model number, spec sheet
    │       → Confidence score ≥ 85% → proceed
    │       → Confidence score < 85% → ask user clarifying questions
    │           "Is this the 5.5qt or 7qt bowl size?"
    │
    ├── Calls Condition Assessment Module
    │       → Analyzes photos for: scratches, dents, missing parts, wear
    │       → Maps to condition scale: New / Like New / Good / Fair / Poor
    │
    └── Calls Market Data API
            → Queries: AgentBay sold history, eBay sold listings,
              Facebook Marketplace recent sales, Mercari comps
            → Returns: 30-day median price, price range, trending direction
```

### Phase 3: Listing Generation

```
[Listing Generation Engine] receives enriched item data
    │
    ├── Generates Title
    │       Formula: [Brand] [Model] [Key Spec] [Condition] [Location if relevant]
    │       Example: "KitchenAid Artisan 5-Qt Stand Mixer (Empire Red) — Like New"
    │
    ├── Generates Description
    │       Includes: official specs, observed condition, included accessories,
    │                 usage history (if user provided), any known issues
    │       Tone: honest, clear, friendly — not salesy
    │
    ├── Suggests Price
    │       Recommended: 50th percentile of 30-day sold comps
    │       Fast-sell option: 25th percentile
    │       Premium option: 75th percentile (longer time-to-sale)
    │       User sets floor price (minimum acceptable)
    │
    ├── Selects Categories & Tags
    │       Automatic from product database mapping
    │
    └── Prepares Photos
            Applies basic enhancement (brightness, contrast)
            Orders photos: hero shot first, detail shots after
```

### Phase 4: User Review & Approval

```
USER sees preview:
    ┌─────────────────────────────────────┐
    │  [Hero Photo]                       │
    │                                     │
    │  KitchenAid Artisan Stand Mixer     │
    │  Like New · Empire Red              │
    │                                     │
    │  Recommended price: $185            │
    │  Your floor: ___ (set minimum)      │
    │                                     │
    │  [View Full Listing] [Edit] [Post]  │
    └─────────────────────────────────────┘

USER can:
    ├── Post immediately (one tap)
    ├── Edit any field manually
    ├── Adjust price
    └── Set negotiation preferences:
            "Don't accept less than $150"
            "Auto-accept offers above $175"
            "I prefer local pickup"
```

### Phase 5: Active Listing Management

```
[Seller Agent] monitors listing 24/7
    │
    ├── Receives buyer inquiries
    │       Agent answers product questions from knowledge base + user info
    │       Example: "Does it have all attachments?" → Agent checks listing,
    │                answers "Yes — includes dough hook, flat beater, wire whip"
    │
    ├── Receives offer from Buyer Agent
    │       Initiates Agent-to-Agent Negotiation Protocol (A2ANP)
    │       [see negotiation flow below]
    │
    ├── Weekly status nudge to user
    │       "Your KitchenAid has had 47 views and 3 inquiries.
    │        Consider dropping price $15 to accelerate sale?"
    │
    └── Price optimization (optional auto-mode)
            If no sale after 14 days: suggests 10% price drop
            If high view/low offer ratio: suggests improved photos
```

### Phase 6: Negotiation (Agent-to-Agent)

```
SELLER AGENT ◄────────────────────► BUYER AGENT
      │                                    │
      │  Buyer Agent: "Offer $140"         │
      │                                    │
      │  Seller Agent evaluates:           │
      │    - Floor price: $150             │
      │    - Market rate: $185             │
      │    - Days listed: 3                │
      │    - Buyer trust score: 4.7/5      │
      │    Decision: Counter               │
      │                                    │
      │  Seller Agent: "Counter $168,      │
      │   includes free local delivery"    │
      │                                    │
      │  Buyer Agent evaluates:            │
      │    - User budget: $170             │
      │    - $168 < budget threshold       │
      │    Decision: Accept                │
      │                                    │
      │  DEAL: $168, local pickup          │
      │                                    │
      ▼                                    ▼
   Notifies seller: "Sold for $168!"   Notifies buyer: "Got it for $168!"
```

### Phase 7: Fulfillment

```
POST-SALE FLOW
    │
    ├── Payment processing
    │       Buyer pays into escrow
    │       Funds held until delivery confirmed
    │
    ├── Fulfillment coordination
    │       Option A: Shipping
    │           Agent generates prepaid label (USPS/UPS/FedEx)
    │           Seller prints and ships
    │           Tracking auto-shared with buyer
    │
    │       Option B: Local pickup
    │           Agent proposes pickup window (based on both parties' availability)
    │           Meetup location suggested (public, safe)
    │           QR code exchange confirms handoff
    │
    └── Completion
            Buyer confirms receipt → funds released to seller
            Both agents submit review data
            Seller trust score updated
```

---

## Buyer Journey

### Phase 1: Intent Expression

```
USER speaks or types to their agent:

Natural language examples:
    "Find me a good used laptop for my kid under $300"
    "I need a treadmill. Nothing fancy, just reliable. Max $400."
    "Looking for a dining table for 6, mid-century style, under $600"
    "I want Air Jordan 1 Retros, size 10, under $150, good condition"

[Buyer Agent NLU Layer]
    → Extracts structured intent:
        - Category: [Furniture / Electronics / Shoes / etc.]
        - Budget: [max price]
        - Condition: [stated or inferred]
        - Style preference: [if relevant]
        - Location preference: [local pickup / ship / no preference]
        - Urgency: [inferred from language]

Agent confirms understanding:
    "Got it — searching for a used laptop under $300,
     good condition or better, suitable for a child.
     Any brand preferences?"
```

### Phase 2: Search & Discovery

```
[Buyer Agent Search Engine]
    │
    ├── Searches AgentBay inventory
    │       Semantic search over listing embeddings
    │       Filters: price ≤ $300, condition ≥ Good, category: Laptops
    │
    ├── [Phase 2+] Searches external platforms
    │       eBay API, Craigslist RSS, Facebook Marketplace scrape
    │       Normalizes results into common schema
    │
    ├── Applies ranking model
    │       Signals: price_score, condition_score, seller_trust_score,
    │                proximity_score, listing_quality_score, freshness
    │       Weights adjusted by user preferences
    │
    └── Returns top 20 candidates for deeper evaluation
```

### Phase 3: Comparison & Filtering

```
[Buyer Agent Evaluation Layer]
    │
    ├── For each candidate:
    │       - Parse listing for specs (RAM, storage, processor, screen size)
    │       - Cross-reference with product database for accuracy
    │       - Check seller history (# transactions, avg rating, disputes)
    │       - Calculate "effective price" (item + estimated shipping)
    │       - Assess photos for condition accuracy
    │
    ├── Flags:
    │       - Underpriced (possible scam)
    │       - Overpriced relative to market
    │       - Listing quality issues (blurry photos, missing specs)
    │       - Seller with dispute history
    │
    └── Selects top 3-5 for presentation
```

### Phase 4: Negotiation

```
For top candidates, Buyer Agent initiates offers:

[Buyer Agent] determines offer strategy:
    - Market rate: $275 for similar items
    - User budget: $300
    - Seller's price: $320
    - Seller listed 8 days ago (motivated to sell)
    - Strategy: Open at $250, target $270

[A2ANP negotiation runs]:
    Round 1: Buyer offers $250 | Seller counters $305
    Round 2: Buyer counters $265 | Seller counters $295
    Round 3: Buyer counters $275 | Seller accepts $275

Outcome stored: "Negotiated $45 below asking price"
```

### Phase 5: Offer Presentation

```
USER sees simplified comparison:

    ┌─────────────────────────────────────────────────────┐
    │  Your agent found 3 great options:                  │
    │                                                     │
    │  #1 ★ BEST PICK                                     │
    │  Dell Inspiron 15 (2022), 8GB RAM, 256GB SSD        │
    │  Good condition · Seller: 4.9★ (89 sales)           │
    │  Negotiated: $275 (was $320) · Ships free           │
    │                                [Buy Now]            │
    │                                                     │
    │  #2 RUNNER-UP                                       │
    │  Lenovo IdeaPad 3, 8GB RAM, 128GB SSD               │
    │  Like New · Seller: 4.6★ (23 sales)                 │
    │  Price: $260 · Local pickup (4.2 miles away)        │
    │                                [Buy Now]            │
    │                                                     │
    │  #3 BUDGET OPTION                                   │
    │  HP Chromebook 14, 4GB RAM, 64GB                    │
    │  Good condition · Seller: 4.4★ (12 sales)           │
    │  Price: $195 · Ships $12                            │
    │                                [Buy Now]            │
    │                                                     │
    │  [See All Options]  [Tell agent to keep looking]    │
    └─────────────────────────────────────────────────────┘
```

### Phase 6: Purchase & Delivery

```
USER taps "Buy Now"
    │
    ├── Payment authorized (stored payment method)
    │       Funds held in escrow
    │
    ├── Seller notified
    │       Seller agent initiates shipping/pickup coordination
    │
    ├── Buyer agent tracks progress
    │       Sends buyer updates: "Shipped! Arriving Thursday"
    │
    ├── Delivery confirmed
    │       Buyer taps "Got it" → funds released
    │       Or: 48-hour auto-release if buyer doesn't respond
    │
    └── Review prompts
            "Rate this transaction" → feeds trust model
```

---

## Decision Logic: Agent Autonomy Levels

Users can set how autonomous their agent is:

```
LEVEL 1: Supervised (default for new users)
    Agent asks for approval at every step
    Good for: new users, high-value items

LEVEL 2: Semi-Autonomous
    Agent handles negotiation, alerts user at offer acceptance
    Good for: experienced users, items under $200

LEVEL 3: Fully Autonomous
    Agent completes transactions within pre-set parameters
    Good for: power users, standing purchase requests, bulk selling
    Requires: set floor/ceiling prices, payment method on file
```

---

## Negotiation Protocol Decision Tree

```
SELLER AGENT receives offer from BUYER AGENT
    │
    ├── Is offer ≥ auto-accept threshold?
    │       YES → Accept immediately, notify user
    │       NO → Continue
    │
    ├── Is offer < floor price?
    │       YES → Decline: "Our price is firm at $X"
    │             OR: Counter at floor price
    │       NO → Continue
    │
    ├── Is this Round 1, 2, or 3?
    │       Round 1: Counter at (asking - 5%)
    │       Round 2: Counter at (floor + 15% above floor)
    │       Round 3: Counter at floor price
    │       Round 4: Final — accept or decline
    │
    ├── Contextual factors:
    │       Buyer trust score < 3.0 → Require full price (higher risk)
    │       Item listed > 21 days → More flexible on price
    │       Multiple competing buyers → Hold firm on price
    │
    └── All counters logged transparently in negotiation history
```
