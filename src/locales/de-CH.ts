import type { Dictionary } from "@/lib/i18n/types";

/**
 * Swiss German Dictionary (de-CH)
 * Swiss Private Banking & High-Prestige Clinical Standard
 * Zurich / Geneva Precision Neuro-Metabolic Longevity Protocol
 * Note: Strictly adheres to Swiss orthography (no "ß", uses "ss" exclusively).
 */
export const deCH: Dictionary = {
  meta: {
    locale: "de-CH",
    localeName: "Schweizerdeutsch (Klinischer Standard)",
    language: "Deutsch (Schweiz)",
    region: "Schweiz / Zürich & Genf",
    clinicalDialect: "Schweizer Privatklinik- & Private-Banking-Standard",
  },
  navigation: {
    brandName: "Cognitive Edge Clinic",
    brandTagline: "Neurometabolische Resuzitation • Schweizerische Präzisions-Longevity",
    services: "Klinische Modalitäten",
    ledger: "Wissenschaftliches Hauptbuch",
    briefings: "Wissenschaftliche Briefings",
    membership: "VIP-Mitgliedschaft",
    biographies: "Ärztliche Leitung",
    diagnosticVault: "Diagnostik-Tresor",
    intakeAssessment: "Aufnahme-Assessment",
    memberLogin: "Mitglieder-Login",
    clientPortal: "Klientenportal",
    search: "Suche",
    searchAria: "Klinische Modalitäten, Biomarker, Briefings und Massnahmen durchsuchen (Cmd+K)",
    portalGateway: "eClinicalWorks Portal",
    spruceRelay: "Spruce Care Web",
    systemStatus: "Systemstatus & Enklaven-Telemetrie",
  },
  modalities: {
    tmsNeuromodulation: {
      title: "TMS-Neuromodulation",
      subtitle: "DLPFC-Neuroplastizität & Ca-AKG-Synapsenrekonstruktion",
      tagline: "Wiederherstellung kortikaler Exzitabilität & Beseitigung präfrontaler Latenz",
      abstract:
        "Gezielte Theta-Burst- und hochfrequente (10 Hz) repetitive Magnetimpulse auf den linken dorsolateralen präfrontalen Kortex (DLPFC). Durch die Verknüpfung magnetischer Rekalibrierung mit metabolisch-epigenetischem Priming mittels Calcium-Alpha-Ketoglutarat (Ca-AKG) stimulieren wir den hirnabgeleiteten neurotrophen Faktor (BDNF), stellen die synaptische Langzeitpotenzierung (LTP) wieder her und dämpfen autonome Hypofrontalität bei Hochleistungsträgern.",
      clinicalCadence: "3 Sitzungen wöchentlich über 6 Wochen (20 Minuten pro zielgerichtete Sitzung)",
      deliveryMethod: "Lokalisierte Achter-Magnetspule mit stereotaktischer Neuronavigation",
    },
    subcutaneousPeptides: {
      title: "Subkutane Peptid-Protokolle",
      subtitle: "Epithalon zur zirkadianen Epiphysenreparatur, GHK-Cu, BPC-157",
      tagline: "Zelluläre Seneszenz-Mitigation & mikrovaskuläre Endothelregeneration",
      abstract:
        "Ein hochkalibriertes Regime bioidentischer und synthetischer Peptide über niedervolumige subkutane Applikationskorridore. Einsatz von Epithalon (Epiphysen-Tetrapeptid) zur Telomerase-Aktivierung und Resynchronisation der biologischen Uhr, GHK-Cu zur TGF-beta-Modulation und Kollagenmatrix-Restrukturierung sowie BPC-157 zur Reparatur von Gefäss- und Blut-Hirn-Schrankenendothel.",
      clinicalCadence: "Subkutane Mikrodosierung 5 Tage Anwendung / 2 Tage Pause in 8-Wochen-Zyklen",
      deliveryMethod: '31G 5/16" Mikrospritze zur subkutanen Applikation (Abdomen/Femur)',
    },
    btlEmsella: {
      title: "BTL Emsella Beckenboden-Stabilisierung",
      subtitle: "HIFEM Becken-Gluteal-Zentrierung",
      tagline: "Stärkung der Beckenbodenarchitektur & Festigung vagaler autonomer Reserven",
      abstract:
        "Nicht-invasive supramaximale elektromagnetische Kontraktionen der tiefen Beckenbodenmuskulatur, des Musculus levator ani und des Plexus sacralis. Die Stärke des Diaphragma pelvis koppelt direkt mit der thorakalen Atemmechanik und der vagalen parasympathischen Innervation, löst chronische sympathische Blockaden und stabilisiert autonome Schlaf-Wach-Oszillationen.",
      clinicalCadence: "2 Sitzungen wöchentlich über 3 aufeinanderfolgende Wochen (6 Sitzungen zu je 28 Minuten)",
      deliveryMethod: "Fokussierter elektromagnetischer Behandlungssessel mit 2.5-Tesla-Magnetfeld",
    },
    cerebralPhotobiomodulation: {
      title: "Zerebrale Photobiomodulation",
      subtitle: "Mitochondriale Nahinfrarot-Rotlicht-Therapie",
      tagline: "Stimulation der Cytochrom-c-Oxidase & zerebraler Gefässhämodynamik",
      abstract:
        "Präzise transkranielle Applikation von Nahinfrarotlicht (810 nm und 1064 nm), gepulst bei 10 Hz (Alpha) oder 40 Hz (Gamma) auf das Default Mode Network und zentrale Exekutivnetzwerke. Photonen penetrieren die Kalotte zur Aktivierung der Cytochrom-c-Oxidase in der mitochondrialen Atmungskette, beschleunigen die ATP-Synthese, setzen Stickstoffmonoxid frei und dilatieren tiefes zerebrales Mikrogewebe.",
      clinicalCadence: "3 Sitzungen wöchentlich über 8 Wochen (20 Min. transkraniell + 10 Min. intranasale Diode)",
      deliveryMethod: "Transkranielles synchronisiertes LED-Array mit intranasaler Schleimhautdiode",
    },
    glp1MetabolicOptimization: {
      title: "GLP-1 Metabolische Optimierung",
      subtitle: "Dual-/Tri-Agonisten-Protokolle für Spitzenmetabolismus",
      tagline: "Elimination hypothalamischer Neuroinflammation & Glykämiekalibrierung",
      abstract:
        "Präzise alters- und geschlechtskalibrierte subkutane Dosierung von GLP-1-, GIP- und Glukagon-Rezeptoragonisten kombiniert mit stöchiometrischer Nährstoffrepletion. Durch Überwindung der Blut-Hirn-Schranke zur Bindung an GLP-1-Rezeptoren im Nucleus arcuatus und Hippocampus beseitigen Multi-Agonisten systemische Insulinresistenz, dämmen Mikroglia-Aktivierung ein und schärfen die exekutive Kognition ohne Verlust von Skelettmuskelmasse.",
      clinicalCadence: "Einmal wöchentliche subkutane Mikrotitration in 16-Wochen-Zyklen",
      deliveryMethod: "Kalibrierter Autoinjektor-Pen unter fachärztlicher Dosiseskalation",
    },
    mitochondrialBioenergetics: {
      title: "Mitochondriale Bioenergetik-Resuzitation",
      subtitle: "Ubiquinol, PQQ, TTFD und Erythrozyten-Magnesium (>6.0 mg/dL)",
      tagline: "Umgehung von Enzymhysteresen & stöchiometrische Coenzym-Sättigung",
      abstract:
        "Ein von klinischen Biochemikern formuliertes Sättigungsregime zur Wiederherstellung intrazellulärer Cofaktor-Pools und Überwindung enzymatischer Engpässe. Zielbereiche: intrazelluläre NAD+-Konzentrationen zwischen 40–100 μM, Erythrozyten-Magnesium-Korridore > 6.0 mg/dL sowie fettlösliches Thiamin (TTFD) zur Aktivierung des Pyruvat-Dehydrogenase-Komplexes für unterbrechungsfreie zerebrale ATP-Generierung.",
      clinicalCadence: "Tägliches orales Mikronährstoff-Paket + zweiwöchentliche zielgerichtete bioenergetische Infusionssuite",
      deliveryMethod: "Liposomale orale Kofaktoren + langsam infundierte isotone periphere IV-Kanüle",
    },
    bdnfSynapticPreservation: {
      title: "BDNF-Amplifikation & Erhalt der Synapsendichte",
      subtitle: "Gezielte Neurotrophin-Hochregulierung & dendritische Verzweigung",
      tagline: "Sicherung struktureller synaptischer Dichte gegen altersbedingte Neuro-Attrition",
      abstract:
        "Ein multimodales neurobiologisches Hochleistungsprotokoll aus hochaffinen TrkB-Rezeptoragonisten (7,8-Dihydroxyflavon), Kälteschock-RBM3-Induktion und nootropischen Kofaktoren. Konzipiert zur nachhaltigen Steigerung des Brain-Derived Neurotrophic Factor (BDNF), zur Festigung hippocampaler dendritischer Dornen und zum Schutz kognitiver Verarbeitungsgeschwindigkeiten im anspruchsvollen Führungsumfeld.",
      clinicalCadence: "5 Tage wöchentlich morgendliches Nootropika-Protokoll + zweimal wöchentlich neurovaskuläre Stimulation",
      deliveryMethod: "Sublinguale Mikroemulsion + gezielte transkranielle Magnetstimulation",
    },
  },
  feeTiers: {
    clinicalEvaluation: {
      code: "EV-982148",
      label: "Klinische Diagnostische Erstkonsultation",
      title: "Private Konsultationsreservation",
      subtitle:
        "Umfassende 45-minütige diagnostische Abklärung & Baseline-Kartierung • Dr. med. David Andreas Runheim",
      duration: "45 Minuten",
      deposit: "USD 1'000 (Beim Intake hinterlegt)",
      description:
        "Tiefgehende neurodiagnostische Beurteilung, metabolische Baselinemarker und quantitatives kognitives Profiling.",
      highlights: [
        "Multi-Omics & neurofunktionelle Analyse",
        "Quantitative kognitive Basiskennzahlen",
        "Persönliche Konsultation beim Ärztlichen Direktor",
      ],
      badgeText: "Vorlage #982148 • Neurodiagnostische Baseline",
    },
    vipExecutive: {
      code: "EV-982149",
      label: "VIP Executive Protokoll",
      title: "Exekutive Autonome Regulation & Leistungsoptimierung",
      subtitle: "60-minütige autonome Regulation, Epigenetik-Audit & Leistungssynthese",
      duration: "60 Minuten",
      deposit: "USD 2'500 (Beim Intake hinterlegt)",
      description:
        "Massgeschneiderte autonome Optimierung und beschleunigte Telemetriesynthese für anspruchsvolle Führungsverantwortung.",
      highlights: [
        "Direkte Prioritäts-Concierge-Aufnahme",
        "Metabolische & molekulare Biomarker-Synthese",
        "Erweiterte 1:1 ärztliche Baseline-Konsultation",
      ],
      badgeText: "Vorlage #982149 • Executive Longevity",
    },
    conciergeProtocol: {
      code: "EV-982150",
      label: "Concierge Bespoke Privatprotokoll",
      title: "White-Glove Longevity Immersion & Care Concierge",
      subtitle: "90-minütige Gesamtdiagnostik, persönlicher Clinical Navigator & Exklusiv-Hotline",
      duration: "90 Minuten",
      deposit: "USD 5'000 (Beim Intake hinterlegt)",
      description:
        "Vollumfängliche White-Glove-Klinikimmersion mit persönlicher 24/7-Betreuung und beschleunigter Protokollumsetzung nach Schweizer Privatbanken-Standard.",
      highlights: [
        "Direkter Tele-Desk & dedizierter SMS-Triage-Kanal",
        "Garantierte ärztliche Befundung am selben Tag",
        "Massgeschneiderte multimodale therapeutische Roadmap",
      ],
      badgeText: "Vorlage #982150 • White-Glove Concierge",
    },
    depositPolicy:
      "Sämtliche Konsultationsdepots werden sicher via Stripe vorautorisiert und beim Intake mit dem klinischen Gesamtkonto verrechnet.",
    cancellationPolicy:
      "Stornierungen oder Umbuchungen weniger als 48 Stunden vor dem Termin führen zum Verfall des Depots. In medizinischen Notfällen können Ausnahmen nach Ermessen des Ärztlichen Direktors gewährt werden.",
    superbillNotice:
      "Die Cognitive Edge Clinic wird als reine Privatpraxis ohne Kassenzulassung geführt. Detaillierte Honorarabrechnungen (Superbills) mit ICD-10- und CPT-Codierung werden im healow-Portal bereitgestellt.",
  },
  disclaimers: {
    educationalNoticeTitle: "Wissenschaftliche Aufklärung & Zero-ePHI-Telemetrie",
    educationalNotice:
      "Sämtliche klinischen Fachvorträge, Monographien und Informationsmaterialien dienen der akkreditierten medizinischen Weiterbildung und der Orientierung interessierter Klienten. Alle Fallstudien wurden strikt nach HIPAA Safe Harbor Richtlinien de-identifiziert.",
    safeHarborTitle: "HIPAA Safe Harbor De-Identifikationsstandard",
    safeHarborNotice:
      "Klinische Darstellungen und Laborprofile werden ausnahmslos ohne persistente Identifikatoren wiedergegeben. Das Auslieferungssystem speichert keinerlei Patientendaten oder telemetrische Identifikatoren.",
    outOfNetworkTitle: "Unabhängige Privatklinik ohne Kassenbindung",
    outOfNetworkNotice:
      "Die Cognitive Edge Clinic ist eine unabhängige Privatpraxis für Präzisions-Longevity ohne Kassenzulassung. Eine direkte Abrechnung über gesetzliche Krankenkassen oder reguläre HMO/PPO-Versicherungspläne erfolgt nicht. Detaillierte Rechnungen werden via eClinicalWorks healow bereitgestellt.",
    fdaDisclaimerTitle: "Klinischer Vorbehalt & regulatorischer Hinweis",
    fdaDisclaimerNotice:
      "Therapieprotokolle, Peptidregime und Neuromodulationsverfahren dienen der Steigerung biologischer Resilienz und Zellgesundheit und stellen keine Heilsversprechen für terminale Erkrankungen dar. Sämtliche Interventionen erfolgen unter ärztlicher Aufsicht.",
    safetyGatesTitle: "Klinische Sicherheit & Kontraindikations-Philosophie",
    safetyGatesSubtitle:
      "Evidenzbasierte biochemische Sicherheitsgrenzen und unverrückbare Protokollsperren mit Nulltoleranz.",
    gates: {
      nadOncologyLock: {
        title: "Onkologisches Sperrschloss für NAD+ & Vorstufen",
        condition: "Aktive oder zurückliegende maligne Neoplasie",
        action: "ABSOLUTE SPERRE — NAD+- und NMN-Vorstufen sind strikt untersagt.",
        rationale:
          "Erhöhte intrazelluläre NAD+-Spiegel steigern den glykolytischen Fluss und können proliferierenden Tumorzellen als metabolischer Treibstoff dienen.",
      },
      b6NeuropathyCeiling: {
        title: "Neuropathie-Obergrenze für Vitamin B6 Pyridoxin",
        condition: "Dosierung von Vitamin B6 / Pyridoxin / Pyridoxal-5-Phosphat (P5P) über 20 mg/Tag",
        action: "STRIKTE OBERGRENZE — P5P ist in sämtlichen Einheiten strikt auf unter 20 mg/Tag limitiert.",
        rationale:
          "Chronisch überhöhte Dosen sättigen die metabolische Clearance und induzieren paradoxe sensible Neuropathien der Spinalganglien.",
      },
      tmsFerromagneticLock: {
        title: "10 Hz DLPFC TMS Ferromagnetische Sicherheitsschranke",
        condition: "Metallische Implantate, Cochlea-Systeme oder Aneurysmaclips im Umkreis von 30 cm um die Spule",
        action: "ABSOLUTE SPERRE — Elektromagnetische TMS-Impulse sind strikt kontraindiziert.",
        rationale:
          "Gefahr impulsinduzierter Dislokation, Wirbelstromerwärmung und lokalisierter thermischer Läsionen.",
      },
      anticoagulantAuditing: {
        title: "Sicherheitsprüfung für Antikoagulation & Omega-3",
        condition: "Bestehende gerinnungshemmende Therapie (Marcoumar, NOAK, DOAK, Heparin)",
        action: "QUICK/INR & GERINNUNGSPROFIL KONTROLLIEREN",
        rationale:
          "Obligatorische Prüfung von Gerinnungswerten zur Vermeidung von Hämatomen bei subkutanen und vaskulären Zugängen.",
      },
    },
  },
  triage: {
    drawerTitle: "Executive Concierge Tele-Desk",
    drawerSubtitle: "Direkte ärztliche Zuweisung mit Zero-ePHI-Isolation und verschlüsselter Prioritätstriage.",
    latencyGuardNotice: "Latenzschutz aktiv (>3000 ms)",
    whiteGloveHeader: "White-Glove Concierge Aufnahme-Desk",
    directSms: "Direkt-SMS",
    callTeleDesk: "Tele-Desk anrufen",
    hotlineNotice: "Concierge White-Glove Desk: +1 (800) 555-0199",
    hotlineNumber: "+1 (800) 555-0199",
    categoryLabel: "Konsultationskategorie • Stripe Depot-Vorautorisierung",
    fields: {
      fullName: "Vollständiger amtlicher Name",
      fullNamePlaceholder: "z.B. Beat von Allmen",
      email: "Vertrauliche E-Mail-Adresse",
      emailPlaceholder: "beat.vonallmen@familyoffice.ch",
      phone: "Mobilnummer (Diskrete SMS-Mitteilungen)",
      phonePlaceholder: "+41 44 123 45 67",
      consultationWindow: "Bevorzugtes Konsultationszeitfenster",
      clinicalNotes: "Klinischer Fokus oder vordringliche Anliegen",
      clinicalNotesPlaceholder:
        "z.B. Holo-TC Methylierungsanalyse, TMS-Protokoll-Audit, autonome Spitzenleistungsregulation...",
    },
    windows: {
      morning: "Vormittag (08:00 - 12:00 EST)",
      afternoon: "Nachmittag (13:00 - 17:00 EST)",
      evening: "Executive Abend (18:00 - 20:00 EST)",
      urgent: "Dringend / Same-Day VIP Zuweisung",
    },
    confirmation: {
      badge: "Prioritärer Tele-Desk eingereiht",
      title: "Aufnahmereservation übermittelt",
      descriptionTemplate:
        "Die Konsultationsanfrage für {name} wurde der leitenden ärztlichen Triage unter {tier} zugewiesen.",
      dispatchReferenceLabel: "REFERENZNUMMER:",
      consultationWindowLabel: "KONSULTATIONSFENSTER:",
      depositAuthorizationLabel: "DEPOT-AUTORISIERUNG:",
      depositAmountTemplate: "${amount} USD (Beim Intake hinterlegt)",
      directHotlineLabel: "DIREKT-HOTLINE:",
      smsConfirmButton: "Bestätigung per Direkt-SMS",
      callButton: "Concierge-Desk anrufen",
      newReservationButton: "Neue Reservation",
    },
    actions: {
      submit: "Reservation an Tele-Desk übermitteln",
      returnToCalendar: "Zurück zum Kalender",
    },
    footerNotice: "Flüchtige Zero-ePHI-Triage • Stripe Depot-Vorautorisierung",
  },
  zeroEphi: {
    badge: "Zero-ePHI-Architektur aktiv",
    banner: "ZERO-ePHI-SICHERHEITSQUARANTÄNE DURCHGESETZT",
    statusActive: "Zero-ePHI-Quarantäne aktiv",
    quarantineTitle: "Zero-ePHI Datenquarantäne-Architektur",
    quarantineDescription:
      "Deterministische Bereinigung und clientseitige Isolation zum garantierten Schutz persönlicher Gesundheitsdaten (ePHI) vor persistenter Speicherung in Browser-Caches, CDNs oder Telemetriesystemen nach höchstem Schweizer Diskretionsstandard.",
    ephemeralStateTitle: "Flüchtiger Client-Zustand",
    ephemeralStateNotice:
      "Alle Vorabklärungen, Aufnahmeformulare und Suchanfragen verbleiben ausschliesslich im flüchtigen Arbeitsspeicher und werden bei Sitzungsende unwiderruflich gelöscht.",
    hipaaAttestation:
      "Zertifizierte De-Identifikation nach HIPAA Safe Harbor ohne persistente Identifikatoren.",
    soc2Attestation:
      "SOC2 Typ II Enklaven-Sicherheitsstandard ohne clientseitige Drittanbieter-Tracker.",
    auditStatusPass: "ZERO-ePHI-AUDIT: BESTANDEN",
    clientIsolationNotice:
      "Formulardaten werden verschlüsselt direkt an geschützte Triage-Queues geleitet – ohne lokales Tracking auf Client-Ebene.",
  },
  ui: {
    buttons: {
      bookConsultation: "Konsultation reservieren",
      initiateIntake: "Klinische Aufnahme einleiten",
      viewMembership: "Mitgliedschaftssuite einsehen",
      close: "Schliessen",
      back: "Zurück",
      next: "Weiter",
      submit: "Absenden",
      loading: "Laden...",
      cancel: "Abbrechen",
      retry: "Wiederholen",
    },
    status: {
      active: "Aktiv",
      verified: "Verifiziert",
      locked: "Gesperrt",
      pending: "Ausstehend",
      quarantined: "In Quarantäne",
    },
    labels: {
      durationMinutes: "{minutes} Min. • Stufe verifiziert",
      depositAmount: "Depot: ${amount}",
      priorityAssistance: "Prioritäre Terminkoordination • Zero-ePHI-Quarantäne",
      confidentialNotice: "Vertrauliche medizinische Kommunikation • Privilegierter Kanal",
    },
    languages: {
      en: "English",
      sv: "Svenska",
      deCH: "Schweizerdeutsch",
    },
  },
};

export default deCH;
