-- GeoMoney Stripe billing foundations. Apply once before enabling checkout.
ALTER TABLE `User`
  ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `User_stripeCustomerId_key` (`stripeCustomerId`);

CREATE TABLE `Subscription` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `stripeSubscriptionId` VARCHAR(191) NOT NULL,
  `stripePriceId` VARCHAR(191) NOT NULL,
  `planKey` VARCHAR(191) NOT NULL DEFAULT 'basic',
  `status` VARCHAR(191) NOT NULL,
  `currentPeriodStart` DATETIME(3) NULL,
  `currentPeriodEnd` DATETIME(3) NULL,
  `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
  `canceledAt` DATETIME(3) NULL,
  `endedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Subscription_stripeSubscriptionId_key` (`stripeSubscriptionId`),
  INDEX `Subscription_userId_status_idx` (`userId`, `status`),
  CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StripeBillingEvent` (
  `id` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `StripeBillingEvent_eventId_key` (`eventId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
