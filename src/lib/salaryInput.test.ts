import { describe, expect, it } from 'vitest'
import { parseSalaryInput } from './salaryInput'

describe('parseSalaryInput', () => {
  it.each([
    ['40000', 40_000],
    ['40.000', 40_000],
    ['40.000,50', 40_000.5],
    ['40000.50', 40_000.5],
  ])('parses %s', (input, expected) => {
    expect(parseSalaryInput(input)).toEqual({ value: expected, error: null })
  })

  it('does not calculate an empty input', () => {
    expect(parseSalaryInput('   ')).toEqual({ value: null, error: 'empty' })
  })

  it('rejects malformed, negative and zero values', () => {
    expect(parseSalaryInput('40k')).toEqual({ value: null, error: 'invalid' })
    expect(parseSalaryInput('-40000')).toEqual({ value: null, error: 'negative' })
    expect(parseSalaryInput('0')).toEqual({ value: null, error: 'invalid' })
  })
})
