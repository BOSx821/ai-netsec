CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`status` enum('open','in_progress','resolved') NOT NULL DEFAULT 'open',
	`riskScore` int NOT NULL DEFAULT 0,
	`sourceIp` varchar(45),
	`destinationIp` varchar(45),
	`assetId` int,
	`incidentId` int,
	`assignedUserId` int,
	`detectionMethod` enum('rule','ids','ml','correlation','manual') NOT NULL,
	`confidence` int NOT NULL DEFAULT 0,
	`aiExplanation` text,
	`recommendedActions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`hostname` varchar(160),
	`ipAddress` varchar(45),
	`assetType` enum('server','workstation','network','security','cloud','iot','unknown') NOT NULL,
	`operatingSystem` varchar(160),
	`owner` varchar(160),
	`status` enum('online','degraded','offline','unknown') NOT NULL DEFAULT 'unknown',
	`riskLevel` enum('critical','high','medium','low') NOT NULL DEFAULT 'low',
	`riskScore` int NOT NULL DEFAULT 0,
	`criticality` int NOT NULL DEFAULT 1,
	`lastSeen` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`resourceType` varchar(80) NOT NULL,
	`resourceId` varchar(80),
	`success` enum('true','false') NOT NULL DEFAULT 'true',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incident_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`actorUserId` int,
	`actionType` enum('created','status_changed','comment','assignment','evidence') NOT NULL,
	`previousStatus` varchar(32),
	`nextStatus` varchar(32),
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`riskScore` int NOT NULL DEFAULT 0,
	`assetId` int,
	`createdByUserId` int NOT NULL,
	`assignedUserId` int,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportType` enum('posture','incident','inventory') NOT NULL,
	`title` varchar(200) NOT NULL,
	`generatedByUserId` int NOT NULL,
	`content` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`globalRiskScore` int NOT NULL,
	`activeAlerts` int NOT NULL,
	`openIncidents` int NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','analyst','admin') NOT NULL DEFAULT 'analyst';--> statement-breakpoint
UPDATE `users` SET `role` = 'analyst' WHERE `role` = 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('analyst','admin') NOT NULL DEFAULT 'analyst';--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_assetId_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_incidentId_incidents_id_fk` FOREIGN KEY (`incidentId`) REFERENCES `incidents`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_assignedUserId_users_id_fk` FOREIGN KEY (`assignedUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incident_actions` ADD CONSTRAINT `incident_actions_incidentId_incidents_id_fk` FOREIGN KEY (`incidentId`) REFERENCES `incidents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incident_actions` ADD CONSTRAINT `incident_actions_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_assetId_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_assignedUserId_users_id_fk` FOREIGN KEY (`assignedUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_generatedByUserId_users_id_fk` FOREIGN KEY (`generatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `alerts_status_idx` ON `alerts` (`status`);--> statement-breakpoint
CREATE INDEX `alerts_severity_idx` ON `alerts` (`severity`);--> statement-breakpoint
CREATE INDEX `alerts_created_at_idx` ON `alerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `assets_risk_level_idx` ON `assets` (`riskLevel`);--> statement-breakpoint
CREATE INDEX `assets_status_idx` ON `assets` (`status`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `incident_actions_incident_idx` ON `incident_actions` (`incidentId`);--> statement-breakpoint
CREATE INDEX `incidents_status_idx` ON `incidents` (`status`);--> statement-breakpoint
CREATE INDEX `incidents_severity_idx` ON `incidents` (`severity`);--> statement-breakpoint
CREATE INDEX `reports_created_at_idx` ON `reports` (`createdAt`);--> statement-breakpoint
CREATE INDEX `risk_snapshots_captured_at_idx` ON `risk_snapshots` (`capturedAt`);
