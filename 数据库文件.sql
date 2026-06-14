-- MySQL dump 10.13  Distrib 8.4.4, for Win64 (x86_64)
--
-- Host: localhost    Database: exam_system
-- ------------------------------------------------------
-- Server version	8.4.4

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `examquestions`
--

DROP TABLE IF EXISTS `examquestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examquestions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `examId` int NOT NULL,
  `questionId` int NOT NULL,
  `order` int NOT NULL,
  `points` decimal(5,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examquestions`
--

LOCK TABLES `examquestions` WRITE;
/*!40000 ALTER TABLE `examquestions` DISABLE KEYS */;
INSERT INTO `examquestions` VALUES (1,1,1,1,1.00,'2026-05-29 13:44:58'),(2,2,2,1,1.00,'2026-05-30 02:11:05'),(5,4,1,1,50.00,'2026-05-30 02:25:53'),(6,4,2,2,50.00,'2026-05-30 02:25:53');
/*!40000 ALTER TABLE `examquestions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examrecords`
--

DROP TABLE IF EXISTS `examrecords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examrecords` (
  `id` int NOT NULL AUTO_INCREMENT,
  `examId` int NOT NULL,
  `studentId` int NOT NULL,
  `startTime` timestamp NOT NULL,
  `endTime` timestamp NULL DEFAULT NULL,
  `score` decimal(8,2) DEFAULT NULL,
  `status` enum('in_progress','submitted','graded') COLLATE utf8mb4_unicode_ci DEFAULT 'in_progress',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examrecords`
--

LOCK TABLES `examrecords` WRITE;
/*!40000 ALTER TABLE `examrecords` DISABLE KEYS */;
INSERT INTO `examrecords` VALUES (1,1,3,'2026-05-29 05:45:16','2026-05-29 05:45:20',0.00,'graded','2026-05-29 13:45:19','2026-05-29 13:45:19'),(2,1,3,'2026-05-29 05:45:27','2026-05-29 05:45:30',1.00,'graded','2026-05-29 13:45:29','2026-05-29 13:45:29'),(3,1,3,'2026-05-29 06:21:47','2026-05-29 06:21:54',1.00,'graded','2026-05-29 14:21:53','2026-05-29 14:21:53'),(4,4,3,'2026-05-29 18:51:50','2026-05-29 18:51:56',100.00,'graded','2026-05-30 02:51:56','2026-05-30 02:51:56');
/*!40000 ALTER TABLE `examrecords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdBy` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `totalPoints` decimal(8,2) NOT NULL,
  `duration` int NOT NULL,
  `startTime` timestamp NULL DEFAULT NULL,
  `endTime` timestamp NULL DEFAULT NULL,
  `passingScore` decimal(8,2) DEFAULT NULL,
  `status` enum('draft','published','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `allowRetake` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams` DISABLE KEYS */;
INSERT INTO `exams` VALUES (1,2,'测试卷',NULL,1.00,60,NULL,NULL,0.00,'published','2026-05-29 13:44:58','2026-05-29 13:44:58',1),(2,1,'测试卷2',NULL,1.00,60,NULL,NULL,0.00,'published','2026-05-30 02:11:05','2026-05-30 02:11:05',1),(4,1,'测试3',NULL,100.00,60,NULL,NULL,0.00,'published','2026-05-30 02:25:53','2026-05-30 02:25:53',1);
/*!40000 ALTER TABLE `exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `practicerecords`
--

DROP TABLE IF EXISTS `practicerecords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `practicerecords` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentId` int NOT NULL,
  `questionId` int NOT NULL,
  `studentAnswer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `isCorrect` tinyint(1) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `practicerecords`
--

LOCK TABLES `practicerecords` WRITE;
/*!40000 ALTER TABLE `practicerecords` DISABLE KEYS */;
/*!40000 ALTER TABLE `practicerecords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdBy` int NOT NULL,
  `type` enum('single','multiple','trueFalse','fillBlank') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` json DEFAULT NULL,
  `correctAnswer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `explanation` text COLLATE utf8mb4_unicode_ci,
  `difficulty` enum('easy','medium','hard') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points` decimal(5,2) DEFAULT '1.00',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (1,1,'trueFalse','测试判断题','{\"A\": \"正确\", \"B\": \"错误\"}','B',NULL,'medium',NULL,1.00,'2026-05-29 13:43:30','2026-05-29 13:43:30',NULL),(2,1,'single','测试单选题','{\"A\": \"A\", \"B\": \"B\", \"C\": \"都选C\", \"D\": \"D\"}','C',NULL,'medium',NULL,1.00,'2026-05-30 01:04:37','2026-05-30 01:04:37',NULL),(3,1,'trueFalse','判断题2','{\"A\": \"正确\", \"B\": \"错误\"}','A',NULL,'hard',NULL,1.00,'2026-05-30 05:48:59','2026-05-30 05:48:59',NULL);
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `studentanswers`
--

DROP TABLE IF EXISTS `studentanswers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studentanswers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `examRecordId` int NOT NULL,
  `questionId` int NOT NULL,
  `studentAnswer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `isCorrect` tinyint(1) DEFAULT NULL,
  `earnedPoints` decimal(5,2) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `studentanswers`
--

LOCK TABLES `studentanswers` WRITE;
/*!40000 ALTER TABLE `studentanswers` DISABLE KEYS */;
INSERT INTO `studentanswers` VALUES (1,1,1,'A',0,0.00,'2026-05-29 13:45:19','2026-05-29 13:45:19'),(2,2,1,'B',1,1.00,'2026-05-29 13:45:29','2026-05-29 13:45:29'),(3,3,1,'B',1,1.00,'2026-05-29 14:21:53','2026-05-29 14:21:53'),(4,4,1,'B',1,50.00,'2026-05-30 02:51:56','2026-05-30 02:51:56'),(5,4,2,'C',1,50.00,'2026-05-30 02:51:56','2026-05-30 02:51:56');
/*!40000 ALTER TABLE `studentanswers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci,
  `email` varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loginMethod` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('user','admin','teacher','student') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_openId_unique` (`openId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'local_admin','管理员','local_admin@local.com','local','admin','2026-05-29 13:40:47','2026-05-29 13:40:47','2026-05-29 05:40:47'),(2,'local_teacher','教师','local_teacher@local.com','local','teacher','2026-05-29 13:43:57','2026-05-29 13:43:57','2026-05-29 05:43:57'),(3,'local_student','学生1','local_student@local.com','local','student','2026-05-29 13:44:16','2026-05-29 13:44:16','2026-05-29 05:44:17'),(4,'local_student2','学生2','local_student2@local.com','local','student','2026-05-29 13:48:48','2026-05-29 13:48:48','2026-05-29 05:48:49'),(5,'local_student3','学生3','local_student3@local.com','local','student','2026-05-29 13:48:48','2026-05-29 13:48:48','2026-05-29 05:48:49');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-30 14:00:41
