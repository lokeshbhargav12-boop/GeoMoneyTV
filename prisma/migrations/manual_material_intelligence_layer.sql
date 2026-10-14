-- ============================================================================
-- Critical Materials Intelligence - seven capability layer (C1-C7)
-- Adds: MaterialEvent (canonical event, C5), MaterialEventLink (relevance, C1),
-- EventImplication (structured so-what, C3), MaterialRiskPulse (score history,
-- C4), MaterialRiskState (early-warning, C2), ShockSimulation (C7).
-- All changes are ADDITIVE. Apply to production MySQL, then run
-- GET /api/cron/material-intel once to backfill scores/states.
-- ============================================================================
-- CreateTable
CREATE TABLE `MaterialEvent` (
    `id` VARCHAR(191) NOT NULL,
    `eventKey` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` TEXT NULL,
    `eventType` VARCHAR(191) NOT NULL DEFAULT 'other',
    `stage` VARCHAR(191) NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sourceName` VARCHAR(191) NULL,
    `sourceUrl` TEXT NULL,
    `articleId` VARCHAR(191) NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'moderate',
    `confidence` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `countries` TEXT NULL,
    `companies` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MaterialEvent_eventKey_key`(`eventKey`),
    INDEX `MaterialEvent_eventType_idx`(`eventType`),
    INDEX `MaterialEvent_occurredAt_idx`(`occurredAt`),
    INDEX `MaterialEvent_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialEventLink` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `relevanceScore` INTEGER NOT NULL,
    `relevanceLevel` INTEGER NOT NULL DEFAULT 1,
    `relationshipType` VARCHAR(191) NOT NULL DEFAULT 'direct',
    `whyRelevant` TEXT NULL,
    `severity` VARCHAR(191) NULL,
    `confidence` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MaterialEventLink_materialId_relevanceScore_idx`(`materialId`, `relevanceScore`),
    INDEX `MaterialEventLink_relevanceLevel_idx`(`relevanceLevel`),
    UNIQUE INDEX `MaterialEventLink_eventId_materialId_key`(`eventId`, `materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventImplication` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `whatHappened` TEXT NOT NULL,
    `supplyImplication` VARCHAR(191) NOT NULL DEFAULT 'uncertain',
    `supplySeverity` VARCHAR(191) NULL,
    `demandImplication` VARCHAR(191) NOT NULL DEFAULT 'uncertain',
    `demandSeverity` VARCHAR(191) NULL,
    `priceDirection` VARCHAR(191) NOT NULL DEFAULT 'unclear',
    `affectedApplications` TEXT NULL,
    `timeHorizon` VARCHAR(191) NOT NULL DEFAULT 'uncertain',
    `watchTriggers` TEXT NULL,
    `assessment` TEXT NULL,
    `confidence` VARCHAR(191) NOT NULL DEFAULT 'low',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EventImplication_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialRiskPulse` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `asOf` DATETIME(3) NOT NULL,
    `score` INTEGER NOT NULL,
    `supplyRisk` INTEGER NOT NULL,
    `policyRisk` INTEGER NOT NULL,
    `demandPressure` INTEGER NOT NULL,
    `marketStress` INTEGER NOT NULL,
    `supplyResponse` INTEGER NOT NULL,
    `contributions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MaterialRiskPulse_asOf_idx`(`asOf`),
    UNIQUE INDEX `MaterialRiskPulse_materialId_asOf_key`(`materialId`, `asOf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialRiskState` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `statusSince` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `drivers` TEXT NULL,
    `delta24h` INTEGER NOT NULL DEFAULT 0,
    `delta7d` INTEGER NOT NULL DEFAULT 0,
    `delta30d` INTEGER NOT NULL DEFAULT 0,
    `signals24h` INTEGER NOT NULL DEFAULT 0,
    `signals7d` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MaterialRiskState_materialId_key`(`materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShockSimulation` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `shockType` VARCHAR(191) NOT NULL,
    `magnitudePct` INTEGER NOT NULL,
    `geography` VARCHAR(191) NULL,
    `durationDays` INTEGER NOT NULL DEFAULT 90,
    `note` TEXT NULL,
    `result` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ShockSimulation_materialId_createdAt_idx`(`materialId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MaterialEvent` ADD CONSTRAINT `MaterialEvent_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialEventLink` ADD CONSTRAINT `MaterialEventLink_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `MaterialEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialEventLink` ADD CONSTRAINT `MaterialEventLink_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `RareEarthMaterial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventImplication` ADD CONSTRAINT `EventImplication_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `MaterialEvent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRiskPulse` ADD CONSTRAINT `MaterialRiskPulse_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `RareEarthMaterial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialRiskState` ADD CONSTRAINT `MaterialRiskState_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `RareEarthMaterial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShockSimulation` ADD CONSTRAINT `ShockSimulation_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `RareEarthMaterial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

