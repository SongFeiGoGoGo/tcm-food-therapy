# 中医食疗按症状点选工具（微信小程序）

按常见不适症状点选，查看对应的中医食疗参考方案（食材克数、配伍说明、注意事项）。  
支持**微信云开发**落库；未开通云环境时自动进入**本地演示模式**（JSON 种子 + `wx.storage`），用微信开发者工具即可预览。

> **免责声明：理性讨论，不替代面诊。** 体质因人而异，内容仅供学习交流，不能代替执业医师诊断与治疗。

## 功能概览

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `pages/index` | 中医小笔记 + 养生日记入口、我的收藏 |
| 中医小笔记 | `pages/notes` | 学习笔记列表 |
| 食疗详情 | `pages/detail` | 食材+克数、配伍、做法、注意、收藏、免责声明 |
| 养生日记 | `pages/diary/list` / `edit` | 本地写入睡/便/口味等；本周小结仅计数 |
| 我的收藏 | `pages/favorites` | 从云库或本地存储读取 |

症状与方案见 `utils/seed.js`（含学习笔记条目）。

（首批三条食疗文案已改写；仍为理性讨论，可继续在 `utils/seed.js` 与 `cloud/database/*.json` 中调整。）

## 目录结构

```
tcm-food-therapy-miniprogram/
├── app.js / app.json / app.wxss
├── project.config.json          # appid 现为 touristappid
├── sitemap.json
├── pages/
│   ├── index/                   # 首页入口
│   ├── notes/                   # 中医小笔记
│   ├── diary/list · edit        # 养生日记（本地写入）
│   ├── detail/                  # 食疗详情
│   └── favorites/               # 我的收藏
├── utils/
│   ├── seed.js                  # 本地种子数据
│   ├── api.js                   # 云 / 本地统一数据层
│   └── diary.js                 # 养生日记 storage
├── cloudfunctions/
│   ├── getSymptoms
│   ├── getRecipeById
│   ├── toggleFavorite
│   ├── listFavorites
│   └── logView
├── cloud/database/              # 可选：导入云库的 JSON / 字段说明
├── LICENSE                      # MIT
└── README.md
```

## 用微信开发者工具打开

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。  
2. 选择「导入项目」→ 目录选本仓库根目录。  
3. AppID：可先用测试号，或使用项目里的 `touristappid`（游客模式）。  
4. 不勾选 / 暂不开通云开发也可直接编译预览——首页会显示「本地演示模式」。

### 换成自己的 AppID

1. 在[微信公众平台](https://mp.weixin.qq.com/)注册小程序，拿到 AppID。  
2. 修改 `project.config.json` 中的 `"appid"` 字段。  
3. 本地私有覆盖可写在 `project.private.config.json`（已加入 `.gitignore`，勿提交真实密钥类配置）。

## 本地模式说明（推荐先这样验证）

当 `app.js` 里 `cloudEnv` 为空，或 `wx.cloud.init` 未成功时：

- 症状 / 食疗：读 `utils/seed.js`  
- 收藏 / 浏览日志：写 `wx.setStorage`（键名 `favorites`、`view_logs`）  
- 养生日记：写 `wx.setStorage`（键名 `tcm_diary_entries`），仅本机，不走云  
- 首页会显示黄色标签「本地演示模式」

**验证步骤：**

1. 保持 `app.js` 中 `const cloudEnv = ''`。  
2. 开发者工具编译 → 应看到 3 条症状。  
3. 点进详情 → 可见食材、配伍、注意、底部「理性讨论，不替代面诊」。  
4. 点「收藏此方案」→ 打开「我的收藏」应能看到；再进详情可取消收藏。  
5. 开发者工具 → 调试器 → Storage，可看到 `favorites` / `view_logs` 有数据。

**养生日记验证：** 首页点「养生日记」→ 写一条 → 返回列表 → 点卡片进编辑 → 列表左滑删除（需确认）→ 本周小结为横向小卡片。Storage 键 `tcm_diary_entries`。

**笔记列表验证：** 「中医小笔记」→ 我的笔记 / 内置笔记均支持左滑露出删除或移除（需确认）；无「点卡片编辑」等提示文案。

## 开通云开发（可选）

1. 开发者工具顶部「云开发」→ 开通，创建环境，复制**环境 ID**。  
2. 在 `app.js` 中设置：

```js
const cloudEnv = '你的环境ID'; // 非空且 init 成功后走云函数
```

3. 在云开发控制台创建集合（权限建议先「仅管理端可写，所有用户可读」或按业务收紧 `favorites` / `view_logs`）：

### 数据库集合字段

#### `symptoms`

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 如 `symptom_acne_chin` |
| `name` | string | 症状名 |
| `summary` | string | 一句话摘要 |
| `icon` | string | 展示用 emoji 或图标名 |
| `sort` | number | 排序，升序 |
| `recipeId` | string | 关联食疗 `_id` |

#### `recipes`

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 如 `recipe_acne_chin` |
| `symptomId` | string | 关联症状 |
| `title` / `subtitle` | string | 标题与副标题 |
| `ingredients` | array | `{ name, amount }[]` |
| `pairing` | string | 配伍说明 |
| `steps` | array | 做法步骤字符串数组 |
| `notes` | array | 注意事项字符串数组 |
| `tags` | array | 标签 |

#### `favorites`

| 字段 | 类型 | 说明 |
|------|------|------|
| `openId` | string | 用户 openid |
| `recipeId` | string | 食疗 ID |
| `createdAt` | number | 毫秒时间戳 |

建议索引：`openId` + `recipeId`。

#### `view_logs`

| 字段 | 类型 | 说明 |
|------|------|------|
| `openId` | string | 用户 openid |
| `targetType` | string | `symptom` / `recipe` |
| `targetId` | string | 目标 ID |
| `symptomId` | string | 关联症状 |
| `page` | string | 页面标识 |
| `at` | number | 客户端时间戳 |
| `createdAt` | date | 服务端时间 |

### 导入种子数据

可将 `cloud/database/symptoms.json`、`recipes.json` 在云控制台「数据库」→ 对应集合 → 导入（或逐条添加，保持 `_id` 与 JSON 一致）。  
`favorites`、`view_logs` 初始为空即可。

### 部署云函数

对 `cloudfunctions` 下每个目录（`getSymptoms`、`getRecipeById`、`toggleFavorite`、`listFavorites`、`logView`）：

1. 右键 →「上传并部署：云端安装依赖」（需已关联云环境）。  
2. 部署完成后重新编译小程序；首页应变为「云开发已连接」。  
3. 云调用失败时前端仍会回退本地数据，避免白屏。

## 云函数清单

| 名称 | 作用 |
|------|------|
| `getSymptoms` | 返回症状列表（按 `sort`） |
| `getRecipeById` | 按食疗 ID 或症状 ID 取详情 |
| `toggleFavorite` | 切换当前用户收藏 |
| `listFavorites` | 当前用户收藏列表（含摘要） |
| `logView` | 写入浏览日志 |

## 开源协议

[MIT License](./LICENSE)

## 再次强调的免责声明

本项目提供的食疗内容为**传统文化与饮食角度的理性讨论与技术演示**，**不构成医疗建议**，**不能替代执业中医师 / 医师的面诊、辨证与处方**。若有不适，请及时前往正规医疗机构就诊。
