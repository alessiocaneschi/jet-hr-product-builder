/**
 * A deliberately small, inspectable 2026 model for a full-year private-sector
 * employee resident in Milan. Amounts are annual EUR; calculations retain
 * precision and are rounded only on the returned public result.
 */

export type RuleProvenance = {
  description: string
  effectivePeriod: string
  status: 'exact-rule' | 'prototype-assumption'
  sources: ReadonlyArray<{ label: string; url: string }>
}

const SOURCES = {
  budget2026: 'https://www.normattiva.it/eli/stato/LEGGE/2025/12/30/199/CONSOLIDATED',
  labour2025: 'https://www.lavoro.gov.it/notizie/pagine/legge-di-bilancio-2025-le-misure-lavoratori-imprese-e-famiglie',
  inps2026: 'https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.lavoratori-dipendenti-limite-minimo-di-retribuzione-giornaliera-2026.html',
  lombardy: 'https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef',
  milan2025: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&cc=F205&pr=MI&r=1',
  milanRegulation: 'https://www.comune.milano.it/documents/20126/200621592/Regolamento%2Bper%2Bl%27applicazione%2Bdell%27Addizionale%2BComunale%2Ball%27Imposta%2Bsul%2BReddito%2Bdelle%2BPersone%2BFisiche.pdf/f5423372-46d4-c742-7cbe-4d0959865ec0?t=1613126257286',
} as const

/** Source and confidence metadata for every rule encoded in this prototype. */
export const RULE_PROVENANCE: Record<string, RuleProvenance> = {
  employeeContributionRate: {
    description: 'Typical employee social-security rate used for a standard private-sector estimate; actual rates vary by CCNL and sector.',
    effectivePeriod: 'Prototype assumption for 2026',
    status: 'prototype-assumption',
    sources: [{ label: 'INPS 2026 contribution thresholds', url: SOURCES.inps2026 }],
  },
  additionalContribution: {
    description: 'Additional 1% employee contribution on remuneration above the first pensionable-income threshold.',
    effectivePeriod: '2026',
    status: 'exact-rule',
    sources: [{ label: 'INPS 2026 contribution thresholds', url: SOURCES.inps2026 }],
  },
  irpef: {
    description: 'Progressive national IRPEF bands.',
    effectivePeriod: 'From 1 January 2026',
    status: 'exact-rule',
    sources: [{ label: 'Law 199/2025, art. 1', url: SOURCES.budget2026 }],
  },
  employmentDeduction: {
    description: 'Standard employee-tax deduction, including the €65 supplement in the applicable income interval.',
    effectivePeriod: 'Structural rule in force for the 2026 model',
    status: 'exact-rule',
    sources: [{ label: 'Ministry of Labour, 2025 Budget Law summary', url: SOURCES.labour2025 }],
  },
  taxWedge: {
    description: 'Exempt payment up to €20,000 or additional employee deduction up to €40,000, where eligible.',
    effectivePeriod: 'Structural rule in force for the 2026 model',
    status: 'exact-rule',
    sources: [{ label: 'Ministry of Labour, 2025 Budget Law summary', url: SOURCES.labour2025 }],
  },
  lombardyRegionalTax: {
    description: 'Lombardy progressive regional IRPEF surcharge using the region’s published bands.',
    effectivePeriod: '2026 model; regional page updated 5 May 2026',
    status: 'exact-rule',
    sources: [{ label: 'Regione Lombardia', url: SOURCES.lombardy }],
  },
  milanMunicipalTax: {
    description: 'Milan 0.8% surcharge with a €23,000 exemption threshold. The official Finance Department database has no 2026 record; this carries forward the latest confirmed 2025 rule.',
    effectivePeriod: 'Prototype assumption for 2026, based on confirmed 2025 rule',
    status: 'prototype-assumption',
    sources: [
      { label: 'Department of Finance, Milan 2025 record', url: SOURCES.milan2025 },
      { label: 'Milan municipal regulation', url: SOURCES.milanRegulation },
    ],
  },
  monthlyPayments: {
    description: 'Annual net divided into 13 payments for the displayed monthly estimate.',
    effectivePeriod: 'Prototype product assumption',
    status: 'prototype-assumption',
    sources: [],
  },
}

export const RULES_2026 = {
  employeeContributionRate: 0.0919,
  additionalContributionThreshold: 56_224,
  additionalContributionRate: 0.01,
  irpefBands: [
    { upTo: 28_000, rate: 0.23 },
    { upTo: 50_000, rate: 0.33 },
    { upTo: Infinity, rate: 0.43 },
  ],
  lombardyBands: [
    { upTo: 15_000, rate: 0.0123 },
    { upTo: 28_000, rate: 0.0158 },
    { upTo: 50_000, rate: 0.0172 },
    { upTo: Infinity, rate: 0.0173 },
  ],
  milanMunicipalRate: 0.008,
  milanExemptionThreshold: 23_000,
  monthlyPayments: 13,
} as const

