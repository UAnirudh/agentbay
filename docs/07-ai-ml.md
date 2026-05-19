# 07 — AI/ML Components: Model-Level Detail

## Component 1: LLM-Based Listing Generation

### Model Selection
- **Primary**: Claude Sonnet 4.6 (high-quality listing generation, nuanced description writing)
- **Fallback**: Claude Haiku 4.5 (speed-optimized for high-volume, simpler items)

### System Prompt Architecture
```
SYSTEM PROMPT (Listing Generator):

You are an expert marketplace listing writer. Your job is to create
compelling, accurate, honest product listings for a peer-to-peer
marketplace. You write for everyday buyers — clear, trustworthy,
and helpful.

RULES:
- Never exaggerate condition
- Include all known specs from the product database
- Flag any damage or issues honestly
- Use the item's official name and model number
- Match tone to category (playful for kids' items, professional for tools)
- Never use ALL CAPS or excessive punctuation
- Keep descriptions between 100-400 words

OUTPUT FORMAT: JSON with fields: title, description, condition_notes,
included_items, not_included_items, suggested_keywords
```

### Listing Generation Pipeline
```
Input: {photos[], voice_transcript, product_data, market_context}

Step 1: Vision Analysis (parallel)
    - Photo → item_identification (category, brand, model, condition_visual)
    
Step 2: Product Enrichment
    - item_identification → product_database lookup → full_specs
    
Step 3: Market Context
    - product_id + condition → pricing_api → price_range, comp_listings

Step 4: LLM Generation
    - Assemble prompt with: specs, condition, photos description,
      market context, user-provided notes
    - Call Claude Sonnet 4.6
    - Parse JSON response

Step 5: Quality Check
    - Validate: title ≤ 120 chars, description 100-400 words
    - Check for prohibited phrases (misleading claims)
    - Spell check
    - Return to user for approval
```

### Evaluation Metrics
- **Listing acceptance rate**: % of AI-generated listings accepted without major edits (target: > 80%)
- **Title click-through rate**: CTR of AI titles vs. human-written baselines
- **Conversion rate**: % of views that result in offers (AI vs. manual baseline)
- **Description accuracy**: Manual audit of 1000 listings/month for factual accuracy

### Fine-Tuning Strategy
- Base model: Claude Sonnet 4.6 (no fine-tuning initially — use prompt engineering)
- Phase 2: Collect human edits to AI listings → train a correction layer
- Phase 3: RLHF on listing quality using transaction outcomes as reward signal

---

## Component 2: Vision Model — Item Recognition

### Architecture
- **Primary**: Claude Sonnet 4.6 with vision (multimodal, excellent zero-shot recognition)
- **Supplementary**: Custom-trained ResNet-50 for high-confidence category classification (faster, cheaper for bulk processing)

### Recognition Pipeline
```
Input: image (JPEG/PNG, up to 10MB)

Step 1: Pre-processing
    - Resize to 1024px max dimension
    - Auto-orient (EXIF rotation correction)
    - Convert HEIC → JPEG

Step 2: Category Classification (ResNet, < 100ms)
    - Outputs: top-3 categories with confidence scores
    - If top confidence > 90%: proceed with category pre-fill
    - If confidence < 90%: pass to Claude vision for disambiguation

Step 3: Claude Vision Analysis (1-3 seconds)
    PROMPT: "This is a secondhand marketplace photo. Please identify:
    1. Product type, brand, and model (if visible)
    2. Estimated condition (new/like new/good/fair/poor) with visual evidence
    3. Visible accessories or components included
    4. Any visible damage or issues
    5. Any visible text (model numbers, labels, etc.)
    Output as JSON."

Step 4: Product Database Match
    - Use identified product name → fuzzy search product database
    - Return best match with confidence score
    - If confidence > 85%: auto-fill specs
    - If confidence 50-85%: present options to user
    - If confidence < 50%: ask user clarifying questions
```

### Condition Classification Model
- Binary classifiers per condition tier trained on labeled photo datasets
- Labels: eBay VeRO-reviewed condition assessments from sold listings
- Training data: 500K labeled product photos across 200 categories

### Training Data Requirements
- Item recognition: ImageNet backbone + 5M consumer product photos (sourced from open datasets + eBay open data)
- Condition classifier: 500K manually labeled photos with condition grades
- Categories initially supported: Electronics, Furniture, Clothing, Toys, Tools, Appliances, Sports, Books

