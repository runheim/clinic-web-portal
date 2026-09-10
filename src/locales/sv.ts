import type { Dictionary } from "@/lib/i18n/types";

/**
 * Swedish Dictionary (sv)
 * Scandinavian Longevity Research Hub / Uppsala Clinical Dialect
 * Precision Neuro-Metabolic Longevity Medicine Standard
 */
export const sv: Dictionary = {
  meta: {
    locale: "sv",
    localeName: "Svenska",
    language: "Svenska",
    region: "Sverige / Norden",
    clinicalDialect: "Skandinaviskt Longevity-Forskningsnav (Uppsala Klinisk Dialekt)",
  },
  navigation: {
    brandName: "Cognitive Edge Clinic",
    brandTagline: "Neurometabolisk Resuscitation • Klinisk Precisionslongevity",
    services: "Kliniska Modaliteter",
    ledger: "Vetenskaplig Huvudbok",
    briefings: "Vetenskapliga Orienteringar",
    membership: "VIP Medlemskap",
    biographies: "Medicinskt Ledarskap",
    diagnosticVault: "Diagnostiskt Arkiv",
    intakeAssessment: "Intagningsbedömning",
    memberLogin: "Medlemsinloggning",
    clientPortal: "Klientportal",
    search: "Sök",
    searchAria: "Sök kliniska modaliteter, biomarkörer, orienteringar och åtgärder (Cmd+K)",
    portalGateway: "eClinicalWorks Vårdportal",
    spruceRelay: "Spruce Care Web",
    systemStatus: "Systemstatus & Enklavtelemetri",
  },
  modalities: {
    tmsNeuromodulation: {
      title: "TMS-Neuromodulering",
      subtitle: "DLPFC Neuroplasticitet & Synaptisk Återställning med Ca-AKG",
      tagline: "Återställer kortikal excitabilitet & eliminerar prefrontal latens",
      abstract:
        "Riktade theta-burst och högfrekventa (10 Hz) repetitiva magnetiska pulser mot vänster dorsolaterala prefrontala cortex (DLPFC). Genom att koppla magnetisk rekalibrering med metabol epigenetisk priming via kalcium-alfa-ketoglutarat (Ca-AKG), uppreglerar vi hjärnhärledd neurotrofisk faktor (BDNF), återställer långtidspotentiering (LTP) och dämpar autonom hypofrontalitet hos högpresterande individer.",
      clinicalCadence: "3 sessioner per vecka under 6 veckor (20 minuter per riktad session)",
      deliveryMethod: "Figur-8 lokaliserad magnetspole med stereotaktisk neuronavigering",
    },
    subcutaneousPeptides: {
      title: "Subkutana Peptider",
      subtitle: "Epitalon för tallkottkörtelns dygnsrytmreparation, GHK-Cu, BPC-157",
      tagline: "Mitigering av cellulär senescens & mikrovaskulär endotelregeneration",
      abstract:
        "En kalibrerad regim av bioidentiska och syntetiska peptider administrerade via lågvolymiga subkutana korridorer. Använder Epitalon (epifysär tetrapeptid) för telomerasförlängning och återställning av den cirkadiska klockan, GHK-Cu för TGF-beta-modulering och kollagenmatrix-reparation, samt BPC-157 för endotelreparation av tarm-blod-hjärnbarriären och angiogen stabilisering.",
      clinicalCadence: "Subkutana mikroinjektioner 5 dagar i följd / 2 dagars uppehåll i 8-veckors cykler",
      deliveryMethod: '31G 5/16" mikrospruta för subkutan administrering vid navel/lår',
    },
    btlEmsella: {
      title: "BTL Emsella Bäckencentrumstabilisering",
      subtitle: "HIFEM Träning för Pelvisk-Gluteal Kärna",
      tagline: "Förstärkning av bäckenbottenarkitektur & förankring av vagal autonom reserv",
      abstract:
        "Icke-invasiva supramaximala elektromagnetiska kontraktioner riktade mot den djupa bäckenbottenmuskulaturen, levator ani och sakrala nervplexat. Utöver urogenital arkitektur kopplar bäckenmembranets styrka direkt till torakal andningsdynamik och vagal parasympatisk innervering, vilket löser kroniskt sympatiskt lås och förbättrar autonoma sömn-vaken-oscillationer.",
      clinicalCadence: "2 sessioner per vecka under 3 konsekutiva veckor (totalt 6 sessioner om 28 minuter)",
      deliveryMethod: "Fokuserad elektromagnetisk stolstransducer som genererar ett 2,5 Tesla magnetfält",
    },
    cerebralPhotobiomodulation: {
      title: "Cerebral Fotobiomodulering",
      subtitle: "Mitokondriell Terapi med Nära Infrarött Rött Ljus",
      tagline: "Stimulerar cytokrom c-oxidas & kortikal vaskulär hemodynamik",
      abstract:
        "Precisionstranskranial distribution av nära infrarött ljus (810 nm och 1064 nm) pulserat vid 10 Hz (Alfa) eller 40 Hz (Gamma) riktat mot hjärnans 'default mode'- och centrala exekutiva nätverk. Fotoner penetrerar kraniet för att interagera med cytokrom c-oxidas i den mitokondriella andningskedjan, vilket accelererar ATP-produktion, frisätter kväveoxid och dilaterar djup cerebral mikrovaskulatur.",
      clinicalCadence: "3 sessioner per vecka under 8 veckor (20 min transkraniellt + 10 min intranasal diod)",
      deliveryMethod: "Transkranial synkroniserad LED-matris med intranasal slemhinnediod",
    },
    glp1MetabolicOptimization: {
      title: "GLP-1 Metabol Optimering",
      subtitle: "Dual-/Tri-Agonist Protokoll för Metabol Reglering",
      tagline: "Släcker hypotalamisk neuroinflammation & kalibrerar glykemiska korridorer",
      abstract:
        "Ålders- och könskalibrerad subkutan dosering av GLP-1-, GIP- och glukagonreceptoragonister kombinerat med stökiometrisk näringsrepletion. Genom att passera blod-hjärnbarriären för att binda till GLP-1-receptorer i nucleus arcuatus och hippocampus eliminerar dual-/tri-agonister systemisk insulinresistens, släcker mikrogliainflammation i hypotalamus och skärper exekutivt fokus utan sarkopen muskelförlust.",
      clinicalCadence: "En gång per vecka subkutan mikrotitrering under longitudinella 16-veckors cykler",
      deliveryMethod: "Kalibrerad autoinjektorpenna med läkarsuperviserad dosupptrappning",
    },
    mitochondrialBioenergetics: {
      title: "Resuscitation av Mitokondriell Bioenergetik",
      subtitle: "Ubiquinol, PQQ, TTFD och Erytrocyt-Magnesium (>6,0 mg/dL)",
      tagline: "Kringgår enzymhysteres & säkerställer stökiometrisk koenzymmättning",
      abstract:
        "En klinisk biokemistformulerad mättnadsregim utformad för att fylla på intracellulära kofaktordepåer och kringgå metabola hastighetsbegränsande flaskhalsar. Vi riktar in oss på intracellulära NAD+-koncentrationer mellan 40–100 μM, kräver röda blodkroppars (RBC) magnesiumkorridorer > 6,0 mg/dL, och tillför lipidlösligt tiamin (TTFD) för att driva pyruvatdehydrogenaskomplexet och säkerställa kontinuerlig cerebral ATP-generering.",
      clinicalCadence: "Dagligt oralt stökiometriskt paket + varannan vecka riktad bioenergetisk IV-infusionssvit",
      deliveryMethod: "Liposomala orala kofaktorer + långsaminfunderad isoton perifer IV-kanyl",
    },
    bdnfSynapticPreservation: {
      title: "BDNF-Amplifiering & Bevarande av Synaptisk Densitet",
      subtitle: "Riktad Neurotrofinuppreglering & Dendritisk Arborisering",
      tagline: "Säkrar strukturell synaptisk densitet mot åldersrelaterad neuro-attrition",
      abstract:
        "Ett multimodalt neurobiologiskt protokoll som kombinerar högaffinitets-TrkB-receptoragonister (7,8-dihydroxiflavon), köldchocksinduktion av RBM3 och riktade nootropiska kofaktorer. Utformat för att upprätthålla förhöjda nivåer av hjärnhärledd neurotrofisk faktor (BDNF), stärka hippocampala synaptiska utskott och bevara kognitiv hastighet i krävande professionella miljöer.",
      clinicalCadence: "5 dagar i veckan morgonprotokoll med nootropika + 2 gånger i veckan neurovaskulär stimulering",
      deliveryMethod: "Sublingual mikroemulsion + riktad transkraniell magnetstimulering",
    },
  },
  feeTiers: {
    clinicalEvaluation: {
      code: "EV-982148",
      label: "Klinisk Diagnostisk Utvärdering",
      title: "Privat Konsultationsreservation",
      subtitle:
        "Omfattande 45-minuters diagnostisk konsultation & baslinjekartläggning • Dr David Andreas Runheim, leg. läkare",
      duration: "45 minuter",
      deposit: "1 000 USD (Deposition vid inskrivning)",
      description:
        "Djupgående klinisk neurodiagnostisk bedömning, baslinjebiomarkörer och kvantitativ kognitiv kartläggning.",
      highlights: [
        "Multi-omik & neurofunktionell granskning",
        "Kvantitativa kognitiva baslinjemått",
        "Direkt konsultation med medicinskt ansvarig överläkare",
      ],
      badgeText: "Mall #982148 • Neurodiagnostisk Baslinje",
    },
    vipExecutive: {
      code: "EV-982149",
      label: "VIP Exekutivt Protokoll",
      title: "Exekutiv Autonom Reglering & Prestationsoptimering",
      subtitle: "60-minuters autonom reglering, epigenetisk granskning & prestationssyntes",
      duration: "60 minuter",
      deposit: "2 500 USD (Deposition vid inskrivning)",
      description:
        "Skräddarsydd autonom optimering och accelererad telemetrisyntes för ledande befattningshavares longevity-protokoll.",
      highlights: [
        "Direkt prioriterad concierge-intagningsdirigering",
        "Metabolisk & molekylär biomarkörkartläggning",
        "Utökad 1-till-1 klinisk baslinjesyntes",
      ],
      badgeText: "Mall #982149 • Exekutiv Longevity",
    },
    conciergeProtocol: {
      code: "EV-982150",
      label: "Concierge Skräddarsytt Protokoll",
      title: "White-Glove Longevity Immersion & Vårdconcierge",
      subtitle: "90-minuters fullspektrumdiagnostik, dedikerad vårdnavigator & prioriterad jourlinje",
      duration: "90 minuter",
      deposit: "5 000 USD (Deposition vid inskrivning)",
      description:
        "Komplett white-glove klinisk immersion med dedikerad vårdkoordinator dygnet runt och påskyndat protokollutförande.",
      highlights: [
        "Direkt teledesk & dedikerad SMS-triagekanal",
        "Garanterad klinisk granskning samma dag",
        "Anpassad multimodal terapeutisk färdplan",
      ],
      badgeText: "Mall #982150 • White-Glove Concierge",
    },
    depositPolicy:
      "Samtliga konsultationsdepositioner förhandssauktoriseras via Stripe och avräknas mot den slutliga kliniska huvudboken vid inskrivning.",
    cancellationPolicy:
      "Avbokningar eller ändringar som görs senare än 48 timmar före schemalagd konsultation medför förverkad deposition. Vid medicinska nödsituationer kan ombokningsundantag beviljas efter medicinskt direktörsbeslut.",
    superbillNotice:
      "Cognitive Edge Clinic bedriver privat specialistvård utanför avtal. Specificerad faktura (Superbill) med ICD-10- och CPT-koder tillhandahålls via healow-portalen för privat försäkringsersättning.",
  },
  disclaimers: {
    educationalNoticeTitle: "Utbildningsmeddelande & Noll-ePHI Telemetri",
    educationalNotice:
      "Samtliga kliniska orienteringsföreläsningar, monografier och material spelas in för ackrediterad medicinsk vidareutbildning och prospektiv patientorientering. Samtliga presenterade patientfallstudier har avidentifierats enligt HIPAA Safe Harbor-kriterier.",
    safeHarborTitle: "HIPAA Safe Harbor Avidentifieringsstandard",
    safeHarborNotice:
      "Provjournaler och kliniska visualiseringar återges helt utan beständiga identifierare. Inga patientjournaler eller telemetriska spårningsdata samlas in eller lagras av infrastrukturen för videodistribution.",
    outOfNetworkTitle: "Privat Vårdgivare Utanför Avtal",
    outOfNetworkNotice:
      "Cognitive Edge Clinic är en privatbetalande specialistklinik för longevity utan offentliga vårdavtal. Vi ansluter inte till allmänna sjukvårdssystem eller generella HMO/PPO-planer. Specificerade fakturor tillhandahålls via eClinicalWorks healow-portalen för enskild försäkringsinlämning.",
    fdaDisclaimerTitle: "Klinisk Reglering & Forskningsansvarsfriskrivning",
    fdaDisclaimerNotice:
      "Terapeutiska protokoll, peptidregimer och neuromoduleringsstrategier har inte utvärderats av tillsynsmyndigheter som botemedel för specifika terminala diagnoser. Longevity-interventioner optimerar biologisk resiliens och cellulär effektivitet under läkarkontroll.",
    safetyGatesTitle: "Klinisk Säkerhet & Filosofi kring Kontraindikationer",
    safetyGatesSubtitle:
      "Evidensbaserade biokemiska skyddsräcken och oföränderliga protokollås med nolltolerans.",
    gates: {
      nadOncologyLock: {
        title: "Onkologiskt Spärrlås för NAD+ & Prekursorer",
        condition: "Aktiv onkologisk diagnos eller historik av ockult malignitet",
        action: "ABSOLUT SPÄRRLÅS — NAD+- och NMN-prekursorer är strikt kontraindicerade.",
        rationale:
          "Höga intracellulära NAD+-nivåer ökar glykolytiskt flöde och kan tillföra metabolt bränsle till prolifererande maligna celler.",
      },
      b6NeuropathyCeiling: {
        title: "Neuropatitak för Vitamin B6 Pyridoxin",
        condition: "Dosering av vitamin B6 / pyridoxin / pyridoxal-5-fosfat (P5P) som överskrider 20 mg/dag",
        action: "STRIKT DOSERINGSTAK — P5P begränsas strikt under 20 mg/dag i samtliga paket.",
        rationale:
          "Kroniskt höga doser mättar eliminationsvägarna och inducerar paradoxal perifer sensorisk neuropati i dorsalrotsganglierna.",
      },
      tmsFerromagneticLock: {
        title: "10 Hz DLPFC TMS Ferromagnetisk Säkerhetskontroll",
        condition: "Metalliska implantat, cochleaimplantat eller aneurysmclips inom 30 cm från spolen",
        action: "ABSOLUT SPÄRRLÅS — Elektromagnetisk urladdning med TMS är strikt förbjuden.",
        rationale:
          "Risk för spolframkallad förflyttning, virvelströmsupphettning och lokaliserad termisk vävnadsskada.",
      },
      anticoagulantAuditing: {
        title: "Säkerhetsgranskning för Antikoagulantia & Omega-3",
        condition: "Samtidig behandling med antikoagulantia (Warfarin, NOAK, DOAK, Heparin)",
        action: "ÖVERVAKA PK(INR) & KOAGULATIONSPROFIL",
        rationale:
          "Obligatorisk uppföljning av PK(INR) och koagulationsfaktorer för att förhindra hematom vid subkutan eller vaskulär access.",
      },
    },
  },
  triage: {
    drawerTitle: "Exekutiv Concierge Teledesk",
    drawerSubtitle: "Direkt klinikerdirigering med noll-ePHI-isolering och krypterad prioriteringstriage.",
    latencyGuardNotice: "Latensskydd för tidbokning aktivt (>3000 ms)",
    whiteGloveHeader: "White-Glove Concierge Intagningsdesk",
    directSms: "Direkt-SMS",
    callTeleDesk: "Ring Teledesken",
    hotlineNotice: "Concierge White-Glove Desk: +1 (800) 555-0199",
    hotlineNumber: "+1 (800) 555-0199",
    categoryLabel: "Konsultationskategori • Stripe Deposition Förhandskontroll",
    fields: {
      fullName: "Fullständigt juridiskt namn",
      fullNamePlaceholder: "t.ex. Karl Lindqvist",
      email: "Konfidentiell e-postadress",
      emailPlaceholder: "karl.lindqvist@familyoffice.se",
      phone: "Mobilnummer (Valfria SMS-uppdateringar)",
      phonePlaceholder: "+46 70 123 45 67",
      consultationWindow: "Önskat konsultationstidsfönster",
      clinicalNotes: "Kliniskt fokus eller prioriterade frågeställningar",
      clinicalNotesPlaceholder:
        "t.ex. HoloTC-metyleringsutvärdering, TMS-protokollgranskning, exekutiv autonom optimering...",
    },
    windows: {
      morning: "Förmiddag (08:00 - 12:00 EST)",
      afternoon: "Eftermiddag (13:00 - 17:00 EST)",
      evening: "Exekutiv kväll (18:00 - 20:00 EST)",
      urgent: "Akut / Samma dag klinisk VIP",
    },
    confirmation: {
      badge: "Prioriterad Teledesk Köad",
      title: "Intagningsreservation Skickad",
      descriptionTemplate:
        "Konsultationsbokning för {name} har dirigerats till exekutiva klinikerkön under {tier}.",
      dispatchReferenceLabel: "BOKNINGSREFERENS:",
      consultationWindowLabel: "KONSULTATIONSFÖNSTER:",
      depositAuthorizationLabel: "DEPOSITIONSBEKRÄFTELSE:",
      depositAmountTemplate: "${amount} USD (Deposition vid inskrivning)",
      directHotlineLabel: "DIREKT JOURNUMMER:",
      smsConfirmButton: "Bekräfta via Direkt-SMS",
      callButton: "Ring Concierge-desken",
      newReservationButton: "Ny reservation",
    },
    actions: {
      submit: "Skicka bokning till Teledesken",
      returnToCalendar: "Återgå till kalendern",
    },
    footerNotice: "Noll-ePHI flyktig triage • Stripe deposition förhandskontroll",
  },
  zeroEphi: {
    badge: "Noll-ePHI-arkitektur aktiv",
    banner: "NOLL-ePHI-KARANTÄN TILLÄMPAS",
    statusActive: "Noll-ePHI-karantän aktiv",
    quarantineTitle: "Noll-ePHI Datakarantänarkitektur",
    quarantineDescription:
      "Deterministisk sanering och isolering på klientsidan som förhindrar att skyddad hälsoinformation (ePHI) eller personidentifierbar information (PII) sparas i webbläsarcacher, externa CDN:er eller okrypterad telemetri.",
    ephemeralStateTitle: "Flyktigt Klienttillstånd",
    ephemeralStateNotice:
      "Samtliga förhandssvar, intagningsformulär och kliniska sökningar hålls uteslutande i flyktigt minne och raderas omedelbart efter avslutad session.",
    hipaaAttestation:
      "Verifierad enligt HIPAA Safe Harbor: provjournaler och konsultationsunderlag återges helt utan beständiga identifierare.",
    soc2Attestation:
      "Säkerhetsstandard enligt SOC2 Typ II-enklaver med noll klientsides-spårare från tredje part.",
    auditStatusPass: "NOLL-ePHI-REVISION: GODKÄND",
    clientIsolationNotice:
      "Formulärdata överförs krypterat direkt till skyddade triageköer utan lokal spårning på klientsidan.",
  },
  ui: {
    buttons: {
      bookConsultation: "Boka Konsultation",
      initiateIntake: "Initiera Kliniskt Intag",
      viewMembership: "Visa Medlemskapssvit",
      close: "Stäng",
      back: "Tillbaka",
      next: "Nästa",
      submit: "Skicka",
      loading: "Laddar...",
      cancel: "Avbryt",
      retry: "Försök igen",
    },
    status: {
      active: "Aktiv",
      verified: "Verifierad",
      locked: "Låst",
      pending: "Väntande",
      quarantined: "I karantän",
    },
    labels: {
      durationMinutes: "{minutes} min • Nivå Verifierad",
      depositAmount: "Deposition: ${amount}",
      priorityAssistance: "Prioriterad Tidsbokningsassistans • Noll-ePHI-Karantän",
      confidentialNotice: "Konfidentiell Medicinsk Kommunikation • Behörighetsskyddad Kanal",
    },
    languages: {
      en: "English",
      sv: "Svenska",
      deCH: "Schweizerdeutsch",
    },
  },
};

export default sv;
