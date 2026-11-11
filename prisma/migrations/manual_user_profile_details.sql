-- Add an optional phone number to existing user accounts.
ALTER TABLE `User`
  ADD COLUMN `phone` VARCHAR(32) NULL;
