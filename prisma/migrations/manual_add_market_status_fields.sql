-- ============================================================================
-- GeoMoney TV — Manual Migration: Add market status fields to CommodityPrice
-- Apply this when prisma migrate dev cannot reach the remote DB.
-- ============================================================================
-- Generated from schema change: marketStatus + lastTradingTimestamp on CommodityPrice

ALTER TABLE `CommodityPrice`
  ADD COLUMN `marketStatus` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
  ADD COLUMN `lastTradingTimestamp` DATETIME(3) NULL;

UPDATE `CommodityPrice` SET `marketStatus` = 'OPEN' WHERE `marketStatus` IS NULL;