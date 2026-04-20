-- AlterTable: add soft-delete column to prescriptions
ALTER TABLE "prescriptions" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Index for efficient filtering of active prescriptions
CREATE INDEX "prescriptions_deletedAt_idx" ON "prescriptions"("deletedAt");
