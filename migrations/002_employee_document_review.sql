-- Document request review workflow (ERP P0)
ALTER TABLE employee_document_requests
  ADD COLUMN IF NOT EXISTS "requestedById" INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS "reviewedById" INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

ALTER TABLE employee_documents
  ADD COLUMN IF NOT EXISTS "originalFilename" VARCHAR(512),
  ADD COLUMN IF NOT EXISTS "mimeType" VARCHAR(128),
  ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
