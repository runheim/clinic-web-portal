export interface MolecularTarget {
  name: string;
  mechanism: string;
  biomarkerRange?: string;
  coFactors?: string[];
}

export interface ContraindicationRule {
  condition: string;
  action: string;
  rationale: string;
  isAbsolute: boolean;
}

export interface ServiceProtocol {
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  abstract: string;
  molecularTargets: MolecularTarget[];
  clinicalCadence: {
    frequency: string;
    duration: string;
    monitoringCorridor: string;
    deliveryMethod: string;
  };
  contraindicationsGate: {
    summary: string;
    rules: ContraindicationRule[];
  };
  clinicalEvidence: string[];
}

export const servicesData: ServiceProtocol[] = [
  {
    slug: "tms-neuromodulation",
    title: "TMS Neuromodulation",
    subtitle: "DLPFC Neuroplasticity & Ca-AKG Synaptic Restoration",
    tagline: "Restoring Cortical Excitability & Resolving Prefrontal Latency",
    abstract:
      "Targeted theta-burst and high-frequency (10 Hz) repetitive magnetic pulses directed at the left dorsolateral prefrontal cortex (DLPFC). By coupling magnetic recalibration with metabolic epigenetic priming via Calcium-Alpha-Ketoglutarate (Ca-AKG), we upregulate brain-derived neurotrophic factor (BDNF), restore long-term potentiation (LTP), and mitigate autonomic hypofrontality in high-performing individuals.",
    molecularTargets: [
      {
        name: "NMDA / AMPA Receptor Trafficking",
        mechanism: "Enhances synaptic plasticity and post-synaptic receptor density in prefrontal networks.",
        biomarkerRange: "Cortical silent period normalized to 110–140 ms",
        coFactors: ["Ca-AKG (1000 mg)", "L-Threonate Magnesium (144 mg elemental)"],
      },
      {
        name: "DLPFC Monoaminergic Flux",
        mechanism: "Stimulates striatal dopamine and serotonin release across fronto-striatal circuits.",
        biomarkerRange: "Baseline urinary neurotransmitter profile calibrated",
        coFactors: ["BH4 (Tetrahydrobiopterin)", "Active Methylation Donors"],
      },
      {
        name: "Autonomic Tone (LF/HF Ratio)",
        mechanism: "Upregulates parasympathetic vagal braking, lowering executive stress arousal.",
        biomarkerRange: "LF/HF Ratio target < 1.5 during cognitive load",
      },
    ],
    clinicalCadence: {
      frequency: "3 sessions weekly for 6 weeks",
      duration: "20 minutes per targeted session",
      monitoringCorridor: "Continuous 64-channel baseline EEG & quantitative HRV telemetry",
      deliveryMethod: "Figure-8 localized magnetic coil with stereotactic neuronavigation",
    },
    contraindicationsGate: {
      summary: "Absolute neuro-structural safety screening mandatory prior to magnetic field discharge.",
      rules: [
        {
          condition: "Metallic implants or aneurysm clips in cephalic region (< 30 cm from coil)",
          action: "ABSOLUTE LOCK — TMS strictly prohibited.",
          rationale: "Risk of coil-induced displacement, eddy current heating, and localized thermal lesion.",
          isAbsolute: true,
        },
        {
          condition: "History of unprovoked epilepsy or cortical seizure focus",
          action: "ABSOLUTE LOCK — Referral for standard diagnostic neurology.",
          rationale: "High-frequency stimulation lowers cortical seizure threshold.",
          isAbsolute: true,
        },
        {
          condition: "Cochlear implants or deep brain stimulation (DBS) electrodes",
          action: "ABSOLUTE LOCK",
          rationale: "Electromagnetic interference with embedded impulse generators.",
          isAbsolute: true,
        },
      ],
    },
    clinicalEvidence: [
      "Blumberger et al., Lancet 2018 (Accelerated theta-burst prefrontal stimulation).",
      "Shahbazi et al., Cell Reports 2021 (Alpha-ketoglutarate mediated epigenetic neuro-protection).",
    ],
  },
  {
    slug: "subcutaneous-peptides",
    title: "Subcutaneous Peptides",
    subtitle: "Epitalon for Pineal Circadian Repair, GHK-Cu, BPC-157",
    tagline: "Cellular Senescence Mitigation & Microvascular Endothelial Regeneration",
    abstract:
      "A calibrated regime of bio-identical and synthetic peptides administered via low-volume subcutaneous corridors. Utilizing Epitalon (pineal tetrapeptide) for telomerase elongation and circadian clock resetting, GHK-Cu for TGF-beta modulation and collagen scaffolding, and BPC-157 for gut-blood-brain barrier endothelial repair and angiogenic stabilization.",
    molecularTargets: [
      {
        name: "Epitalon (Ala-Glu-Asp-Gly)",
        mechanism: "Induces telomerase expression, resets pineal melatonin biorhythms, and optimizes deep slow-wave sleep.",
        biomarkerRange: "Urinary 6-sulfatoxymelatonin > 15 ng/mL morning nadir",
      },
      {
        name: "GHK-Cu (Gly-His-Lys Copper Complex)",
        mechanism: "Reprograms gene expression to youthful profiles; downregulates pro-inflammatory cytokines (IL-6, TNF-alpha).",
        biomarkerRange: "Free serum copper balanced with ceruloplasmin ratio < 1.2",
      },
      {
        name: "BPC-157 (Body Protection Compound pentadecapeptide)",
        mechanism: "Upregulates VEGFR2 and eNOS, accelerating mucosal and microvascular blood-brain barrier restoration.",
        biomarkerRange: "Zonulin < 38 ng/mL, hs-CRP < 0.5 mg/L",
      },
    ],
    clinicalCadence: {
      frequency: "Subcutaneous micro-injections 5 days on / 2 days off for 8-week cyclical blocks",
      duration: "8-week on-cycle followed by 4-week biological refractory reset",
      monitoringCorridor: "Comprehensive monthly clinical chem-screen and serum copper/ceruloplasmin ratio",
      deliveryMethod: "31G 5/16\" micro-syringe subcutaneous umbilical/thigh administration",
    },
    contraindicationsGate: {
      summary: "Strict proliferation safety gate enforcing cellular senescence over accelerated division.",
      rules: [
        {
          condition: "Active or historical malignancy, oncological lesion, or positive screening biomarkers",
          action: "ABSOLUTE LOCK — Peptide therapy strictly contraindicated.",
          rationale: "VEGF up-regulation and angiogenic peptides may potentiate occult neoplastic vascularization.",
          isAbsolute: true,
        },
        {
          condition: "Concurrent anticoagulant therapy (Warfarin, NOACs, Heparin)",
          action: "MONITOR PT/INR & COAGULATION PROFILE",
          rationale: "Monitoring PT/INR for anticoagulant use is required to prevent deep hematoma during subcutaneous access.",
          isAbsolute: false,
        },
        {
          condition: "Active systemic lupus erythematosus or acute autoimmune flare",
          action: "HOLD — Require immunologist clearance.",
          rationale: "Th1/Th2 cytokine modulation may exacerbate systemic immune reactivity.",
          isAbsolute: false,
        },
      ],
    },
    clinicalEvidence: [
      "Khavinson et al., Neuroendocrinology Letters 2011 (Pineal peptides and cellular longevity).",
      "Pickart et al., Int J Mol Sci 2018 (GHK-Cu gene modulation in regenerative medicine).",
    ],
  },
  {
    slug: "btl-emsella-pelvic-core",
    title: "BTL Emsella Pelvic Core Stabilization",
    subtitle: "HIFEM Pelvic-Gluteal Core Box Training",
    tagline: "Fortifying Pelvic Floor Architecture & Re-Anchoring Vagal Autonomic Reserve",
    abstract:
      "Non-invasive supramaximal electromagnetic contractions targeting the deep pelvic floor musculature, levator ani, and sacral nerve plexus. Beyond urogenital architecture, pelvic diaphragmatic strength directly couples with thoracic respiratory dynamics and vagal parasympathetic innervation, relieving chronic sympathetic lock and improving sleep-wake autonomic oscillations.",
    molecularTargets: [
      {
        name: "Sacral Parasympathetic Nuclei (S2–S4)",
        mechanism: "Recalibrates visceral afferent traffic to the nucleus tractus solitarius, enhancing baroreflex sensitivity.",
        biomarkerRange: "Resting heart rate variability (rMSSD) > 55 ms",
      },
      {
        name: "Fast-Twitch Myofibril Hyperplasia",
        mechanism: "Delivers 11,200 supramaximal contractions per 28-minute session without neuromuscular fatigue.",
        biomarkerRange: "Pelvic floor endurance tonometry score > 85%",
      },
    ],
    clinicalCadence: {
      frequency: "2 sessions weekly for 3 consecutive weeks (6 total sessions)",
      duration: "28 minutes per session (fully clothed chair sitting)",
      monitoringCorridor: "Bi-weekly pelvic floor tonometry and autonomic nervous system stress response scores",
      deliveryMethod: "Focused electromagnetic chair transducer producing 2.5 Tesla magnetic field",
    },
    contraindicationsGate: {
      summary: "Absolute electromagnetic safety gate for truncal and metallic devices.",
      rules: [
        {
          condition: "Cardiac pacemaker, defibrillator, or neurostimulator implants",
          action: "ABSOLUTE LOCK — HIFEM electromagnetic emission strictly prohibited.",
          rationale: "Induced high-intensity electromagnetic fields disrupt internal circuitry and pacing.",
          isAbsolute: true,
        },
        {
          condition: "Metallic intrauterine devices (e.g., Copper IUD) or pelvic surgical mesh",
          action: "ABSOLUTE LOCK — Only non-metallic (e.g., hormonal) IUDs permitted.",
          rationale: "Risk of focal magnetic heating and tissue displacement.",
          isAbsolute: true,
        },
        {
          condition: "Active pregnancy",
          action: "ABSOLUTE LOCK",
          rationale: "Uterine muscle hyper-stimulation contraindicated during gestation.",
          isAbsolute: true,
        },
      ],
    },
    clinicalEvidence: [
      "Samuels et al., Lasers Surg Med 2019 (HIFEM technology for pelvic floor neuromodulation).",
      "Bader et al., Int Urogynecol J 2020 (Supramaximal pelvic floor muscle conditioning).",
    ],
  },
  {
    slug: "cerebral-photobiomodulation",
    title: "Cerebral Photobiomodulation",
    subtitle: "Near-Infrared Red Light Mitochondrial Therapy",
    tagline: "Stimulating Cytochrome C Oxidase & Cortical Vascular Hemodynamics",
    abstract:
      "Precision transcranial near-infrared light delivery (810 nm and 1064 nm) pulsed at 10 Hz (Alpha) or 40 Hz (Gamma) targeting the cortical default mode and central executive networks. Photons penetrate the cranium to interact with cytochrome c oxidase in the mitochondrial respiratory chain, accelerating ATP production, releasing nitric oxide, and dilating deep cerebral microvasculature.",
    molecularTargets: [
      {
        name: "Cytochrome c Oxidase (Unit IV)",
        mechanism: "Displaces inhibitory nitric oxide from enzyme center, stimulating oxygen consumption and ATP generation.",
        biomarkerRange: "Cortical tissue oxygenation index (TOI) increase of 8–14%",
      },
      {
        name: "40 Hz Gamma Microglial Clearance",
        mechanism: "Pulsed 40 Hz optical entrainment activates microglial phagocytosis, accelerating beta-amyloid debris clearance.",
        biomarkerRange: "Quantitative EEG 40 Hz coherence power mapped",
      },
      {
        name: "Endothelial Nitric Oxide Synthase (eNOS)",
        mechanism: "Promotes transient vasodilation, increasing cortical micro-perfusion and neurovascular coupling.",
        biomarkerRange: "Middle cerebral artery flow velocity monitored via transcranial Doppler",
      },
    ],
    clinicalCadence: {
      frequency: "3 sessions weekly for 8 weeks",
      duration: "20 minutes transcranial + 10 minutes systemic intravascular LED corridor",
      monitoringCorridor: "Pre- and post-session functional near-infrared spectroscopy (fNIRS) and Stroop task reaction latency",
      deliveryMethod: "Transcranial synchronized LED array with intranasal mucosal diode",
    },
    contraindicationsGate: {
      summary: "Light sensitivity and cranial barrier safety gate.",
      rules: [
        {
          condition: "Active malignant cranial neoplasm or intracranial lesion",
          action: "ABSOLUTE LOCK",
          rationale: "Stimulation of mitochondrial ATP and blood flow could foster tumor growth.",
          isAbsolute: true,
        },
        {
          condition: "Concurrent use of photodynamic therapy or potent photosensitizing medications",
          action: "HOLD — 14-day clearance required.",
          rationale: "Risk of phototoxic tissue erythema or hyper-reactivity.",
          isAbsolute: false,
        },
      ],
    },
    clinicalEvidence: [
      "Hamblin MR., BBA Clinical 2016 (Photobiomodulation for brain disorders).",
      "Chao LL., Photobiomodul Photomed Laser Surg 2019 (Transcranial PBM for cognitive performance).",
    ],
  },
  {
    slug: "glp1-metabolic-optimization",
    title: "GLP-1 Metabolic Optimization",
    subtitle: "Dual/Tri-Agonist Weight Management Protocols",
    tagline: "Extinguishing Hypothalamic Neuro-Inflammation & Calibrating Glycemic Corridors",
    abstract:
      "Age- and sex-calibrated subcutaneous dosing of GLP-1, GIP, and Glucagon receptor agonists combined with stoichiometric nutrient repletion. By crossing the blood-brain barrier to bind GLP-1 receptors in the arcuate nucleus and hippocampus, dual/tri-agonists resolve systemic insulin resistance, extinguish hypothalamic microglial inflammation, and sharpen executive focus without sarcopenic muscle loss.",
    molecularTargets: [
      {
        name: "GLP-1R & GIPR Arcuate Signaling",
        mechanism: "Suppresses pro-inflammatory NF-kB signaling while enhancing insulin receptor sensitivity in the hippocampus.",
        biomarkerRange: "Fasting Insulin < 4.0 uIU/mL, HOMA-IR < 1.0",
      },
      {
        name: "Visceral Adiposity & Adiponectin",
        mechanism: "Mobilizes visceral retroperitoneal fat deposits while maintaining lean skeletal muscle mass via essential amino acid co-administration.",
        biomarkerRange: "DEXA Visceral Adipose Tissue (VAT) < 50 cm²",
      },
      {
        name: "HbA1c Glycemic Stability",
        mechanism: "Stabilizes glycemic variability, eliminating postprandial cognitive fog and hypoglycemic cortisol surges.",
        biomarkerRange: "HbA1c strictly between 4.8% and 5.2%",
      },
    ],
    clinicalCadence: {
      frequency: "Once-weekly subcutaneous micro-titration",
      duration: "Longitudinal monitoring over 16-week cycles",
      monitoringCorridor: "Continuous glucose monitoring (CGM) + bi-weekly DEXA lean muscle mass verification",
      deliveryMethod: "Calibrated auto-injector pen with physician-supervised dose step-up",
    },
    contraindicationsGate: {
      summary: "Endocrine and thyroid oncological safety gate.",
      rules: [
        {
          condition: "Personal or familial history of Medullary Thyroid Carcinoma (MTC) or MEN 2",
          action: "ABSOLUTE LOCK — GLP-1 receptor agonists strictly prohibited.",
          rationale: "Thyroid C-cell hyperplasia risk established in rodent and preclinical models.",
          isAbsolute: true,
        },
        {
          condition: "History of acute or chronic necrotizing pancreatitis",
          action: "ABSOLUTE LOCK",
          rationale: "Exocrine pancreatic hyper-stimulation may precipitate recurrent pancreatitis.",
          isAbsolute: true,
        },
        {
          condition: "Concurrent anticoagulant therapy (Warfarin, Eliquis)",
          action: "MONITOR PT/INR & COAGULATION",
          rationale: "Altered gastric emptying time can temporarily modify oral anticoagulant absorption kinetics.",
          isAbsolute: false,
        },
      ],
    },
    clinicalEvidence: [
      "Drucker DJ., Science 2020 (The cardiovascular and neuro-protective biology of incretin hormones).",
      "Jastreboff et al., NEJM 2022 (Tirzepatide once weekly for the treatment of metabolic dysfunction).",
    ],
  },
  {
    slug: "mitochondrial-bioenergetics",
    title: "Mitochondrial Bioenergetics Resuscitation",
    subtitle: "Ubiquinol, PQQ, TTFD, and RBC Magnesium (>6.0 mg/dL)",
    tagline: "Bypassing Enzyme Hysteresis & Ensuring Stoichiometric Coenzyme Saturation",
    abstract:
      "A clinical biochemist-formulated saturation regimen engineered to replenish intracellular cofactor pools and bypass metabolic rate-limiting bottlenecks. We target intracellular NAD+ concentrations between 40–100 μM, mandate red blood cell (RBC) magnesium corridors > 6.0 mg/dL, and supply lipid-soluble thiamine (TTFD) to fuel the pyruvate dehydrogenase complex and ensure continuous cerebral ATP generation.",
    molecularTargets: [
      {
        name: "Intracellular NAD+ Pool (40–100 μM)",
        mechanism: "Substrate for SIRT1 and PARP enzymes; restores cellular DNA repair and mitochondrial sirtuin signaling.",
        biomarkerRange: "Whole blood intracellular NAD+ target: 40–100 μM",
        coFactors: ["Nicotinamide Riboside (NR)", "Trimethylglycine (TMG)"],
      },
      {
        name: "Pyruvate Dehydrogenase / Alpha-KGDH",
        mechanism: "Supplies lipophilic TTFD (thiamine tetrahydrofurfuryl disulfide) crossing BBB without carrier saturation.",
        biomarkerRange: "Whole Blood Thiamine Pyrophosphate > 180 nmol/L",
      },
      {
        name: "RBC Magnesium Transport",
        mechanism: "Magnesium chelated to ATP inside erythrocytes; essential cofactor for all 8 enzymes of the Krebs Cycle.",
        biomarkerRange: "RBC Magnesium strictly > 6.0 mg/dL (optimal: 6.2–6.8 mg/dL)",
      },
      {
        name: "Pyrroloquinoline Quinone (PQQ) & Ubiquinol",
        mechanism: "Stimulates PGC-1alpha for mitochondrial biogenesis while maintaining electron transport chain complex I/III redox flow.",
        biomarkerRange: "Serum CoQ10 > 4.0 ug/mL",
      },
    ],
    clinicalCadence: {
      frequency: "Daily oral stoichiometric packet + bi-weekly targeted bioenergetic IV infusion suite",
      duration: "Ongoing 12-week titration blocks with monthly intracellular mass-spectrometry",
      monitoringCorridor: "Intracellular NAD+ mass spectrometry, RBC Magnesium, and full organic acid metabolic panel",
      deliveryMethod: "Liposomal oral cofactors + slow-infusion isotonic peripheral IV cannula",
    },
    contraindicationsGate: {
      summary: "High-Contrast Safety Contraindications Panel protecting against oncological proliferation and sensory neuropathy.",
      rules: [
        {
          condition: "Active oncological diagnosis or history of occult malignancy",
          action: "ABSOLUTE LOCK ON NAD+ / NMN PRECURSORS — Cellular saturation locked.",
          rationale: "High intracellular NAD+ boosts glycolytic flux and can provide metabolic fuel for proliferating malignant cells.",
          isAbsolute: true,
        },
        {
          condition: "Vitamin B6 / Pyridoxine / Pyridoxal-5-Phosphate (P5P) dosing > 20 mg/day",
          action: "STRICT CEILING — P5P capped strictly below 20 mg/day across all packets.",
          rationale: "Chronic doses above 20 mg/day can saturate clearance and cause paradoxical peripheral sensory neuropathies and dorsal root ganglionopathy.",
          isAbsolute: true,
        },
        {
          condition: "Concurrent anticoagulant therapy (Warfarin, NOACs)",
          action: "MONITOR PT/INR FOR ANTICOAGULANT USE",
          rationale: "Requires monitoring PT/INR for anticoagulant use due to high-dose coenzyme Q10 and vitamin interaction with hepatic clotting factor synthesis.",
          isAbsolute: true,
        },
        {
          condition: "Severe renal impairment (eGFR < 30 mL/min/1.73m²)",
          action: "HOLD ON HIGH-DOSE MAGNESIUM",
          rationale: "Impaired urinary magnesium clearance risks symptomatic hypermagnesemia.",
          isAbsolute: true,
        },
      ],
    },
    clinicalEvidence: [
      "Trammell et al., Nature Communications 2016 (Nicotinamide riboside uniquely increases cellular NAD+).",
      "Ames BN., PNAS 2018 (Prolonging healthy aging: Longevity vitamins and minerals).",
    ],
  },
  {
    slug: "bdnf-synaptic-preservation",
    title: "BDNF Amplification & Synaptic Density Preservation",
    subtitle: "Targeted Neurotrophin Upregulation & Dendritic Arborization",
    tagline: "Securing Structural Synaptic Density Against Age-Related Neuro-Attrition",
    abstract:
      "A multi-modal neuro-biological protocol combining high-affinity TrkB receptor agonists (7,8-Dihydroxyflavone), cold-shock RBM3 induction, and targeted nootropic co-factors. Engineered to sustain elevated Brain-Derived Neurotrophic Factor (BDNF) levels, fortifying hippocampal synaptic spine density and preserving cognitive speed in demanding professional environments.",
    molecularTargets: [
      {
        name: "Tropomyosin Receptor Kinase B (TrkB)",
        mechanism: "Small-molecule flavone mimetic binds TrkB with high affinity, initiating downstream ERK/Akt neuroprotective signaling.",
        biomarkerRange: "Serum BDNF > 28 ng/mL",
      },
      {
        name: "RBM3 (RNA-Binding Motif Protein 3)",
        mechanism: "Triggered via controlled therapeutic hypothermia pulses; prevents synaptic loss and rebuilds lost dendrites.",
        biomarkerRange: "Cognitive latency tests (Stroop / CPT3) within top 1st percentile",
      },
      {
        name: "Choline Acetyltransferase (ChAT) Flux",
        mechanism: "Ensures abundant acetylcholine synthesis for long-term encoding and synaptic signal fidelity.",
        biomarkerRange: "CDP-Choline and Alpha-GPC balanced without TMAO elevation",
      },
    ],
    clinicalCadence: {
      frequency: "5 days weekly morning nootropic protocol + twice-weekly neuro-vascular stimulation",
      duration: "12-week sustained amplification phase",
      monitoringCorridor: "Baseline and 6-week serum BDNF, cognitive processing speed index, and sleep architecture EEG",
      deliveryMethod: "Sublingual micro-emulsion + targeted transcranial magnetic stimulation",
    },
    contraindicationsGate: {
      summary: "Neuro-vascular and cholinergic sensitivity safety gate.",
      rules: [
        {
          condition: "History of intracranial hemorrhage or active cerebral cavernous malformations",
          action: "ABSOLUTE LOCK on intense neuro-vascular therapies.",
          rationale: "Altered intracranial hemodynamics contraindicated with vascular malformations.",
          isAbsolute: true,
        },
        {
          condition: "Concurrent anticoagulant therapy",
          action: "MONITOR PT/INR & COAGULATION",
          rationale: "Intense neuro-vascular therapies require baseline coagulation validation.",
          isAbsolute: false,
        },
        {
          condition: "Elevated baseline TMAO (> 6.2 uM)",
          action: "HOLD on high-dose choline donors — switch to phosphatidylserine.",
          rationale: "Mitigates cardiovascular and atherosclerotic risk.",
          isAbsolute: false,
        },
      ],
    },
    clinicalEvidence: [
      "Jang et al., PNAS 2010 (7,8-DHF as a potent small molecule TrkB agonist).",
      "Peretti et al., Nature 2015 (RBM3 and the structural repair of synaptic contacts).",
    ],
  },
];
