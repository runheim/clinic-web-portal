# Cognitive Edge Clinic — Master Clinical Operations Runbook

**Document Identifier:** RUNBOOK-V4.0-OPS  
**Classification:** RESTRICTED TECHNICAL & CLINICAL GOVERNANCE  
**Target Systems:** Web Portal, Netlify Edge Runtime, Spruce Health Bridge, eClinicalWorks healow, Cal.com, Stripe Vault  
**Last Updated:** September 2026  

---

## 1. Architectural Overview & Zero-ePHI Philosophy

### 1.1 The Zero-ePHI Quarantine Standard
The Cognitive Edge Clinic web portal operates under an absolute **Zero-ePHI Architecture**. No Protected Health Information (PHI), medical records, chart notes, raw biometric lab values, or patient diagnoses are ever ingested, processed, or persisted on this domain or within its edge computing infrastructure.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                     |
+---------------------------------------------------------------------------------------+
                                  |                     |
         Public Marketing &       |                     | Direct Enclave Links
         Interactive Screening    |                     | (No-Referrer Policy)
                                  v                     v
+----------------------------------+        +-------------------------------------------+
|    COGNITIVE EDGE WEB PORTAL     |        |          HIPAA SECURE ENCLAVES            |
|       (Zero-ePHI Boundary)       |        +-------------------------------------------+
|                                  |        | 1. eClinicalWorks (healow Portal)         |
|  - Next.js 16 App Router         |        |    - Lab charts, MRNs, formal diagnoses   |
|  - Ephemeral Memory Calculations |        |                                           |
|  - Sanitized Route Transitions   |        | 2. Spruce Health Enclave                  |
|  - Stripped Telemetry & Tokens   |        |    - End-to-end encrypted messaging       |
+----------------------------------+        |    - Direct VIP Physician Line            |
                 |                          |                                           |
                 | Cal.com Webhook Relay    | 3. Stripe Financial Vault                 |
                 | (Administrative Only)    |    - Retainers & PCI-DSS Tier 1 vault     |
                 v                          +-------------------------------------------+
+----------------------------------+                            ^
|     API /webhooks/calcom         |                            |
|  - HMAC SHA-256 Signature Gate   |----------------------------+
|  - Strict Contact Metadata Only  |   Direct Server-to-Server
|  - 0% Clinical Notes Transferred |   Encrypted REST API
+----------------------------------+
```

### 1.2 Isolation Boundaries
1. **Interactive Clinical Screener (`/assessment`)**:
   Runs 100% client-side in volatile React state. When the assessment is completed, the clinical algorithm computes recommendations in memory without saving to `localStorage`, cookies, or remote databases.
2. **Biomarker Pathway Simulator (`/ledger`)**:
   Purely deterministic mathematical model of cofactor saturation kinetics (EPA/DHA, CoQ10, NAD+, ApoE4). Zero patient values are captured.
3. **Telemetry Sanitization (`src/lib/telemetryQuarantine.ts`)**:
   All outgoing navigation traces strip search queries, identity parameters (`email`, `phone`, `ssn`, `mrn`, `dob`), and commercial trackers (Meta Pixel, Google Analytics) are neutralized.

---

## 2. Live Handshake Configurations

### 2.1 eClinicalWorks (eCW) healow Patient Portal

* **Environment Variable:** `NEXT_PUBLIC_HEALOW_PORTAL_URL`
* **Production Value:** `https://mycwXX.eclinicalworks.com/portal` (replace `XX` with assigned practice ID)
* **Sub-Portal Vanity Routing:**
  Netlify edge rule `/portal-redirect` proxies users to the external eCW gateway while forcing:
  ```http
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  ```
  This guarantees that internal clinic paths, parameters, and tokens never leak into external EHR server access logs.
* **Updating Practice Vanity Route:**
  1. Update `.env.production`:
     ```bash
     NEXT_PUBLIC_HEALOW_PORTAL_URL="https://mycw72.eclinicalworks.com/portal7210"
     ```
  2. Update redirect block in `netlify.toml`:
     ```toml
     [[redirects]]
       from = "/portal-redirect"
       to = "https://mycw72.eclinicalworks.com/portal7210"
       status = 302
       force = true
       headers = { Referrer-Policy = "no-referrer" }
     ```
  3. Deploy to production via CI/CD.

---

### 2.2 Spruce Health Communications Bridge

* **Environment Variables:**
  * `SPRUCE_API_KEY`: Private API Bearer Token (Server-only secret).
  * `NEXT_PUBLIC_SPRUCE_CARE_URL`: Direct link to practice portal (`https://spruce.care/yourpractice`).
