# 中医食疗按症状点选工具（微信小程序）

按常见不适症状点选，查看对应的中医食疗参考方案（食材克数、配伍说明、注意事项）。  
支持**微信云开发**落库；未开通云环境时自动进入**本地演示模式**（JSON 种子 + `wx.storage`），用微信开发者工具即可预览。

> **免责声明：理论讨论，不替代面诊。** 体质因人而异，内容仅供学习交流，不能代替执业医师诊断与治疗。

## 功能概览

底栏四个 Tab（左→右）：**首页 | 笔记 | 打卡 | 我的**。冷启动打开首页。

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `pages/index` | 轮播占位（`utils/banners.js`）。无图用色块，不白屏 |
| 笔记 | `pages/notes` | 原「中医小笔记」：内置列表、详情、自建笔记；卡片右上角删除并确认 |
| 写笔记 | `pages/notes/edit` | 标题、药材名+克数（可增减）、槽位 A/B/C、自由正文 |
| 打卡 | `pages/diary/list` / `edit` | 原养生日记，读写与本周小结不变；导航与页内主标题为「打卡」 |
| 我的 | `pages/mine` | 本地登录闭环：头像、昵称（可改，写入 storage） |
| 食疗详情 | `pages/detail` | 内置笔记详情。食材+克数、配伍、做法、注意、收藏 |
| 我的收藏 | `pages/favorites` | 从「我的」进入；云库或本地存储 |

症状与方案见 `utils/seed.js`（含学习笔记条目）。

（首批三条食疗文案已改写。界面与种子里的免责声明统一为「理论讨论，不替代面诊」。正文可继续在 `utils/seed.js` 与 `cloud/database/*.json` 中调整。）

## 目录结构

```
tcm-food-therapy-miniprogram/
├── app.js / app.json / app.wxss
├── project.config.json          # appid 现为 touristappid
├── sitemap.json
├── pages/
│   ├── index/                   # Tab 首页（轮播）
│   ├── notes/                   # Tab 笔记
│   ├── diary/list · edit        # Tab 打卡（原养生日记，本地写入）
│   ├── mine/                    # Tab 我的（头像昵称）
│   ├── detail/                  # 食疗详情
│   └── favorites/               # 我的收藏
├── images/tab · banners         # tab 占位图标、轮播占位图
├── utils/
│   ├── seed.js                  # 本地种子数据
│   ├── api.js                   # 云 / 本地统一数据层
│   ├── banners.js               # 首页轮播配置
│   ├── userNotes.js             # 自建笔记 storage（含药材行、槽位）
│   ├── profile.js               # 我的：头像昵称；wx.login 的后端接入点
│   └── diary.js                 # 打卡（养生日记）storage
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
4. 不勾选 / 暂不开通云开发也可直接编译预览——首页会显示「本地演示模式」。`app.js` 保持 `cloudEnv = ''`，`project.config.json` 的 `appid` 保持 `touristappid`。

### 换成自己的 AppID

1. 在[微信公众平台](https://mp.weixin.qq.com/)注册小程序，拿到 AppID。  
2. 修改 `project.config.json` 中的 `"appid"` 字段。  
3. 本地私有覆盖可写在 `project.private.config.json`（已加入 `.gitignore`，勿提交真实密钥类配置）。

## 本地模式说明（推荐先这样验证）

当 `app.js` 里 `cloudEnv` 为空，或 `wx.cloud.init` 未成功时：

- 症状 / 食疗：读 `utils/seed.js`  
- 收藏 / 浏览日志：写 `wx.setStorage`（键名 `favorites`、`view_logs`）  
- 打卡（养生日记）：写 `wx.setStorage`（键名 `tcm_diary_entries`），仅本机，不走云  
- 自建笔记：`tcm_user_notes`；我的头像昵称：`tcm_user_profile`  
- 首页会显示黄色标签「本地演示模式」

### 微信开发者工具本地验收（本版四点）

保持 `const cloudEnv = ''`，不要开通云开发，不要改成真实 AppID。导入后直接编译。

1. **四个 Tab**  
   冷启动落在「首页」。底栏从左到右是首页、笔记、打卡、我的。笔记是原来的中医小笔记（内置条目点进详情、写笔记）。打卡是原来的养生日记（写一条、点进编辑、本周小结计数），导航标题和页内主标题都是「打卡」。首页不再提供「进笔记 / 进日记」大入口。

2. **首页轮播**  
   首页可以左右滑动多张 banner。配置在 `utils/banners.js`：`image`、可选 `title`、预留 `link`（空则点击不跳转）。其中一张 `image` 为空，应看到绿色占位和标题，而不是白屏。图加载失败时同样落到这块占位。

3. **带药材行的新笔记，保存后再打开仍在**  
   底栏「笔记」→「写笔记」。填标题，在药材行写下名称和克数（例如黄芪、20克），需要的话点「+ 添加一味药」。三个预留槽（配伍说明 / 注意事项 / 来源备注，文案在 `utils/userNotes.js` 的 `NOTE_TEMPLATE_SLOTS`）和正文可以先空着。保存后回到列表，再点开这条，药材行还在。升级前已经存过的笔记仍在列表里，打开后原标题和正文还在。调试器 Storage 键：`tcm_user_notes`。

4. **我的：改昵称，杀进程重进仍在**  
   底栏「我的」。未登录只看到「微信登录」，其它 Tab 不拦截。点登录（游客模式经常没有 `wx.login` 的 code，仍然可以进入已登录态）。看到头像和昵称后点「编辑」，改昵称，点「保存」，页面立刻显示新昵称。开发者工具里「清缓存」不要选清数据；用重新编译，或模拟器里关掉再打开，回到「我的」，昵称还在。Storage 键：`tcm_user_profile`。头像用 `chooseAvatar`，能写入本地文件则一并留下。  
   **还没接的后端点：** `utils/profile.js` 的 `loginWithWechat` 会调用 `wx.login`，但 **不上传 code、不换 openId**。以后把 `res.code` 交给自有后端即可。登录后的头像应是正圆，微信头像完整落在圆框里，而不是只露出一条。

收藏从「我的」里的「我的收藏」进入（本迭代从首页挪过来，方便还能打开）。

**打卡验证：** 底栏「打卡」→ 写一条 → 返回列表 → 点卡片进编辑 → 本周小结仍是横向小卡片。字段仍是睡 / 便 / 口味 / 情绪 / 怕冷怕热 / 痘等，没有增减。

**笔记列表验证：** 内置笔记进现有详情页；自建笔记进上面的模板表单。

**删除与头像：** 笔记列表和打卡列表都在卡片右上角放 ×。点 × 会弹出「确认删除？」，确认后才删除（内置笔记仍只是本机隐藏）；取消则记录还在。不再使用左滑删除。

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

本项目提供的食疗内容为**传统文化与饮食角度的理论讨论与技术演示**，**不构成医疗建议**，**不能替代执业中医师 / 医师的面诊、辨证与处方**。若有不适，请及时前往正规医疗机构就诊。
