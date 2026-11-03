# feedback 集合说明

由「我的 → 反馈」页在云开发已连接时写入。客户端只新增，在云控制台查看。不要把环境 ID 写进仓库。

建议权限：所有用户可新增，仅管理端可读写（或「仅创建者可写，所有人不可读」）。

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `message` | string | 反馈正文 |
| `contact` | string | 选填联系方式，可为空 |
| `source` | string | 固定 `tcm-miniprogram` |
| `createdAt` | date | `db.serverDate()` |
