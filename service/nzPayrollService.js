/** Simplified NZ PAYE estimate (v1) — validate with accountant before production compliance claims */

const MONTHLY_BRACKETS = [
  { upTo: 1560, rate: 0.105 },
  { upTo: 5350, rate: 0.175 },
  { upTo: 7810, rate: 0.3 },
  { upTo: 18000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
]

export function estimatePayeMonthly(grossMonthly, taxCode = 'M') {
  if (!grossMonthly || grossMonthly <= 0) return 0

  let remaining = grossMonthly
  let tax = 0
  let previous = 0

  for (const bracket of MONTHLY_BRACKETS) {
    const taxable = Math.min(remaining, bracket.upTo - previous)
    if (taxable <= 0) break
    tax += taxable * bracket.rate
    remaining -= taxable
    previous = bracket.upTo
  }

  // Simple adjustment for ME (no independent earner credit modelling in v1)
  if (taxCode === 'ME') {
    tax *= 0.98
  }

  return Math.round(tax * 100) / 100
}

export function calculateKiwiSaver(grossPay, employeeRate = 3, employerRate = 3) {
  const employee = Math.round(grossPay * (Number(employeeRate) / 100) * 100) / 100
  const employer = Math.round(grossPay * (Number(employerRate) / 100) * 100) / 100
  return { employee, employer }
}

export function buildPayslipTotals({
  basePay = 0,
  overtimePay = 0,
  allowances = 0,
  otherDeductions = 0,
  studentLoan = 0,
  taxCode = 'M',
  kiwiSaverEnrolled = false,
  kiwiSaverRate = 3,
  kiwiSaverEmployerRate = 3,
}) {
  const grossPay = Number(basePay) + Number(overtimePay) + Number(allowances)
  const payeTax = estimatePayeMonthly(grossPay, taxCode)
  const ks = kiwiSaverEnrolled
    ? calculateKiwiSaver(grossPay, kiwiSaverRate, kiwiSaverEmployerRate)
    : { employee: 0, employer: 0 }
  const netPay =
    grossPay - payeTax - ks.employee - Number(studentLoan) - Number(otherDeductions)

  return {
    grossPay: Math.round(grossPay * 100) / 100,
    payeTax,
    kiwiSaverEmployee: ks.employee,
    kiwiSaverEmployer: ks.employer,
    esct: Math.round(ks.employer * 0.1 * 100) / 100,
    netPay: Math.round(Math.max(netPay, 0) * 100) / 100,
  }
}

export function parseTimeToHours(startTime, endTime, breakMinutes = 0) {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let start = sh + sm / 60
  let end = eh + em / 60
  if (end < start) end += 24
  return Math.max(0, end - start - breakMinutes / 60)
}
