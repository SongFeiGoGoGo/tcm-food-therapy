# view_logs 集合说明

导入时一般为空，由浏览行为写入。

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| openId | string | 用户 openid（本地模式为 local_xxx） |
| targetType | string | `symptom` / `recipe` |
| targetId | string | 目标 ID |
| symptomId | string | 关联症状 ID |
| page | string | 页面名 |
| at | number | 客户端毫秒时间戳 |
| createdAt | date | 服务端时间（云函数写入） |
