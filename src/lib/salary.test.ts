import { describe, expect, it } from 'vitest'
import {
  RULES_2026,
  calculateNetSalary,
  employmentTaxDeduction,
  employmentDeductionSupplement,
  getSalaryInsight,
  progressiveTax,
  taxWedgeBenefit,
} from './salary'

describe('progressiveTax', () => {
  it('only taxes the portion in each IRPEF band', () => {
    expect(progressiveTax(60_000, RULES_2026.irpefBands)).toBe(18_000)
  })
})

describe('2026 employment deductions', () => {
  it('uses the full deduction at the first band', () => {
    expect(employmentTaxDeduction(15_000)).toBe(1_955)
  })

  it('tapers to zero at €50,000', () => {
    expect(employmentTaxDeduction(50_000)).toBe(0)
  })

  it('applies the €65 supplement only inside its stated interval', () => {
    expect(employmentDeductionSupplement(25_000)).toBe(0)
    expect(employmentDeductionSupplement(25_000.01)).toBe(65)
    expect(employmentDeductionSupplement(35_000)).toBe(65)
    expect(employmentDeductionSupplement(35_000.01)).toBe(0)
  })
})

describe('tax-wedge relief', () => {
  it('returns a €1,000 deduction from €20,000 to €32,000', () => {
    expect(taxWedgeBenefit(28_000)).toEqual({ deduction: 1_000, payment: 0 })
  })

  it('tapers after €32,000 and vanishes above €40,000', () => {
    expect(taxWedgeBenefit(36_000)).toEqual({ deduction: 500, payment: 0 })
    expect(taxWedgeBenefit(40_001)).toEqual({ deduction: 0, payment: 0 })
  })

  it.each([
    [20_000, { deduction: 0, payment: 960 }],
    [20_000.01, { deduction: 1_000, payment: 0 }],
    [28_000, { deduction: 1_000, payment: 0 }],
    [32_000, { deduction: 1_000, payment: 0 }],
    [35_000, { deduction: 625, payment: 0 }],
    [40_000, { deduction: 0, payment: 0 }],
  ])('handles the €%d boundary', (income, expected) => {
    expect(taxWedgeBenefit(income)).toEqual(expected)
  })
})

describe('calculateNetSalary', () => {
  it('returns a transparent, internally consistent standard-case estimate', () => {
    const estimate = calculateNetSalary(40_000)
    expect(estimate.employeeContributions).toBe(3_676)
    expect(estimate.taxableIncome).toBe(36_324)
    expect(estimate.grossIrpef).toBe(9_186.92)
    expect(estimate.netIrpef).toBe(7_540.09)
    expect(estimate.lombardyRegionalTax).toBe(533.07)
    expect(estimate.milanMunicipalTax).toBe(290.59)
    expect(estimate.netAnnual).toBe(27_960.24)
    expect(estimate.netMonthly).toBe(2_150.79)
  })

  it('applies Milan exemption at exactly €23,000 of taxable income', () => {
    const estimate = calculateNetSalary(23_000 / (1 - 0.0919))
    expect(estimate.milanMunicipalTax).toBe(0)
  })

  it('adds the 1% contribution only above the 2026 threshold', () => {
    const atThreshold = calculateNetSalary(56_224)
    const oneEuroAbove = calculateNetSalary(56_225)
    expect(oneEuroAbove.employeeContributions - atThreshold.employeeContributions).toBeCloseTo(0.1, 2)
  })

  it.each([
    [28_000, 6_440],
    [50_000, 13_700],
  ])('calculates IRPEF through the €%d band boundary', (income, expected) => {
    expect(progressiveTax(income, RULES_2026.irpefBands)).toBe(expected)
  })

  it('surfaces a plain-language marginal-rate insight', () => {
    const insight = getSalaryInsight(calculateNetSalary(40_000))
    expect(insight.marginalIrpefRate).toBe(0.33)
    expect(insight.taxWedgeLabel).toContain('detrazione aggiuntiva')
  })

  it('rejects invalid amounts', () => {
    expect(() => calculateNetSalary(-1)).toThrow('La RAL deve essere un numero positivo.')
  })
})