### Evaluation Metrics
- **Category accuracy**: % correctly classified (target: > 92% top-1, > 98% top-3)
- **Brand identification accuracy**: % of brands correctly identified (target: > 85%)
- **Condition classification accuracy**: % of condition grades matching expert human review (target: > 80%)

---

## Component 3: Pricing Model

### Architecture
- **Gradient Boosting (XGBoost)** regression model for price estimation
- Updated weekly with new sold-listing data

### Features
```
ITEM FEATURES:
    - product_id (one-hot encoded)
    - category (one-hot encoded)
    - condition (ordinal: 1-5)
    - age_months (estimated)
    - has_original_box (binary)
    - accessories_completeness (0.0-1.0)

MARKET FEATURES:
    - 7_day_median_sold_price (same product, same condition)
    - 30_day_median_sold_price
    - supply_count (active listings for same product)
    - demand_signal (search volume for product, last 7 days)
    - trending_direction (-1, 0, 1 = falling/stable/rising)

LOCATION FEATURES:
    - metro_area (encoded)
    - local_demand_factor (metro-level supply/demand ratio)

SELLER FEATURES (for floor price suggestion):
    - seller_trust_score
    - seller_avg_days_to_sell
```

### Training Data
- Source: AgentBay internal sold listings (bootstrapped from eBay sold data + Mercari API)
- Volume: 10M+ sold transactions for initial model
- Refresh: weekly retraining on new sold data
- Labels: actual final transaction price

### Output
```json
{
  "recommended_price": 185.00,
  "fast_sell_price": 155.00,      // 25th percentile
  "premium_price": 215.00,        // 75th percentile
  "price_range": {"min": 120.00, "max": 280.00},
  "confidence": 0.87,
  "comparable_count": 34,
  "market_trend": "stable",
  "estimated_days_to_sell": {
    "at_recommended": 7,
    "at_fast_sell": 2,
    "at_premium": 21
  }
}
```

### Evaluation Metrics
- **MAPE (Mean Absolute Percentage Error)**: Target < 12%
- **Within-15% accuracy**: % of recommendations within 15% of actual sale price (target: > 80%)
- **Conversion rate by price decile**: Track which price recommendations lead to sales

---

## Component 4: Negotiation Model

### Architecture
Two-layer system:
1. **Rule-based strategy engine** (fast, predictable, explainable)
2. **Reinforcement Learning (RL) agent** (Phase 2 — learns optimal negotiation strategies from outcomes)

### Rule-Based Engine (MVP)

```python
class NegotiationStrategy:
    def decide(self, context: NegotiationContext) -> NegotiationAction:
        offer = context.incoming_offer
        floor = context.floor_price
        ceiling = context.ceiling_price (for buyers)
        market = context.market_price
        round_num = context.round
        days_listed = context.days_listed
        buyer_trust = context.counterparty_trust_score

        # Seller strategy
        if offer >= self.auto_accept_threshold:
            return Action.ACCEPT
        if offer < floor:
            if round_num < 3:
                return Action.COUNTER(floor * 1.05)  # slight wiggle room
            else:
                return Action.DECLINE
        
        # Flexible zone: between floor and auto-accept
        urgency_factor = min(days_listed / 30, 1.0)  # 0-1, higher = more urgent
        
        if round_num == 1:
            counter = market * 0.95  # anchor near market
        elif round_num == 2:
            counter = floor + (market - floor) * 0.5 * (1 - urgency_factor)
        elif round_num == 3:
            counter = floor + (market - floor) * 0.2  # near floor
        
        return Action.COUNTER(counter)
```

### RL Agent (Phase 2)

- **Environment**: Simulated marketplace with historical transaction data
- **State space**: (round, time_listed, offer_history, market_price, floor_price, counterparty_trust)
- **Action space**: {ACCEPT, DECLINE, COUNTER(price)} — continuous price within valid range
- **Reward function**: `reward = final_price - floor_price` (for sellers) / `ceiling_price - final_price` (for buyers)
- **Algorithm**: Proximal Policy Optimization (PPO)
- **Training data**: Historical AgentBay negotiation logs (anonymized)

### Evaluation Metrics
- **Deal closure rate**: % of negotiations that result in a deal (target: > 65%)
- **Seller revenue premium**: average final price vs. floor price (target: > 20% above floor)
- **Buyer savings**: average discount from asking price (target: > 10%)
- **Negotiation rounds to close**: average rounds per deal (target: < 3)

