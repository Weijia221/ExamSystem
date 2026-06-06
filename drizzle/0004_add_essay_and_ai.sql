-- 新增 essay (问答题) 类型到 questions 表
ALTER TABLE `questions` MODIFY COLUMN `type` enum('single','multiple','trueFalse','fillBlank','essay') NOT NULL;

-- 新增评分标准字段
ALTER TABLE `questions` ADD `gradingRubric` text;

-- 新增 AI 评分字段到 studentAnswers 表
ALTER TABLE `studentAnswers` ADD `aiScore` decimal(5,2);
ALTER TABLE `studentAnswers` ADD `aiComment` text;
