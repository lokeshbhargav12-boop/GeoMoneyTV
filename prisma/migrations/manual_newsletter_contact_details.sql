-- Add contact details for newsletter subscribers. Existing rows remain valid.
ALTER TABLE `Newsletter`
  ADD COLUMN `name` VARCHAR(191) NULL,
  ADD COLUMN `phone` VARCHAR(32) NULL;