* **Relay Handler:** [`src/app/api/webhooks/calcom/route.ts`](file:///d:/Projects/agy2-projects/clinic-web-portal/src/app/api/webhooks/calcom/route.ts)
* **Provisioning Flow:**
  When a patient books a diagnostic consultation via Cal.com, the webhook relay receives the `BOOKING_CREATED` event and executes a server-to-server POST to:
  `https://api.sprucehealth.com/v1/contacts`
* **Zero-ePHI Contact Card Payload:**
  ```json
  {
    "displayName": "Richard Roe",
    "emails": [{ "value": "richard.roe@example.com", "type": "primary" }],
    "phones": [{ "value": "+13365550144", "type": "mobile" }],
    "notes": "Cal.com Consultation Booking Ref: cal_booking_982148 - Event: Comprehensive 45-Minute Neuro-Diagnostic Consultation at 2026-08-20T14:15:00.000Z",
    "tags": ["Cal.com Bridge", "Zero-ePHI Candidate", "Diagnostic Consultation"]
  }
  ```
* **API Bearer Key Rotation Protocol (90-Day Cadence):**
  1. Generate new API Key in Spruce Health Administrator Console (`Settings > Developers > API Keys`).
  2. Update GitHub Actions Secrets and Netlify Environment: `SPRUCE_API_KEY`.
  3. Verify webhook handshake via unit test suite:
     ```bash
     npm run test:unit -- calcom-spruce-webhook.test.ts
     ```
  4. Revoke old key in Spruce Console after confirming 0 failures in production logs.
* **Concierge VIP Direct Line Assignment:**
  - Standard members interact via clinic reception triage (`+1 (800) 555-0199`).
  - Concierge VIP members are routed to direct physician mobile routing via Spruce Care VIP tags.

---

### 2.3 Cal.com & Stripe Elements Integration

* **Environment Variables:**
  * `CALCOM_WEBHOOK_SECRET`: Cryptographic shared secret for HMAC verification.
  * `STRIPE_SECRET_KEY`: Server secret for billing retainers.
* **Diagnostic Consultation Booking UID:**
  - Event Slug: `neuro-diagnostic-consultation`
  - Mapping UID: `#982148`
* **HMAC Signature Verification:**
  Every Cal.com webhook request must provide the header:
  `x-cal-signature-256: <hex_digest>`
  The route handler verifies:
  $$\text{HMAC-SHA256}(\text{rawBody}, \text{CALCOM\_WEBHOOK\_SECRET}) \equiv \text{signature}$$
  Unsigned requests or signature mismatches trigger immediate `HTTP 401 Unauthorized`.
* **Retainer & Membership Tiers:**
  * **Cognitive Maintenance ($2,500/mo)**: Quarterly biomarker review, protocol updates.
  * **Precision Optimization ($5,000/mo)**: Bi-weekly tele-rounds, continuous metabolomics, $7,500 initial retainer.
  * **Private Client Concierge ($10,000/mo)**: Unlimited direct physician access, in-home neuro-suite deployment, $15,000 initial retainer.

---

## 3. Video & Asset Replacement Guide

### 3.1 Google Flow Clinical Masterclass Briefings
All clinical video briefings are hosted in `public/videos/briefings/` and indexed in `src/app/briefings/page.tsx`:

| Filename | Title | Modality | Duration | Ratio |
|:---|:---|:---|:---|:---|
| `neuro-metabolic-opt.mp4` | Neuro-Metabolic Optimization & Synaptic Plasticity | Metabolic / BDNF | 42:15 | 16:9 |
| `tms-qee-bioenergetics.mp4` | High-Field TMS & QEEG-Guided Cortical Remodeling | Neuromodulation | 38:50 | 16:9 |
| `peptide-signaling-longevity.mp4` | Epithalon & Peptide Bioregulators in Cellular Longevity | Peptides | 45:10 | 16:9 |
| `vagal-tone-hifem.mp4` | Autonomic Modulation: Deep Vagal Tone & HIFEM Axis | Autonomic / Pelvic | 31:20 | 16:9 |

* **Compression Guidelines:**
  - Codec: H.264 / AAC or WebM VP9.
  - Profile: High@L4.1, 1080p widescreen, bitrate target 3.5–5.0 Mbps.
  - Poster Frames: `public/images/briefings/<briefing-id>-poster.webp` (1920x1080, Q85).

### 3.2 Physician Portraits & Clinical Facility Photos
Assets located in `public/images/providers/` and `public/images/clinic/`:

| Path | Description | Spec |
|:---|:---|:---|
| `public/images/providers/dr-runheim-portrait.webp` | Dr. Andreas Runheim, MD, PhD executive portrait | 800x1000 WebP (4:5 vertical) |
| `public/images/clinic/neuro-suite-1.webp` | High-field TMS & EEG Faraday shielded chamber | 1920x1080 WebP |
| `public/images/clinic/recovery-lounge.webp` | Private restorative intravenous infusion lounge | 1920x1080 WebP |

* **Asset Replacement Command:**
  After updating image assets, verify contrast luminosity and zero ePHI artifacts:
  ```bash
  npm run audit:release
  ```

---

## 4. Netlify DNS & Custom Domain Provisioning

### 4.1 Apex Domain (`arunheim.com` / `cognitiveedgeclinic.com`)
Configure DNS records at registrar (Cloudflare, Route53, or Namecheap):

| Type | Name | Target / Value | TTL | Note |
|:---|:---|:---|:---|:---|
| `A` | `@` (apex) | `75.2.60.5` | 300 | Netlify Load Balancer IPv4 |
| `AAAA` | `@` (apex) | `2600:1f18:2489:8700::` | 300 | Optional Netlify IPv6 |
| `CNAME` | `www` | `cognitive-edge-clinic.netlify.app.` | 300 | Netlify Edge Alias |
| `CNAME` | `portal` | `mycwXX.eclinicalworks.com.` | 300 | Direct Patient Portal CNAME |
| `CNAME` | `vault` | `cognitive-edge-clinic.netlify.app.` | 300 | Retainer / Vault Subdomain |

### 4.2 Automated SSL/TLS & Edge Security Headers
Netlify provisions automated Let's Encrypt Wildcard certificates upon DNS propagation.
All responses are injected with security headers configured in `netlify.toml`:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://assets.calendly.com https://app.cal.com https://js.stripe.com; ...`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`

---

## 5. Disaster Recovery & Emergency Triage Procedures

### 5.1 Incident Classification & Response Matrix

| Severity | Incident Type | Symptoms | Initial Action |
|:---:|:---|:---|:---|
| **P1** | Spruce Relay API Down | Webhook POST fails (502 / 504) | Fallback queue active; manual CSV extract |
| **P1** | Unsigned Webhook Flood | Spikes in 401s on `/api/webhooks/calcom` | Rate limit at Netlify Edge / IP block |
| **P2** | Cal.com Double Booking | Calendar slot desync | Concierge SMS dispatch to patient |
| **P2** | Video CDN Degradation | Briefings buffering | Fallback to Vimeo / Bunny.net mirror |
| **P3** | Telemetry Warning | Non-critical script warning | Quarantine filter blocks payload |

---

### 5.2 Spruce API Downtime Recovery
If Spruce Health API experiences an outage:
1. The webhook handler captures the error in server logs with status `simulated_local_relay` or `failed`.
2. The webhook still returns `HTTP 200` to Cal.com with `{ status: "success", spruceRelayStatus: "failed" }`, ensuring Cal.com does not thrash with endless retries.
3. Access Cal.com administrator dashboard (`cal.com/bookings`), export bookings for the past 24 hours.
4. Import contacts into Spruce Health via batch CSV upload (`Contacts > Import CSV`).
5. Run smoke test to verify restoration:
   ```bash
   npm run test:smoke
   ```

---

### 5.3 Cal.com Slot Desynchronization Protocol
In the rare event of a scheduling conflict:
1. Patient receives automatic Cal.com confirmation.
2. Clinical Concierge is notified via Spruce push notification.
3. If double-booked, the Concierge triggers an immediate VIP reschedule call within 15 minutes, offering prioritized alternative slots with Dr. Runheim.

---

### 5.4 Zero-ePHI Leak Incident Response Protocol
If any developer accidentally stages or commits prohibited health tokens or credentials:
1. **Immediate Quarantine:**
   ```bash
   git reset HEAD~1 --soft
   ```
2. **Scrub Git History (if already pushed to remote):**
   ```bash
   # Using git-filter-repo
   git filter-repo --invert-paths --path <file_with_secret> --force
   ```
3. **Secret Invalidation:**
   Rotate `SPRUCE_API_KEY`, `CALCOM_WEBHOOK_SECRET`, and `STRIPE_SECRET_KEY` immediately in the respective vendor dashboards.
4. **Pre-flight Audit Verification:**
   ```bash
   npm run audit:release
   ```
   Confirm 100% clean status before deploying.

---

## 6. Routine Operations & Release Commands

| Operation | Command | Expected Outcome |
|:---|:---|:---|
| **Local Pre-Commit Gate** | `npm run precommit` | Validates env, types, lint, audit (0 errors) |
| **Release Pre-Flight Audit** | `npm run audit:release` | 0 ePHI violations, 100% secret hygiene |
| **Unit Test Suite** | `npm run test:unit` | 11/11 tests pass |
| **Playwright Full Suite** | `npm run test:e2e` | 14/14 tests pass |
| **Staging Smoke Suite** | `npm run test:smoke` | 10 routes + 3 headers + gate pass |
| **Standalone Build** | `npm run build` | 17 routes compiled cleanly |
| **Release Packaging** | `npm run package:release` | Emits `release-v4.0.0.json` manifest |
