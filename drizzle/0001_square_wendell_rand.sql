CREATE TABLE `examQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`examId` int NOT NULL,
	`questionId` int NOT NULL,
	`order` int NOT NULL,
	`points` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `examQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `examRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`examId` int NOT NULL,
	`studentId` int NOT NULL,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`score` decimal(8,2),
	`status` enum('in_progress','submitted','graded') DEFAULT 'in_progress',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `examRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`totalPoints` decimal(8,2) NOT NULL,
	`duration` int NOT NULL,
	`startTime` timestamp,
	`endTime` timestamp,
	`passingScore` decimal(8,2),
	`status` enum('draft','published','closed') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practiceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`questionId` int NOT NULL,
	`studentAnswer` text NOT NULL,
	`isCorrect` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practiceRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`type` enum('single','multiple','trueFalse','fillBlank') NOT NULL,
	`title` text NOT NULL,
	`options` json,
	`correctAnswer` text NOT NULL,
	`explanation` text,
	`difficulty` enum('easy','medium','hard') DEFAULT 'medium',
	`category` varchar(100),
	`points` decimal(5,2) DEFAULT '1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`examRecordId` int NOT NULL,
	`questionId` int NOT NULL,
	`studentAnswer` text NOT NULL,
	`isCorrect` boolean,
	`earnedPoints` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','teacher','student') NOT NULL DEFAULT 'student';