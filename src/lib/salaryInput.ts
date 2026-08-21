export type SalaryInputError = 'empty' | 'invalid' | 'negative'

export type SalaryInputParseResult =
  | { value: number; error: null }
  | { value: null; error: SalaryInputError }

/**
 * Parses the formats people commonly paste into an Italian salary field.
 * A lone separator followed by three digits is treated as a thousands marker;
 * otherwise the final separator is treated as the decimal marker.
 */
export function parseSalaryInput(rawValue: string): SalaryInputParseResult {
  const value = rawValue.trim().replace(/\s/g, '')

  if (!value) return { value: null, error: 'empty' }
  if (!/^[+-]?[\d.,]+$/.test(value)) return { value: null, error: 'invalid' }

  const sign = value.startsWith('-') ? -1 : 1
  const unsignedValue = value.replace(/^[+-]/, '')
  const commas = [...unsignedValue.matchAll(/,/g)].map((match) => match.index ?? 0)
  const dots = [...unsignedValue.matchAll(/\./g)].map((match) => match.index ?? 0)

  let normalized: string
  if (commas.length && dots.length) {
    const decimalIndex = Math.max(commas.at(-1)!, dots.at(-1)!)
    const integerPart = unsignedValue.slice(0, decimalIndex).replace(/[.,]/g, '')
    const decimalPart = unsignedValue.slice(decimalIndex + 1)
    if (!/^\d{1,2}$/.test(decimalPart)) return { value: null, error: 'invalid' }
    normalized = `${integerPart}.${decimalPart}`
  } else {
    const separator = commas.length ? ',' : dots.length ? '.' : null
    if (!separator) {
      normalized = unsignedValue
    } else {
      const pieces = unsignedValue.split(separator)
      const lastPiece = pieces.at(-1)!
      const isDecimal = pieces.length === 2 && /^\d{1,2}$/.test(lastPiece)
      normalized = isDecimal ? `${pieces[0]}.${lastPiece}` : pieces.join('')
    }
  }

  const parsed = sign * Number(normalized)
  if (!Number.isFinite(parsed)) return { value: null, error: 'invalid' }
  if (parsed < 0) return { value: null, error: 'negative' }
  if (parsed === 0) return { value: null, error: 'invalid' }

  return { value: parsed, error: null }
}
