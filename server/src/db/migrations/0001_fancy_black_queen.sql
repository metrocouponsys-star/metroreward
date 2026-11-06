CREATE TABLE `contact_requests` (
	`id` char(36) NOT NULL,
	`name` varchar(80) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(255),
	`shop_name` varchar(100),
	`city` varchar(80),
	`topic` enum('pilot','question','data_request','grievance') NOT NULL,
	`preferred_channel` enum('whatsapp','call','email') NOT NULL,
	`message` varchar(1000),
	`consent_at` timestamp(3) NOT NULL,
	`ip_hash` char(64) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_requests_id` PRIMARY KEY(`id`)
);
