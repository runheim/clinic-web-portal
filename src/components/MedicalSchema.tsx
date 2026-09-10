import React from "react";

export function MedicalSchema() {
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["MedicalBusiness", "MedicalClinic"],
        "@id": "https://cognitiveedgeclinic.com/#clinic",
        name: "Cognitive Edge Clinic",
        alternateName: "Cognitive Edge Clinic — Concierge Neurology & Longevity",
        url: "https://cognitiveedgeclinic.com",
        logo: "https://cognitiveedgeclinic.com/logo.png",
        image: "https://cognitiveedgeclinic.com/api/og?title=Cognitive%20Edge%20Clinic",
        telephone: "+1-800-555-0199",
        priceRange: "$$$$",
        currenciesAccepted: "USD",
        paymentAccepted: "Stripe, Wire Transfer, Concierge Retainer, Major Credit Cards",
        address: {
          "@type": "PostalAddress",
          streetAddress: "450 Sutter Street, Suite 2100",
          addressLocality: "San Francisco",
          addressRegion: "CA",
          postalCode: "94108",
          addressCountry: "US",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 37.7891,
          longitude: -122.4068,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "08:00",
            closes: "18:00",
          },
        ],
        medicalSpecialty: [
          "Neurology",
          "Neurotherapeutics",
          "Clinical Longevity",
          "Nutritional Medicine",
          "Neuro-Metabolic Resuscitation",
        ],
        knowsAbout: [
          "DLPFC Transcranial Magnetic Stimulation",
          "HoloTC and Active Cobalamin Kinetics",
          "Mitochondrial Thiamine Diphosphate Saturation",
          "Marine Omega-3 Membrane Fluidity Gatekeeper",
          "Zero-ePHI Data Quarantine Architecture",
        ],
        founder: {
          "@id": "https://cognitiveedgeclinic.com/#physician",
        },
        availableService: [
          {
            "@type": "MedicalProcedure",
            name: "High-Frequency DLPFC TMS Neuromodulation",
            description: "10 Hz Theta-Burst cortical stimulation for synaptogenesis and executive network recalibration.",
          },
          {
            "@type": "MedicalProcedure",
            name: "Subcutaneous Peptide Bioregulators",
            description: "Targeted mitochondrial signaling, Epithalon telomere protection, and tissue bioregulation.",
          },
          {
            "@type": "MedicalProcedure",
            name: "BTL Emsella Core & Autonomic Recalibration",
            description: "2.5 Tesla HIFEM pelvic neuromuscular activation restoring vagal balance and parasympathetic stability.",
          },
          {
            "@type": "MedicalProcedure",
            name: "Transcranial Near-Infrared Photobiomodulation",
            description: "810nm and 1064nm photonic stimulation of cytochrome c oxidase driving mitochondrial ATP synthesis.",
          },
          {
            "@type": "MedicalProcedure",
            name: "Stoichiometric Biomarker Ledger & Hysteresis Correction",
            description: "Targeted correction of HoloTC, MMA, TDP, Homocysteine, and RBC Magnesium deficits.",
          },
        ],
      },
      {
        "@type": "Physician",
        "@id": "https://cognitiveedgeclinic.com/#physician",
        name: "Dr. Andreas Runheim, MD, PhD",
        alternateName: "Dr. David Andreas Runheim",
        jobTitle: "Founding Neurologist & Director of Neuro-Metabolic Resuscitation",
        medicalSpecialty: [
          "Neurology",
          "Clinical Neurophysiology",
          "Neuro-Metabolic Longevity",
        ],
        worksFor: {
          "@id": "https://cognitiveedgeclinic.com/#clinic",
        },
        alumniOf: {
          "@type": "EducationalOrganization",
          name: "Johns Hopkins University School of Medicine",
        },
        memberOf: [
          {
            "@type": "Organization",
            name: "American Academy of Neurology",
          },
          {
            "@type": "Organization",
            name: "International Society for Neurovascular Disease",
          },
        ],
        description:
          "Board-certified neurologist specializing in neuro-metabolic resuscitation, stoichiometric biomarker balancing, and restorative neuromodulation.",
      },
      {
        "@type": "MedicalWebPage",
        "@id": "https://cognitiveedgeclinic.com/#webpage",
        url: "https://cognitiveedgeclinic.com",
        name: "Cognitive Edge Clinic — Clinical Protocol & Diagnostic Ledger",
        description:
          "Evidence-based concierge neuro-metabolic longevity protocols referencing the VITACOG trial, Smith et al. (2010), Jernerén et al. (2015), and NICE 2024 Clinical Guidelines.",
        about: {
          "@id": "https://cognitiveedgeclinic.com/#clinic",
        },
        citation: [
          "Smith AD, et al. (2010). Homocysteine-lowering by B vitamins slows the rate of accelerated brain atrophy in mild cognitive impairment: a randomized controlled trial (VITACOG). PLoS ONE 5(9): e12244.",
          "Jernerén F, et al. (2015). Brain atrophy in cognitively impaired elderly: the importance of long-chain omega-3 fatty acids and B vitamin status in a randomized controlled trial. Am J Clin Nutr 102(1): 215-221.",
          "NICE Clinical Guideline (2024): Neurological conditions: diagnosis, neuro-rehabilitation, and biomarker stewardship.",
        ],
        specialty: "Neurology",
        audience: {
          "@type": "MedicalAudience",
          audienceType: ["Patient", "HealthcareProfessional"],
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
    />
  );
}

export default MedicalSchema;
