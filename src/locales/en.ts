import type { Dictionary } from "@/lib/i18n/types";

/**
 * Primary English Dictionary (en)
 * Cognitive Edge Clinic — High-Prestige Longevity & Neuro-Metabolic Practice
 */
export const en: Dictionary = {
  meta: {
    locale: "en",
    localeName: "English",
    language: "English",
    region: "Global / North America",
    clinicalDialect: "North American Longevity & Neuro-Metabolic Medicine",
  },
  navigation: {
    brandName: "Cognitive Edge Clinic",
    brandTagline: "Neuro-Metabolic Resuscitation • Longevity Practice",
    services: "Clinical Modalities",
    ledger: "Scientific Ledger",
    briefings: "Scientific Briefings",
    membership: "VIP Membership",
    biographies: "Medical Leadership",
    diagnosticVault: "Diagnostic Vault",
    intakeAssessment: "Intake Assessment",
    memberLogin: "Member Login",
    clientPortal: "Client Portal",
    search: "Search",
    searchAria: "Search clinical modalities, biomarkers, briefings, and actions (Cmd+K)",
    portalGateway: "eClinicalWorks Portal",
    spruceRelay: "Spruce Care Web",
    systemStatus: "System Status & Enclave Telemetry",
  },
  modalities: {
    tmsNeuromodulation: {
      title: "TMS Neuromodulation",
      subtitle: "DLPFC Neuroplasticity & Ca-AKG Synaptic Restoration",
      tagline: "Restoring Cortical Excitability & Resolving Prefrontal Latency",
      abstract:
        "Targeted theta-burst and high-frequency (10 Hz) repetitive magnetic pulses directed at the left dorsolateral prefrontal cortex (DLPFC). By coupling magnetic recalibration with metabolic epigenetic priming via Calcium-Alpha-Ketoglutarate (Ca-AKG), we upregulate brain-derived neurotrophic factor (BDNF), restore long-term potentiation (LTP), and mitigate autonomic hypofrontality in high-performing individuals.",
      clinicalCadence: "3 sessions weekly for 6 weeks (20 minutes per targeted session)",
      deliveryMethod: "Figure-8 localized magnetic coil with stereotactic neuronavigation",
    },
    subcutaneousPeptides: {
      title: "Subcutaneous Peptides",
      subtitle: "Epitalon for Pineal Circadian Repair, GHK-Cu, BPC-157",
      tagline: "Cellular Senescence Mitigation & Microvascular Endothelial Regeneration",
      abstract:
        "A calibrated regime of bio-identical and synthetic peptides administered via low-volume subcutaneous corridors. Utilizing Epitalon (pineal tetrapeptide) for telomerase elongation and circadian clock resetting, GHK-Cu for TGF-beta modulation and collagen scaffolding, and BPC-157 for gut-blood-brain barrier endothelial repair and angiogenic stabilization.",
      clinicalCadence: "Subcutaneous micro-injections 5 days on / 2 days off for 8-week cyclical blocks",
      deliveryMethod: '31G 5/16" micro-syringe subcutaneous umbilical/thigh administration',
    },
    btlEmsella: {
      title: "BTL Emsella Pelvic Core Stabilization",
      subtitle: "HIFEM Pelvic-Gluteal Core Box Training",
      tagline: "Fortifying Pelvic Floor Architecture & Re-Anchoring Vagal Autonomic Reserve",
      abstract:
        "Non-invasive supramaximal electromagnetic contractions targeting the deep pelvic floor musculature, levator ani, and sacral nerve plexus. Beyond urogenital architecture, pelvic diaphragmatic strength directly couples with thoracic respiratory dynamics and vagal parasympathetic innervation, relieving chronic sympathetic lock and improving sleep-wake autonomic oscillations.",
      clinicalCadence: "2 sessions weekly for 3 consecutive weeks (6 total 28-minute sessions)",
      deliveryMethod: "Focused electromagnetic chair transducer producing 2.5 Tesla magnetic field",
    },
    cerebralPhotobiomodulation: {
      title: "Cerebral Photobiomodulation",
      subtitle: "Near-Infrared Red Light Mitochondrial Therapy",
      tagline: "Stimulating Cytochrome C Oxidase & Cortical Vascular Hemodynamics",
      abstract:
        "Precision transcranial near-infrared light delivery (810 nm and 1064 nm) pulsed at 10 Hz (Alpha) or 40 Hz (Gamma) targeting the cortical default mode and central executive networks. Photons penetrate the cranium to interact with cytochrome c oxidase in the mitochondrial respiratory chain, accelerating ATP production, releasing nitric oxide, and dilating deep cerebral microvasculature.",
      clinicalCadence: "3 sessions weekly for 8 weeks (20 min transcranial + 10 min intranasal diode)",
      deliveryMethod: "Transcranial synchronized LED array with intranasal mucosal diode",
    },
    glp1MetabolicOptimization: {
      title: "GLP-1 Metabolic Optimization",
      subtitle: "Dual/Tri-Agonist Weight Management Protocols",
      tagline: "Extinguishing Hypothalamic Neuro-Inflammation & Calibrating Glycemic Corridors",
      abstract:
        "Age- and sex-calibrated subcutaneous dosing of GLP-1, GIP, and Glucagon receptor agonists combined with stoichiometric nutrient repletion. By crossing the blood-brain barrier to bind GLP-1 receptors in the arcuate nucleus and hippocampus, dual/tri-agonists resolve systemic insulin resistance, extinguish hypothalamic microglial inflammation, and sharpen executive focus without sarcopenic muscle loss.",
      clinicalCadence: "Once-weekly subcutaneous micro-titration with longitudinal 16-week cycles",
      deliveryMethod: "Calibrated auto-injector pen with physician-supervised dose step-up",
    },
    mitochondrialBioenergetics: {
      title: "Mitochondrial Bioenergetics Resuscitation",
      subtitle: "Ubiquinol, PQQ, TTFD, and RBC Magnesium (>6.0 mg/dL)",
      tagline: "Bypassing Enzyme Hysteresis & Ensuring Stoichiometric Coenzyme Saturation",
      abstract:
        "A clinical biochemist-formulated saturation regimen engineered to replenish intracellular cofactor pools and bypass metabolic rate-limiting bottlenecks. We target intracellular NAD+ concentrations between 40–100 μM, mandate red blood cell (RBC) magnesium corridors > 6.0 mg/dL, and supply lipid-soluble thiamine (TTFD) to fuel the pyruvate dehydrogenase complex and ensure continuous cerebral ATP generation.",
      clinicalCadence: "Daily oral stoichiometric packet + bi-weekly targeted bioenergetic IV infusion suite",
      deliveryMethod: "Liposomal oral cofactors + slow-infusion isotonic peripheral IV cannula",
    },
    bdnfSynapticPreservation: {
      title: "BDNF Amplification & Synaptic Density Preservation",
      subtitle: "Targeted Neurotrophin Upregulation & Dendritic Arborization",
      tagline: "Securing Structural Synaptic Density Against Age-Related Neuro-Attrition",
      abstract:
        "A multi-modal neuro-biological protocol combining high-affinity TrkB receptor agonists (7,8-Dihydroxyflavone), cold-shock RBM3 induction, and targeted nootropic co-factors. Engineered to sustain elevated Brain-Derived Neurotrophic Factor (BDNF) levels, fortifying hippocampal synaptic spine density and preserving cognitive speed in demanding professional environments.",
      clinicalCadence: "5 days weekly morning nootropic protocol + twice-weekly neuro-vascular stimulation",
      deliveryMethod: "Sublingual micro-emulsion + targeted transcranial magnetic stimulation",
    },
  },
  feeTiers: {
    clinicalEvaluation: {
      code: "EV-982148",
      label: "Clinical Diagnostic Evaluation",
      title: "Private Consultation Reservation",
      subtitle:
        "Comprehensive 45-Minute Diagnostic Consultation & Baseline Mapping • Dr. David Andreas Runheim, MD",
      duration: "45 minutes",
      deposit: "$1,000 USD (Held at Intake)",
      description:
        "In-depth clinical neuro-diagnostic assessment, baseline biomarkers, and quantitative cognitive mapping.",
      highlights: [
        "Multi-omic & neuro-functional review",
        "Quantitative baseline cognitive metrics",
        "Direct consultation with Chief Medical Officer",
      ],
      badgeText: "Template #982148 • Neuro-Diagnostic Baseline",
    },
    vipExecutive: {
      code: "EV-982149",
      label: "VIP Executive Protocol",
      title: "Executive Autonomic & Performance Optimization",
      subtitle: "60-Minute Autonomic Regulation, Epigenetic Review & Performance Synthesis",
      duration: "60 minutes",
      deposit: "$2,500 USD (Held at Intake)",
      description:
        "Tailored autonomic optimization and accelerated telemetry synthesis for executive longevity protocols.",
      highlights: [
        "Direct priority concierge intake routing",
        "Metabolic & molecular biomarker mapping",
        "Extended 1-on-1 clinician baseline synthesis",
      ],
      badgeText: "Template #982149 • Executive Longevity",
    },
    conciergeProtocol: {
      code: "EV-982150",
      label: "Concierge Bespoke Protocol",
      title: "White-Glove Longevity Immersion & Care Concierge",
      subtitle: "90-Minute Full-Spectrum Diagnostics, Dedicated Care Navigator & Priority Hotline",
      duration: "90 minutes",
      deposit: "$5,000 USD (Held at Intake)",
      description:
        "Full white-glove clinical immersion with 24/7 dedicated care navigation and expedited protocol execution.",
      highlights: [
        "Direct tele-desk & dedicated SMS triage channel",
        "Same-day clinical review guarantee",
        "Custom multi-modality therapeutic roadmap",
      ],
      badgeText: "Template #982150 • White-Glove Concierge",
    },
    depositPolicy:
      "All consultation deposits are pre-authorized securely via Stripe and held against the final clinical ledger at intake.",
    cancellationPolicy:
      "Cancellations or modifications made within 48 hours of scheduled consultation forfeit the deposit. In emergency medical circumstances, rescheduling exceptions may be granted at the clinical director's discretion.",
    superbillNotice:
      "Cognitive Edge Clinic operates as an out-of-network private clinic. Itemized Superbills with ICD-10 diagnostic codes and CPT procedural codes are provided via healow portal for private reimbursement.",
  },
  disclaimers: {
    educationalNoticeTitle: "Educational Notice & Zero-ePHI Telemetry",
    educationalNotice:
      "All clinical briefing lectures, monographs, and materials are recorded for accredited clinical education and prospective patient orientation. All patient case studies presented have been de-identified under HIPAA Safe Harbor criteria.",
    safeHarborTitle: "HIPAA Safe Harbor De-Identification Standard",
    safeHarborNotice:
      "Specimen records and clinical visualizations are rendered with zero persistent identifiers. No patient records or telemetric tracking data are collected or retained by the video delivery infrastructure.",
    outOfNetworkTitle: "Out-of-Network Private Practice Disclosure",
    outOfNetworkNotice:
      "Cognitive Edge Clinic is an out-of-network private longevity practice. We do not participate in Medicare, Medicaid, or commercial HMO/PPO plans. Itemized Superbills will be provided through your eClinicalWorks healow portal for individual insurance submission.",
    fdaDisclaimerTitle: "Investigational & Longevity Regulatory Notice",
    fdaDisclaimerNotice:
      "Therapeutic protocols, peptide regimens, and neuromodulation strategies have not been evaluated by the FDA as curative treatments for specific terminal diagnoses. Longevity interventions optimize biological resilience and cellular efficiency under physician supervision.",
    safetyGatesTitle: "Clinical Safety & Contraindications Philosophy",
    safetyGatesSubtitle:
      "Zero-tolerance evidence-based biochemical guardrails and immutable protocol locks.",
    gates: {
      nadOncologyLock: {
        title: "NAD+ & Precursor Oncology Lock",
        condition: "Active oncological diagnosis or history of occult malignancy",
        action: "ABSOLUTE LOCK — NAD+ and NMN precursors strictly prohibited.",
        rationale:
          "High intracellular NAD+ boosts glycolytic flux and can provide metabolic fuel for proliferating malignant cells.",
      },
      b6NeuropathyCeiling: {
        title: "Vitamin B6 Pyridoxine Neuropathy Ceiling",
        condition: "Vitamin B6 / Pyridoxine / Pyridoxal-5-Phosphate (P5P) dosing exceeding 20 mg/day",
        action: "STRICT CEILING — P5P capped strictly below 20 mg/day across all packets.",
        rationale:
          "Chronic high doses saturate metabolic clearance and induce paradoxical dorsal root ganglion peripheral sensory neuropathy.",
      },
      tmsFerromagneticLock: {
        title: "10 Hz DLPFC TMS Ferromagnetic Screening Gate",
        condition: "Metallic implants, cochlear devices, or aneurysm clips within 30 cm of coil",
        action: "ABSOLUTE LOCK — TMS electromagnetic discharge strictly prohibited.",
        rationale:
          "Risk of coil-induced displacement, eddy current heating, and localized thermal lesion.",
      },
      anticoagulantAuditing: {
        title: "Antithrombotic & Omega Co-Administration Gate",
        condition: "Concurrent anticoagulant therapy (Warfarin, NOACs, DOACs, Heparin)",
        action: "MONITOR PT/INR & COAGULATION PROFILE",
        rationale:
          "Mandates monitoring PT/INR and baseline coagulation factor audits to prevent hematoma during subcutaneous access.",
      },
    },
  },
  triage: {
    drawerTitle: "Executive Concierge Tele-Desk",
    drawerSubtitle: "Direct clinician routing with Zero-ePHI isolation & encrypted priority triage.",
    latencyGuardNotice: "Scheduler Latency Guard Active (>3000ms)",
    whiteGloveHeader: "White-Glove Concierge Intake Desk",
    directSms: "Direct SMS",
    callTeleDesk: "Call Tele-Desk",
    hotlineNotice: "Concierge White-Glove Desk: +1 (800) 555-0199",
    hotlineNumber: "+1 (800) 555-0199",
    categoryLabel: "Consultation Category • Stripe Deposit Pre-Authorization",
    fields: {
      fullName: "Full Legal Name",
      fullNamePlaceholder: "e.g. Richard Roe",
      email: "Confidential Email",
      emailPlaceholder: "richard.roe@familyoffice.com",
      phone: "Mobile Number (Optional SMS Updates)",
      phonePlaceholder: "+1 (555) 012-3456",
      consultationWindow: "Preferred Consultation Window",
      clinicalNotes: "Clinical Focus or Priority Inquiries",
      clinicalNotesPlaceholder:
        "e.g. HoloTC methylation evaluation, TMS protocol review, executive autonomic optimization...",
    },
    windows: {
      morning: "Morning (08:00 - 12:00 EST)",
      afternoon: "Afternoon (13:00 - 17:00 EST)",
      evening: "Evening Executive (18:00 - 20:00 EST)",
      urgent: "Urgent / Same-Day Clinical VIP",
    },
    confirmation: {
      badge: "Priority Tele-Desk Enqueued",
      title: "Intake Reservation Dispatched",
      descriptionTemplate:
        "Consultation dispatch for {name} has been routed to the Executive Clinician Queue under {tier}.",
      dispatchReferenceLabel: "DISPATCH REFERENCE:",
      consultationWindowLabel: "CONSULTATION WINDOW:",
      depositAuthorizationLabel: "DEPOSIT AUTHORIZATION:",
      depositAmountTemplate: "${amount} USD (Held at Intake)",
      directHotlineLabel: "DIRECT HOTLINE:",
      smsConfirmButton: "Direct SMS Confirmation",
      callButton: "Call Concierge Desk",
      newReservationButton: "New Reservation",
    },
    actions: {
      submit: "Submit Reservation to Tele-Desk",
      returnToCalendar: "Return to Calendar",
    },
    footerNotice: "Zero-ePHI Ephemeral Triage • Stripe Deposit Pre-Auth",
  },
  zeroEphi: {
    badge: "Zero-ePHI Architecture Active",
    banner: "ZERO-ePHI QUARANTINE ENFORCED",
    statusActive: "Zero-ePHI Quarantine Active",
    quarantineTitle: "Zero-ePHI Quarantine Architecture",
    quarantineDescription:
      "Deterministic sanitization and client-side isolation preventing any Protected Health Information (ePHI) or Personally Identifiable Information (PII) from persisting in browser caches, third-party CDNs, or unencrypted telemetry.",
    ephemeralStateTitle: "Ephemeral Client State",
    ephemeralStateNotice:
      "All pre-screen responses, intake forms, and clinical queries are held strictly in ephemeral memory and discarded upon session completion.",
    hipaaAttestation:
      "HIPAA Safe Harbor verified: specimen and consultation records rendered with zero persistent identifiers.",
    soc2Attestation:
      "SOC2 Type II enclave security standard with zero third-party client trackers.",
    auditStatusPass: "ZERO-ePHI AUDIT: PASS",
    clientIsolationNotice:
      "Form data is transmitted directly into encrypted triage queues with zero local client tracking.",
  },
  ui: {
    buttons: {
      bookConsultation: "Book Consultation",
      initiateIntake: "Initiate Clinical Intake",
      viewMembership: "View Membership Suite",
      close: "Close",
      back: "Back",
      next: "Next",
      submit: "Submit",
      loading: "Loading...",
      cancel: "Cancel",
      retry: "Retry",
    },
    status: {
      active: "Active",
      verified: "Verified",
      locked: "Locked",
      pending: "Pending",
      quarantined: "Quarantined",
    },
    labels: {
      durationMinutes: "{minutes} min • Tier Verified",
      depositAmount: "Deposit: ${amount}",
      priorityAssistance: "Priority Scheduling Assistance • Zero-ePHI Quarantine",
      confidentialNotice: "Confidential Medical Communication • Privileged Channel",
    },
    languages: {
      en: "English",
      sv: "Svenska",
      deCH: "Schweizerdeutsch",
    },
  },
};

export default en;
