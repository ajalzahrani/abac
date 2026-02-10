-- CreateEnum
CREATE TYPE "PolicyEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "PolicyRuleOperator" AS ENUM ('equals', 'notEquals', 'in', 'notIn', 'contains', 'notContains', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'exists', 'notExists', 'regex');

-- CreateEnum
CREATE TYPE "LogicalOperator" AS ENUM ('AND', 'OR');

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effect" "PolicyEffect" NOT NULL DEFAULT 'ALLOW',
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyRule" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "operator" "PolicyRuleOperator" NOT NULL DEFAULT 'equals',
    "value" JSONB,
    "logicalOperator" "LogicalOperator" DEFAULT 'AND',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAssignment" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "userId" TEXT,
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Policy_name_key" ON "Policy"("name");

-- CreateIndex
CREATE INDEX "Policy_resourceType_action_isActive_idx" ON "Policy"("resourceType", "action", "isActive");

-- CreateIndex
CREATE INDEX "Policy_priority_idx" ON "Policy"("priority");

-- CreateIndex
CREATE INDEX "PolicyRule_policyId_order_idx" ON "PolicyRule"("policyId", "order");

-- CreateIndex
CREATE INDEX "PolicyAssignment_userId_idx" ON "PolicyAssignment"("userId");

-- CreateIndex
CREATE INDEX "PolicyAssignment_roleId_idx" ON "PolicyAssignment"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyAssignment_policyId_userId_roleId_key" ON "PolicyAssignment"("policyId", "userId", "roleId");

-- AddForeignKey
ALTER TABLE "PolicyRule" ADD CONSTRAINT "PolicyRule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAssignment" ADD CONSTRAINT "PolicyAssignment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAssignment" ADD CONSTRAINT "PolicyAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
