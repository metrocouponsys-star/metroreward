CREATE TABLE `audit_log` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`actor_type` enum('customer','shop','admin','system') NOT NULL,
	`actor_id` char(36),
	`action` varchar(64) NOT NULL,
	`detail` json DEFAULT ('{}'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` char(36) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`name` varchar(128) NOT NULL DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_phone_idx` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `otp_requests` (
	`id` char(36) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`code_hash` char(64) NOT NULL,
	`ip` varchar(45) NOT NULL,
	`attempts` tinyint NOT NULL DEFAULT 0,
	`expires_at` timestamp NOT NULL,
	`consumed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`stamps_required` int NOT NULL DEFAULT 8,
	`reward_text` varchar(256) NOT NULL DEFAULT '',
	`cooldown_minutes` int NOT NULL DEFAULT 360,
	`max_stamps_per_day` int NOT NULL DEFAULT 2,
	`require_approval` boolean NOT NULL DEFAULT false,
	`scratch_enabled` boolean NOT NULL DEFAULT true,
	`scratch_every_n_visits` int NOT NULL DEFAULT 1,
	`prize_expiry_days` int NOT NULL DEFAULT 30,
	CONSTRAINT `programs_id` PRIMARY KEY(`id`),
	CONSTRAINT `programs_shop_id_idx` UNIQUE(`shop_id`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` char(36) NOT NULL,
	`customer_id` char(36) NOT NULL,
	`endpoint` varchar(512) NOT NULL,
	`keys` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `push_subscriptions_endpoint_idx` UNIQUE(`endpoint`)
);
--> statement-breakpoint
CREATE TABLE `reminder_mutes` (
	`customer_id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	CONSTRAINT `reminder_mutes_customer_id_shop_id_pk` PRIMARY KEY(`customer_id`,`shop_id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` char(36) NOT NULL,
	`customer_id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`kind` enum('reward_ready','one_to_go','win_back','prize_expiring') NOT NULL,
	`send_after` timestamp NOT NULL,
	`sent_at` timestamp,
	`cancelled_at` timestamp,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`customer_id` char(36) NOT NULL,
	`source` enum('stamp_card','scratch') NOT NULL,
	`title` varchar(256) NOT NULL,
	`status` enum('earned','claimed','redeemed','expired') NOT NULL DEFAULT 'earned',
	`code` char(8),
	`code_expires_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`redeemed_at` timestamp,
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`),
	CONSTRAINT `rewards_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `scratch_cards` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`customer_id` char(36) NOT NULL,
	`stamp_event_id` char(36) NOT NULL,
	`prize_id` char(36) NOT NULL,
	`reward_id` char(36),
	`revealed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scratch_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scratch_prizes` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`title` varchar(128) NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`stock` int,
	`is_no_prize` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `scratch_prizes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`id` char(36) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`owner_phone` varchar(20) NOT NULL,
	`lat` float,
	`lng` float,
	`qr_secret` varbinary(32) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shops_id` PRIMARY KEY(`id`),
	CONSTRAINT `shops_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `stamp_events` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`customer_id` char(36) NOT NULL,
	`token_nonce` varchar(64) NOT NULL,
	`status` enum('pending','counted','voided') NOT NULL DEFAULT 'counted',
	`flags` json DEFAULT ('{}'),
	`void_reason` varchar(256),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stamp_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `stamp_events_nonce_idx` UNIQUE(`shop_id`,`customer_id`,`token_nonce`)
);
--> statement-breakpoint
CREATE INDEX `otp_requests_phone_idx` ON `otp_requests` (`phone`,`created_at`);--> statement-breakpoint
CREATE INDEX `reminders_send_after_idx` ON `reminders` (`send_after`);--> statement-breakpoint
CREATE INDEX `stamp_events_lookup_idx` ON `stamp_events` (`shop_id`,`customer_id`,`created_at`);