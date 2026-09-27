export interface ClinicalService {
  id: string;
  number: string;
  badge: string;
  sessionBadge: string;
  focus: string;
  title: string;
  shortSummary: string;
  expandedOverview: string;
  clinicalMechanisms: string[];
  targetIndications: string[];
}

export const CLINICAL_SERVICES: ClinicalService[] = [
  {
    id: "tms",
    number: "01",
    badge: "NEUROMODULATION",
    sessionBadge: "3 SESSIONS",
    focus:
      "Prefrontal cortex recalibration, executive bandwidth, working memory, and autonomic regulation.",
    title: "Deep Transcranial Magnetic Stimulation (TMS)",
    shortSummary:
      "Precision magnetic pulses targeting dorsolateral prefrontal networks to optimize focus, executive bandwidth, and autonomic balance.",
    expandedOverview:
      "Deploys repetitive and theta-burst electromagnetic protocols to induce cortical neuroplasticity and dendritic arborization. Physician-calibrated for executive optimization, working memory, ADHD, refractory insomnia, anxiety, and depression.",
    clinicalMechanisms: [
      "Long-term potentiation (LTP)",
      "Default Mode Network (DMN) regulation",
      "Central Executive Network (CEN) recalibration",
    ],
    targetIndications: [
      "Executive fatigue",
      "Sustained focus deficits",
      "Academic performance",
      "Insomnia",
      "Anxiety",
      "PTSD",
      "Depression",
    ],
  },
  {
    id: "dementia-prevention",
    number: "02",
    badge: "NEURO-LONGEVITY",
    sessionBadge: "COMPREHENSIVE PROTOCOL",
    focus:
      "Multi-modal early risk stratification for MCI, glymphatic flux acceleration, and anti-amyloid surveillance.",
    title: "Dementia Prevention & Expanded Cognitive Trajectory",
    shortSummary:
      "Multi-modal risk stratification, early biomarker detection, and clinical navigation for MCI and emerging anti-amyloid therapeutics.",
    expandedOverview:
      "Targeted clinical protocols designed to arrest cognitive decline years prior to symptomatic escalation. Integrates blood-brain barrier reinforcement, glymphatic clearance optimization, and physician safety monitoring for monoclonal anti-amyloid infusions.",
    clinicalMechanisms: [
      "Glymphatic flux acceleration",
      "Synaptic density preservation",
      "Amyloid/tau kinetic surveillance",
      "Vascular endothelium repair",
    ],
    targetIndications: [
      "Mild Cognitive Impairment (MCI)",
      "Early memory changes",
      "Familial Alzheimer's predisposition",
      "ApoE4 carriers",
    ],
  },
  {
    id: "peptides",
    number: "03",
    badge: "PEPTIDE BIOREGULATORS",
    sessionBadge: "SUBCUTANEOUS SESSIONS",
    focus:
      "Epitalon, BPC-157, and GHK-Cu bioregulators for telomere transcriptional activation and tissue repair.",
    title: "Cellular Regeneration & Anti-Aging Peptides",
    shortSummary:
      "Physician-guided bioregulator therapy targeting telomere maintenance, cellular senescence mitigation, and rapid tissue recovery.",
    expandedOverview:
      "Synthesizes organ-specific peptide bioregulators (Epitalon, BPC-157, GHK-Cu) to instruct gene transcription, blunt senescence-associated secretory phenotypes (SASP), and accelerate systemic tissue repair.",
    clinicalMechanisms: [
      "Telomerase transcriptional activation",
      "Cellular senescence suppression",
      "Collagen extracellular matrix remodeling",
    ],
    targetIndications: [
      "Biological age deceleration",
      "Systemic tissue wear",
      "Chronic systemic inflammation",
      "Post-injury healing",
    ],
  },
  {
    id: "hormone-optimization",
    number: "04",
    badge: "ENDOCRINE & BHRT",
    sessionBadge: "TARGETED PROTOCOL",
    focus:
      "Subcutaneous testosterone pellet therapy, bio-identical endocrinology, and microvascular pelvic restoration.",
    title: "Sexual Wellness & Advanced Hormone Optimization",
    shortSummary:
      "Precision bio-identical hormone replacement therapy (BHRT), testosterone pellet implantation, and microvascular pelvic restoration.",
    expandedOverview:
      "Comprehensive endocrine recalibration bypassing hepatic first-pass metabolism via extended-release subcutaneous pellet therapy. Synchronized with vascular nitric oxide support and pelvic toning to optimize drive, body composition, and vitality.",
    clinicalMechanisms: [
      "Steady-state systemic androgen delivery",
      "Endothelial nitric oxide synthase (eNOS) upregulation",
      "Lean mass preservation",
    ],
    targetIndications: [
      "Andropause",
      "Age-related hypogonadism",
      "Perimenopausal hormonal depletion",
      "Low libido",
      "Systemic exhaustion",
    ],
  },
  {
    id: "emsella",
    number: "05",
    badge: "HIFEM & VAGAL TONE",
    sessionBadge: "2 SESSIONS",
    focus:
      "Supramaximal pelvic floor contractions, dynamic truncal core stability, and sacral parasympathetic rebound.",
    title: "Pelvic Floor, Truncal Core & Vagal Remodeling (BTL Emsella)",
    shortSummary:
      "High-Intensity Focused Electromagnetic (HIFEM) therapy delivering supramaximal pelvic contractions for core stability and vagal rebound.",
    expandedOverview:
      "The pelvic diaphragm anchors the core musculoskeletal framework and modulates sacral parasympathetic outflow. HIFEM induces thousands of supramaximal contractions per session, restoring bladder control, dynamic spinal stability, and vagal tone.",
    clinicalMechanisms: [
      "Supramaximal motor unit recruitment",
      "Sacral parasympathetic plexus stimulation",
      "Heart-rate variability (HRV) restoration",
    ],
    targetIndications: [
      "Stress/urge urinary incontinence",
      "Truncal instability",
      "Postpartum laxity",
      "Pelvic diaphragm weakness",
      "Autonomic dysregulation",
    ],
  },
  {
    id: "glp1",
    number: "06",
    badge: "METABOLIC MEDICINE",
    sessionBadge: "ONCE-WEEKLY SESSIONS",
    focus:
      "Next-generation multi-receptor incretin therapy for visceral adiposity elimination and brain insulin sensitization.",
    title: "Multi-Action GLP-1 Metabolic Medicine",
    shortSummary:
      "Next-generation dual (GLP-1/GIP) and tri-agonist peptide therapies engineered for visceral fat elimination and neuro-metabolic protection.",
    expandedOverview:
      "Physician-guided incretin therapy targeting central insulin resistance and visceral adiposity. Resets hypothalamic appetite signaling while protecting muscle mass and improving cerebrovascular metabolic efficiency.",
    clinicalMechanisms: [
      "Multi-receptor incretin agonism",
      "Reduction of visceral adiposity",
      "Brain insulin sensitization",
      "Systemic anti-inflammatory signaling",
    ],
    targetIndications: [
      "Visceral obesity",
      "Insulin resistance",
      "Metabolic syndrome",
      "Weight plateaus",
      "Cardiometabolic risk mitigation",
    ],
  },
  {
    id: "photobiomodulation",
    number: "07",
    badge: "MITOCHONDRIAL OPTICS",
    sessionBadge: "3 SESSIONS",
    focus:
      "Transcranial near-infrared light (810nm–1064nm) targeting Cytochrome C Oxidase for ATP and microglial M2 states.",
    title: "Red Light Therapy & Cerebral Photobiomodulation",
    shortSummary:
      "Transcranial and systemic near-infrared light (810nm–1064nm) stimulating Cytochrome C Oxidase to elevate ATP and cerebral blood flow.",
    expandedOverview:
      "Direct photonic stimulation of the mitochondrial electron transport chain. Near-infrared wavelengths penetrate cranium and somatic tissues, dissociating nitric oxide from Cytochrome C Oxidase to surge cellular ATP production and promote microglial M2 repair states.",
    clinicalMechanisms: [
      "Photo-excitation of Cytochrome C Oxidase",
      "ATP synthesis acceleration",
      "Cerebral blood flow perfusion",
      "Oxidative stress reduction",
    ],
    targetIndications: [
      "Cognitive fatigue",
      "Brain fog",
      "Concussion/TBI recovery",
      "Neuro-longevity optimization",
      "Cellular sluggishness",
    ],
  },
  {
    id: "infusions",
    number: "08",
    badge: "TARGETED INFUSIONS",
    sessionBadge: "CLINICAL INFUSIONS",
    focus:
      "Intravenous bioactive coenzymes (5-MTHF, Methyl-B12, P-5-P) to nourish peripheral myelin and nerve tracts.",
    title: "Bespoke Micronutrient & Neuro-Mitochondrial Infusions",
    shortSummary:
      "Direct intravenous infusion of bioavailable coenzymes, methyl-group donors, and antioxidants to fortify nerves and mitochondrial output.",
    expandedOverview:
      "Bypasses gastrointestinal malabsorption to deliver therapeutic concentrations of bioactive coenzymes (5-MTHF, Methyl-B12, P-5-P) and high-dose antioxidants directly to peripheral nerve myelin, spinal cord tracts, and skeletal muscle.",
    clinicalMechanisms: [
      "Gastrointestinal absorption bypass",
      "Enzymatic coenzyme saturation",
      "Glutathione cellular replenishment",
      "Myelin preservation",
    ],
    targetIndications: [
      "Peripheral neuropathy",
      "Mitochondrial exhaustion",
      "Chronic fatigue",
      "Drug-induced nutrient depletions",
    ],
  },
  {
    id: "nad-bdnf",
    number: "09",
    badge: "COENZYME SATURATION",
    sessionBadge: "SATURATION PROTOCOL",
    focus:
      "High-dose NAD+ replenishment and TrkB/CREB neurotrophic stimulation for active synaptogenesis and longevity.",
    title: "Intracellular NAD+, BDNF & Coenzyme Amplification",
    shortSummary:
      "High-dose NAD+ replenishment, one-carbon metabolic rescue, and targeted upregulation of Brain-Derived Neurotrophic Factor.",
    expandedOverview:
      "Restores the master metabolic coenzyme required for sirtuin-mediated DNA repair and cellular longevity. Paired with targeted pharmacological and biological modulators of BDNF to promote active synaptogenesis and long-term cognitive resilience.",
    clinicalMechanisms: [
      "SIRT1/SIRT3 deacetylase activation",
      "PARP-mediated DNA repair",
      "TrkB receptor activation",
      "Neurotrophin amplification",
    ],
    targetIndications: [
      "Age-associated cognitive deceleration",
      "Bioenergetic depletion",
      "Neurological stamina deficits",
      "Longevity prophylaxis",
    ],
  },
];

export const PROTOCOLS = CLINICAL_SERVICES;
export default CLINICAL_SERVICES;
