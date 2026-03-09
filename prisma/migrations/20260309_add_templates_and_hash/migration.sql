-- Add hash field to prescriptions
ALTER TABLE "prescriptions" ADD COLUMN "hash" TEXT;

-- Create prescription_templates table
CREATE TABLE "prescription_templates" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "examType"    TEXT NOT NULL,
    "examDetails" TEXT,
    "diagnosis"   TEXT,
    "notes"       TEXT,
    "urgency"     BOOLEAN NOT NULL DEFAULT false,
    "doctorId"    TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prescription_templates_doctorId_idx" ON "prescription_templates"("doctorId");

ALTER TABLE "prescription_templates" ADD CONSTRAINT "prescription_templates_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
