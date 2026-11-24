-- employee_leaves.status: VARCHAR → ENUM (run before Sequelize alter if sync fails)
ALTER TABLE employee_leaves ALTER COLUMN status DROP DEFAULT;
UPDATE employee_leaves SET status = LOWER(TRIM(status::text)) WHERE status IS NOT NULL;
UPDATE employee_leaves SET status = 'pending'
  WHERE status IS NULL OR status NOT IN ('pending','approved','rejected','cancelled');
DO $$ BEGIN
  CREATE TYPE enum_employee_leaves_status AS ENUM ('pending','approved','rejected','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE employee_leaves
  ALTER COLUMN status TYPE enum_employee_leaves_status
  USING (status::text::enum_employee_leaves_status);
ALTER TABLE employee_leaves ALTER COLUMN status SET DEFAULT 'pending'::enum_employee_leaves_status;
ALTER TABLE employee_leaves ALTER COLUMN status SET NOT NULL;


-- Worker user link
ALTER TABLE workers ADD COLUMN IF NOT EXISTS "userId" INTEGER UNIQUE REFERENCES users(id);

-- Employment profiles
CREATE TABLE IF NOT EXISTS employment_profiles (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id),
  "employeeNumber" VARCHAR(255),
  department VARCHAR(255),
  "jobTitle" VARCHAR(255),
  "costCentre" VARCHAR(255),
  "managerId" INTEGER REFERENCES users(id),
  "employmentType" VARCHAR(50) DEFAULT 'full_time',
  "startDate" DATE,
  "endDate" DATE,
  "standardHoursPerWeek" DECIMAL(5,2) DEFAULT 40,
  "standardHoursPerDay" DECIMAL(4,2) DEFAULT 8,
  "hourlyRate" DECIMAL(10,2),
  "annualSalary" DECIMAL(12,2),
  "irdTaxCode" VARCHAR(10) DEFAULT 'M',
  "kiwiSaverEnrolled" BOOLEAN DEFAULT false,
  "kiwiSaverRate" DECIMAL(5,2) DEFAULT 3,
  "kiwiSaverEmployerRate" DECIMAL(5,2) DEFAULT 3,
  "bankAccount" VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leave policies & balances
CREATE TABLE IF NOT EXISTS leave_policies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  "leaveType" VARCHAR(50) NOT NULL,
  "annualEntitlementDays" DECIMAL(5,2) DEFAULT 20,
  "carryOverDays" DECIMAL(5,2) DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "leaveType" VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  entitled DECIMAL(5,2) DEFAULT 0,
  used DECIMAL(5,2) DEFAULT 0,
  pending DECIMAL(5,2) DEFAULT 0,
  remaining DECIMAL(5,2) DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "leaveType", year)
);

-- Pay periods
CREATE TABLE IF NOT EXISTS pay_periods (
  id SERIAL PRIMARY KEY,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  "lockedAt" TIMESTAMPTZ,
  "lockedById" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payroll runs & payslips
CREATE TABLE IF NOT EXISTS payroll_runs (
  id SERIAL PRIMARY KEY,
  month VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  "payPeriodId" INTEGER REFERENCES pay_periods(id),
  status VARCHAR(20) DEFAULT 'draft',
  "lockedAt" TIMESTAMPTZ,
  "lockedById" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payslips (
  id SERIAL PRIMARY KEY,
  "payrollRunId" INTEGER NOT NULL REFERENCES payroll_runs(id),
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "basePay" DECIMAL(12,2) DEFAULT 0,
  "overtimePay" DECIMAL(12,2) DEFAULT 0,
  allowances DECIMAL(12,2) DEFAULT 0,
  "grossPay" DECIMAL(12,2) DEFAULT 0,
  "payeTax" DECIMAL(12,2) DEFAULT 0,
  "kiwiSaverEmployee" DECIMAL(12,2) DEFAULT 0,
  "kiwiSaverEmployer" DECIMAL(12,2) DEFAULT 0,
  "studentLoan" DECIMAL(12,2) DEFAULT 0,
  "otherDeductions" DECIMAL(12,2) DEFAULT 0,
  esct DECIMAL(12,2) DEFAULT 0,
  "netPay" DECIMAL(12,2) DEFAULT 0,
  "paymentDate" TIMESTAMPTZ,
  "paymentMethod" VARCHAR(255),
  "payslipPdfUrl" VARCHAR(500),
  "costCentre" VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_deductions (
  id SERIAL PRIMARY KEY,
  "payslipId" INTEGER NOT NULL REFERENCES payslips(id),
  type VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(255),
  "irdCode" VARCHAR(50),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  "certificateNumber" VARCHAR(255),
  "issuedDate" DATE,
  "expiryDate" DATE,
  status VARCHAR(30) DEFAULT 'valid',
  "documentUrl" VARCHAR(500),
  "renewalReminderDays" INTEGER DEFAULT 30,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