---

## Component 5: Fraud Detection Model

### Architecture
- **Layer 1**: Real-time rules (Redis, < 10ms)
- **Layer 2**: XGBoost classifier (async, < 5s)
- **Layer 3**: LLM-based deep review for edge cases (manual trigger, < 60s)

### Feature Set
```
ACCOUNT FEATURES:
    account_age_days, verification_level, transaction_count,
    dispute_count, avg_rating, country_of_registration,
    ip_country_match, device_fingerprint_age

LISTING FEATURES:
    price_vs_market_ratio, photos_reverse_image_hits,
    description_scam_score, category_price_anomaly,
    listing_velocity (listings per day), duplicate_listing_hash

BEHAVIORAL FEATURES:
    session_duration, pages_visited, copy_paste_ratio,
    response_time_to_offers (too fast = bot signal),
    keyboard_dynamics (typing pattern analysis)

MESSAGE FEATURES:
    external_link_count, payment_redirect_keywords,
    urgency_language_score, grammar_anomaly_score
```

### Training Data
- Labeled fraud cases from platform moderation team
- Synthetic fraud cases generated from known scam patterns
- Bootstrapped with public fraud datasets (IEEE CIS Fraud Detection dataset)
- Ongoing: active learning loop where model-flagged cases reviewed by humans feed back into training

### Model Evaluation
- **Precision**: 90%+ (low false positive rate — don't flag good users)
- **Recall**: 85%+ (catch most fraud)
- **AUC-ROC**: 0.95+
- **Latency**: Layer 2 model < 2s for 99th percentile

---

## Component 6: Search Ranking Model

### Architecture
- **Learning-to-Rank (LTR)** using LambdaMART (XGBoost's `rank:pairwise`)
- Trained on implicit feedback (clicks, offers, purchases)

### Feature Set
```
QUERY-ITEM FEATURES:
    bm25_score (text relevance)
    embedding_cosine_similarity (semantic relevance)
    price_fit_score (offer_price relative to budget)
    condition_match_score
    
ITEM FEATURES:
    seller_trust_score
    listing_age_days
    view_count
    offer_count
    
CONTEXT FEATURES:
    user_category_affinity
    user_price_sensitivity
    user_condition_preference
    location_proximity_miles
```

### Training Signal
- **Click-through**: User views a result (weak positive)
- **Offer made**: User agent initiates negotiation (strong positive)
- **Purchase**: Transaction completed (strongest positive)
- **Explicit skip**: User says "not interested" to agent (negative)

### Model Lifecycle
- **Training frequency**: Weekly retraining on last 30 days of interaction data
- **Shadow mode**: New model runs in parallel, evaluated against production before promotion
- **A/B testing**: 10% traffic to challenger model; promote if +2% purchase rate in 7 days
- **Rollback**: Automated rollback if purchase rate drops > 5% vs. control

---

## Model Lifecycle Management

### MLOps Infrastructure
- **Model Registry**: MLflow (experiment tracking, model versioning)
- **Training**: GCP Vertex AI (managed training jobs)
- **Serving**: Vertex AI Endpoints (fraud, ranking) + direct API (LLMs)
- **Monitoring**: Evidently AI (data drift, prediction drift)
- **Feature Store**: Feast (feature computation and serving)

### Deployment Process
```
Research → Experiment (Vertex AI Workbench)
         → Register (MLflow)
         → Shadow deploy (compare to production)
         → A/B test (10% traffic)
         → Gradual rollout (25% → 50% → 100%)
         → Monitor (alert on drift)
         → Retrain (weekly/monthly per model)
```

### Data Requirements Summary

| Model | Training Data Volume | Refresh Rate | Key Source |
|---|---|---|---|
| Listing generation | Prompt engineering | N/A (LLM) | — |
| Item recognition | 5M labeled images | Monthly | Open datasets + internal |
| Condition classifier | 500K labeled photos | Monthly | Human labelers |
| Pricing model | 10M+ sold transactions | Weekly | Sold listings |
| Negotiation RL | 500K negotiation logs | Monthly | Platform logs |
| Fraud detection | 100K labeled cases | Bi-weekly | Moderation team |
| Search ranking | 50M interaction events | Weekly | Platform logs |
