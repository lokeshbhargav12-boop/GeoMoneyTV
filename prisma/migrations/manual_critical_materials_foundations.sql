-- ============================================================================
-- Critical Materials Intelligence — structured foundations
-- Covers: P0-16 (permanent material keys), P0-15 (backend taxonomy fields),
-- F2 (structured applications), F3 (countries by supply-chain stage),
-- F4 (source provenance), F5 (benchmark + price-history architecture),
-- C6 prep (TrackedMaterial.lastSeenAt).
-- All changes are ADDITIVE: no existing column or table is altered destructively.
-- Apply to the production MySQL database, then re-run the seed endpoint
-- (POST /api/rare-earth) to backfill materialKey/materialFamily.
-- ============================================================================

-- P0-16 + P0-15: permanent key and backend taxonomy on the material master
ALTER TABLE `RareEarthMaterial`
  ADD COLUMN `materialKey` VARCHAR(191) NULL,
  ADD COLUMN `materialFamily` VARCHAR(191) NULL,
  ADD COLUMN `applicationTags` TEXT NULL,
  ADD COLUMN `strategicTags` TEXT NULL;

CREATE UNIQUE INDEX `RareEarthMaterial_materialKey_key` ON `RareEarthMaterial`(`materialKey`);
CREATE INDEX `RareEarthMaterial_materialKey_idx` ON `RareEarthMaterial`(`materialKey`);

-- C6 prep: per user/material last-seen timestamp for "Since You Last Checked"
ALTER TABLE `TrackedMaterial`
  ADD COLUMN `lastSeenAt` DATETIME(3) NULL;

-- F4: source provenance
CREATE TABLE `Source` (
  `id` VARCHAR(191) NOT NULL,
  `publisher` VARCHAR(191) NOT NULL,
  `document` VARCHAR(191) NULL,
  `url` TEXT NULL,
  `publicationDate` DATETIME(3) NULL,
  `dataYear` INTEGER NULL,
  `retrievedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `verifiedAt` DATETIME(3) NULL,
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `Source_publisher_idx` (`publisher`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- F2: structured application relationships for OSINT/news matching
CREATE TABLE `MaterialApplication` (
  `id` VARCHAR(191) NOT NULL,
  `materialId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `aliases` TEXT NULL,
  `relationship` VARCHAR(191) NOT NULL DEFAULT 'direct_use',
  `strength` VARCHAR(191) NOT NULL DEFAULT 'moderate',
  `qualifiesWithoutMention` BOOLEAN NOT NULL DEFAULT false,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `MaterialApplication_materialId_idx` (`materialId`),
  INDEX `MaterialApplication_strength_idx` (`strength`),
  CONSTRAINT `MaterialApplication_materialId_fkey`
    FOREIGN KEY (`materialId`) REFERENCES `RareEarthMaterial`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- F3: countries by supply-chain role with share/year/source metadata
CREATE TABLE `MaterialCountryRole` (
  `id` VARCHAR(191) NOT NULL,
  `materialId` VARCHAR(191) NOT NULL,
  `country` VARCHAR(191) NOT NULL,
  `stage` VARCHAR(191) NOT NULL,
  `sharePct` DOUBLE NULL,
  `dataYear` INTEGER NULL,
  `sourceId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `MaterialCountryRole_materialId_stage_idx` (`materialId`, `stage`),
  INDEX `MaterialCountryRole_country_idx` (`country`),
  CONSTRAINT `MaterialCountryRole_materialId_fkey`
    FOREIGN KEY (`materialId`) REFERENCES `RareEarthMaterial`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `MaterialCountryRole_sourceId_fkey`
    FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- F4: which sources back which material/field
CREATE TABLE `MaterialSourceLink` (
  `id` VARCHAR(191) NOT NULL,
  `materialId` VARCHAR(191) NOT NULL,
  `sourceId` VARCHAR(191) NOT NULL,
  `field` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `MaterialSourceLink_materialId_sourceId_field_key` (`materialId`, `sourceId`, `field`),
  INDEX `MaterialSourceLink_sourceId_idx` (`sourceId`),
  CONSTRAINT `MaterialSourceLink_materialId_fkey`
    FOREIGN KEY (`materialId`) REFERENCES `RareEarthMaterial`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `MaterialSourceLink_sourceId_fkey`
    FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- F5: price benchmark definitions (material -> product/form -> benchmark)
CREATE TABLE `PriceBenchmark` (
  `id` VARCHAR(191) NOT NULL,
  `materialId` VARCHAR(191) NOT NULL,
  `productForm` VARCHAR(191) NOT NULL,
  `grade` VARCHAR(191) NULL,
  `benchmarkName` VARCHAR(191) NULL,
  `market` VARCHAR(191) NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
  `unit` VARCHAR(191) NOT NULL,
  `updateFrequency` VARCHAR(191) NULL,
  `sourceId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `PriceBenchmark_materialId_idx` (`materialId`),
  CONSTRAINT `PriceBenchmark_materialId_fkey`
    FOREIGN KEY (`materialId`) REFERENCES `RareEarthMaterial`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PriceBenchmark_sourceId_fkey`
    FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- F5: append-only timestamped price history
CREATE TABLE `PriceObservation` (
  `id` VARCHAR(191) NOT NULL,
  `benchmarkId` VARCHAR(191) NOT NULL,
  `price` DOUBLE NOT NULL,
  `asOf` DATETIME(3) NOT NULL,
  `sourceId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `PriceObservation_benchmarkId_asOf_key` (`benchmarkId`, `asOf`),
  INDEX `PriceObservation_asOf_idx` (`asOf`),
  CONSTRAINT `PriceObservation_benchmarkId_fkey`
    FOREIGN KEY (`benchmarkId`) REFERENCES `PriceBenchmark`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PriceObservation_sourceId_fkey`
    FOREIGN KEY (`sourceId`) REFERENCES `Source`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
