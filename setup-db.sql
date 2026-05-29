-- 考试系统数据库初始化脚本
-- 使用方法：mysql -u root -p < setup-db.sql

CREATE DATABASE IF NOT EXISTS exam_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE exam_system;

-- 运行 drizzle 迁移创建表结构（在项目目录下执行）：
-- pnpm db:push

-- 插入默认账号（首次登录时也会自动创建，这里提前插入方便直接使用）
INSERT IGNORE INTO `users` (`openId`, `name`, `email`, `loginMethod`, `role`, `lastSignedIn`) VALUES
('local_admin', '管理员', 'local_admin@local.com', 'local', 'admin', NOW()),
('local_teacher', '教师', 'local_teacher@local.com', 'local', 'teacher', NOW()),
('local_student', '学生1', 'local_student@local.com', 'local', 'student', NOW()),
('local_student2', '学生2', 'local_student2@local.com', 'local', 'student', NOW()),
('local_student3', '学生3', 'local_student3@local.com', 'local', 'student', NOW());
