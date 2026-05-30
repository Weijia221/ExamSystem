# 在线考试系统

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置数据库

确保本地已安装并运行 MySQL，然后执行：

```bash
# 创建数据库和默认账号
mysql -u root < setup-db.sql
```

### 3. 创建环境变量

```bash
# 复制示例配置（默认连接本地 MySQL，无密码）
cp .env.example .env
```

### 4. 初始化表结构

```bash
pnpm db:push
```

### 5. 启动项目

```bash
本地启动pnpm dev
远程连接pnpm tunnel
```

## 默认账号

| 用户名  | 密码   | 角色   |
| ------- | ------ | ------ |
| admin   | 123456 | 管理员 |
| teacher | 123456 | 教师   |
| student | 123456 | 学生   |
