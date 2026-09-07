CREATE TABLE `daily_closings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_date` text NOT NULL,
	`opening_time` text,
	`closing_time` text,
	`items` integer DEFAULT 0 NOT NULL,
	`bills` integer DEFAULT 0 NOT NULL,
	`gross_sales` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`refund` real DEFAULT 0 NOT NULL,
	`net_sales` real DEFAULT 0 NOT NULL,
	`cash_expected` real DEFAULT 0 NOT NULL,
	`cash_actual` real DEFAULT 0 NOT NULL,
	`cash_difference` real DEFAULT 0 NOT NULL,
	`category_total` real DEFAULT 0 NOT NULL,
	`payment_total` real DEFAULT 0 NOT NULL,
	`source_image_key` text,
	`note` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_closings_business_date_unique` ON `daily_closings` (`business_date`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_date` text NOT NULL,
	`payee` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`payment_method` text NOT NULL,
	`amount` real NOT NULL,
	`receipt_key` text,
	`note` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