export type SalaryEstimate = {
  grossAnnual: number
  employeeContributions: number
  taxableIncome: number
  grossIrpef: number
  employmentTaxDeduction: number
  taxWedgeDeduction: number
  taxWedgePayment: number
  netIrpef: number
  lombardyRegionalTax: number
  milanMunicipalTax: number
  netAnnual: number
  netMonthly: number
  totalWithholdings: number
}

export type SalaryInsight = {
  marginalIrpefRate: number
  taxWedgeLabel: string
  growthExplanation: string
}

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

export function progressiveTax(
  income: number,
  bands: ReadonlyArray<{ upTo: number; rate: number }>,
): number {
  let tax = 0
  let lowerBound = 0

  for (const { upTo, rate } of bands) {
    const slice = Math.max(0, Math.min(income, upTo) - lowerBound)
    tax += slice * rate
    lowerBound = upTo
  }

  return tax
}

export function employmentTaxDeduction(taxableIncome: number): number {
  if (taxableIncome <= 15_000) return 1_955
  if (taxableIncome <= 28_000) return 1_910 + 1_190 * ((28_000 - taxableIncome) / 13_000)
  if (taxableIncome <= 50_000) return 1_910 * ((50_000 - taxableIncome) / 22_000)
  return 0
}

/** The €65 supplement to the employee deduction under TUIR art. 13. */
export function employmentDeductionSupplement(taxableIncome: number): number {
  return taxableIncome > 25_000 && taxableIncome <= 35_000 ? 65 : 0
}

/** 2025's structural tax-wedge measure, continuing in the 2026 model. */
export function taxWedgeBenefit(taxableIncome: number): { deduction: number; payment: number } {
  if (taxableIncome <= 8_500) return { deduction: 0, payment: taxableIncome * 0.071 }
  if (taxableIncome <= 15_000) return { deduction: 0, payment: taxableIncome * 0.053 }
  if (taxableIncome <= 20_000) return { deduction: 0, payment: taxableIncome * 0.048 }
  if (taxableIncome <= 32_000) return { deduction: 1_000, payment: 0 }
  if (taxableIncome <= 40_000) return { deduction: 1_000 * ((40_000 - taxableIncome) / 8_000), payment: 0 }
  return { deduction: 0, payment: 0 }
}

export function getSalaryInsight(estimate: SalaryEstimate): SalaryInsight {
  const marginalIrpefRate = RULES_2026.irpefBands.find((band) => estimate.taxableIncome <= band.upTo)!.rate
  const taxWedgeLabel = estimate.taxWedgePayment > 0
    ? 'Sì: il modello include una somma esente legata al cuneo fiscale.'
    : estimate.taxWedgeDeduction > 0
      ? 'Sì: il modello include una detrazione aggiuntiva legata al cuneo fiscale.'
      : 'No: a questo imponibile il beneficio cuneo fiscale non è incluso.'

  return {
    marginalIrpefRate,
    taxWedgeLabel,
    growthExplanation: 'Un aumento della RAL non diventa interamente netto: sulla parte in più incidono contributi, IRPEF nel tuo scaglione e addizionali locali.',
  }
}

export function calculateNetSalary(grossAnnual: number): SalaryEstimate {
  if (!Number.isFinite(grossAnnual) || grossAnnual < 0) {
    throw new Error('La RAL deve essere un numero positivo.')
  }

  const employeeContributions =
    grossAnnual * RULES_2026.employeeContributionRate +
    Math.max(0, grossAnnual - RULES_2026.additionalContributionThreshold) *
      RULES_2026.additionalContributionRate
  const taxableIncome = Math.max(0, grossAnnual - employeeContributions)
  const grossIrpef = progressiveTax(taxableIncome, RULES_2026.irpefBands)
  const employmentTaxDeductionAmount =
    employmentTaxDeduction(taxableIncome) + employmentDeductionSupplement(taxableIncome)
  const taxWedge = taxWedgeBenefit(taxableIncome)
  const netIrpef = Math.max(0, grossIrpef - employmentTaxDeductionAmount - taxWedge.deduction)
  const lombardyRegionalTax = progressiveTax(taxableIncome, RULES_2026.lombardyBands)
  const milanMunicipalTax =
    taxableIncome > RULES_2026.milanExemptionThreshold
      ? taxableIncome * RULES_2026.milanMunicipalRate
      : 0
  const netAnnual =
    grossAnnual -
    employeeContributions -
    netIrpef -
    lombardyRegionalTax -
    milanMunicipalTax +
    taxWedge.payment

  return {
    grossAnnual: round(grossAnnual),
    employeeContributions: round(employeeContributions),
    taxableIncome: round(taxableIncome),
    grossIrpef: round(grossIrpef),
    employmentTaxDeduction: round(employmentTaxDeductionAmount),
    taxWedgeDeduction: round(taxWedge.deduction),
    taxWedgePayment: round(taxWedge.payment),
    netIrpef: round(netIrpef),
    lombardyRegionalTax: round(lombardyRegionalTax),
    milanMunicipalTax: round(milanMunicipalTax),
    netAnnual: round(netAnnual),
    netMonthly: round(netAnnual / RULES_2026.monthlyPayments),
    totalWithholdings: round(grossAnnual - netAnnual),
  }
}
