/**
 * HR integration smoke tests (run with server up).
 * Usage: node tests/hr.integration.test.js
 */
import assert from 'assert'

const BASE = process.env.API_BASE || 'http://localhost:5000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function run() {
  const unauthHr = await request('/api/hr/leave-policies')
  assert.strictEqual(unauthHr.status, 401, 'HR routes should require auth')

  const unauthLeave = await request('/api/employee-leave/get')
  assert.strictEqual(unauthLeave.status, 401, 'Leave routes should require auth')

  const unauthStaffStats = await request('/api/hr/staff-stats')
  assert.strictEqual(unauthStaffStats.status, 401, 'Staff stats should require auth')

  const unauthPayslips = await request('/api/hr/payslips/user/1')
  assert.strictEqual(unauthPayslips.status, 401, 'Payslip routes should require auth')

  const unauthSecureUpload = await request('/api/uploads/secure/notices/test.pdf')
  assert.strictEqual(unauthSecureUpload.status, 401, 'Secure uploads should require auth')

  const unauthApprovals = await request('/api/hr/approvals/queue')
  assert.strictEqual(unauthApprovals.status, 401, 'Approvals queue should require auth')

  const unauthOnboarding = await request('/api/hr/onboarding')
  assert.strictEqual(unauthOnboarding.status, 401, 'Onboarding should require auth')

  console.log('HR integration smoke tests passed (8 checks)')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
