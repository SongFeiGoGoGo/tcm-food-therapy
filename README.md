# 中医食疗按症状点选工具（微信小程序）

按常见不适症状点选，查看对应的中医食疗参考方案（食材克数、配伍说明、注意事项）。  
支持**微信云开发**落库；未开通云环境时自动进入**本地演示模式**（JSON 种子 + `wx.storage`），用微信开发者工具即可预览。

> **免责声明：理性讨论，不替代面诊。** 体质因人而异，内容仅供学习交流，不能代替执业医师诊断与治疗。

## 功能概览

底栏四个 Tab（左→右）：**首页 | 笔记 | 打卡 | 我的**。冷启动打开首页。

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `pages/index` | 三张本地轮播；轮播下为干支三柱；其下两张功能卡（四季养生、养生食疗），图内已有标题，点击暂不跳转 |
| 笔记 | `pages/notes` | 原「中医小笔记」：内置列表、详情、自建笔记；卡片右上角删除并确认 |
| 写笔记 | `pages/notes/edit` | 标题、药材名+克数（可增减）、槽位 A/B/C、自由正文 |
| 打卡 | `pages/diary/list` | 五项习惯 + 16 周热力图。旧养生日记只归档，不展示、不删除 |
| 我的 | `pages/mine` | 本地登录闭环：头像、昵称（可改，写入 storage） |
| 食疗详情 | `pages/detail` | 内置笔记详情。食材+克数、配伍、做法、注意 |

症状与方案见 `utils/seed.js`（含学习笔记条目）。

（首批三条食疗文案已改写。界面与种子里的免责声明统一为「理性讨论，不替代面诊」。正文可继续在 `utils/seed.js` 与 `cloud/database/*.json` 中调整。）

## 目录结构

```
tcm-food-therapy-miniprogram/
├── app.js / app.json / app.wxss
├── package.json                 # 依赖 lunar-javascript
├── project.config.json          # appid 现为 touristappid；已配置构建 npm
├── miniprogram_npm/lunar-javascript/
├── sitemap.json
├── pages/
│   ├── index/                   # Tab 首页（轮播 + 干支节气）
│   ├── notes/                   # Tab 笔记
│   ├── diary/list               # Tab 打卡（习惯热力图）
│   ├── diary/edit               # 旧写日记页，主路径已不用
│   ├── mine/                    # Tab 我的（头像昵称）
│   └── detail/                  # 食疗详情
├── images/tab · banners         # tab 占位图标、轮播图
├── utils/
│   ├── seed.js                  # 本地种子数据
│   ├── api.js                   # 云 / 本地统一数据层
│   ├── banners.js               # 首页轮播配置
│   ├── calendar.js              # 干支 / 节气（上海时区，23:00 换日）
│   ├── habits.js                # 习惯打卡 storage
│   ├── userNotes.js             # 自建笔记 storage（含药材行、槽位）
│   ├── profile.js               # 我的：头像昵称；wx.login 的后端接入点
│   └── diary.js                 # 旧养生日记归档，不删除
├── cloudfunctions/
│   ├── getSymptoms
│   ├── getRecipeById
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

### 农历库（首页干支 / 节气）

干支和节气用 [`lunar-javascript@1.7.6`](https://github.com/6tail/lunar-javascript)，只在本机计算，不请求网络。

`utils/calendar.js` 里写死的规则：

- 时区 `Asia/Shanghai`（按 UTC+8，不用手机时区）。
- **23:00 子时换日**：上海钟点从 23:00 起，干支日和打卡日期键都算下一天。公历小字仍是当天日历。
- 节气用库给出的交节时刻，再套同一套 23:00 规则。临近提示阈值 7 天。

仓库已提交 `miniprogram_npm/lunar-javascript`，导入后可以直接编译。若改过依赖，在项目根目录执行 `npm install`，再在微信开发者工具菜单选 **工具 → 构建 npm**（`project.config.json` 的 `packNpmRelationList` 已指向根目录 `package.json`，产物在 `./miniprogram_npm`）。

### 换成自己的 AppID

1. 在[微信公众平台](https://mp.weixin.qq.com/)注册小程序，拿到 AppID。  
2. 修改 `project.config.json` 中的 `"appid"` 字段。  
3. 本地私有覆盖可写在 `project.private.config.json`（已加入 `.gitignore`，勿提交真实密钥类配置）。

## 本地模式说明（推荐先这样验证）

当 `app.js` 里 `cloudEnv` 为空，或 `wx.cloud.init` 未成功时：

- 症状 / 食疗：读 `utils/seed.js`  
- 浏览日志：写 `wx.setStorage`（键名 `view_logs`）  
- 习惯打卡：写 `wx.setStorage`（键名 `tcm_habit_checkins`），仅本机，不走云  
- 旧养生日记：键 `tcm_diary_entries` 仍留在本机，打卡页不展示、不删除  
- 自建笔记：`tcm_user_notes`；我的头像昵称：`tcm_user_profile`  
- 首页会显示黄色标签「本地演示模式」

### 微信开发者工具本地验收（本版四点）

保持 `const cloudEnv = ''`，不要开通云开发，不要改成真实 AppID。导入后直接编译。

1. **四个 Tab**  
   冷启动落在「首页」。底栏从左到右是首页、笔记、打卡、我的。笔记是原来的中医小笔记（内置条目点进详情、写笔记）。打卡页标题是「打卡」，里面是习惯热力图，不再是周记流。首页不再提供「进笔记 / 进日记」大入口，也不放免责声明。

2. **首页轮播**  
   首页可以左右滑动三张 banner，都是本地图。配置在 `utils/banners.js`：`image`、短标题、预留 `link`（空则点击不跳转）。标题为「一盏茶」「笔记与打卡」「草木清气」。出处见 `images/banners/ATTRIBUTION.md`。图加载失败时仍用色块和标题，不白屏。

   干支区下面有两张功能卡，图在 `images/cards/siji.jpg`（四季养生，568×545）和 `images/cards/shiliao.jpg`（养生食疗，580×545），配置在 `utils/cards.js`。按钮区已裁掉，标题已经在图里，页面不再叠字，也不叠「查看方案 / 查看食谱」。`link` 为空，点击不跳转。

3. **带药材行的新笔记，保存后再打开仍在**  
   底栏「笔记」→「写笔记」。填标题，在药材行写下名称和克数（例如黄芪、20克），需要的话点「+ 添加一味药」。三个预留槽（配伍说明 / 注意事项 / 来源备注，文案在 `utils/userNotes.js` 的 `NOTE_TEMPLATE_SLOTS`）和正文可以先空着。保存后回到列表，再点开这条，药材行还在。升级前已经存过的笔记仍在列表里，打开后原标题和正文还在。调试器 Storage 键：`tcm_user_notes`。

4. **我的：改昵称，杀进程重进仍在**  
   底栏「我的」。未登录只看到「微信登录」，其它 Tab 不拦截。点登录（游客模式经常没有 `wx.login` 的 code，仍然可以进入已登录态）。看到头像和昵称后点「编辑」，改昵称，点「保存」，页面立刻显示新昵称。开发者工具里「清缓存」不要选清数据；用重新编译，或模拟器里关掉再打开，回到「我的」，昵称还在。Storage 键：`tcm_user_profile`。头像用 `chooseAvatar`，能写入本地文件则一并留下。  
   **还没接的后端点：** `utils/profile.js` 的 `loginWithWechat` 会调用 `wx.login`，但 **不上传 code、不换 openId**。以后把 `res.code` 交给自有后端即可。登录后的头像应是正圆，微信头像完整落在圆框里，而不是只露出一条。

**干支 / 节气：** 轮播正下方有干支三柱（如「丙午年 · 戊戌月 · 辛巳日」）和一行小字公历。不是节气日时，显示下一节气和还有几天；距离 ≤7 天还会多一句「还有 N 天到××」。把开发者工具的系统日期改到 2026-11-07，应看到「今日立冬」。23:00 之后干支日会进到下一天，公历小字仍是当天。

**热力图：** 底栏「打卡」没有周记列表，也没有本周小结。近 16 周方格可以横滑。点今天（默认）或过去某一天，勾选早睡、柔腹、梳头、拍八虚、七点前完成排大便。完成 0 项最浅，5 项最深，勾上后格子马上变色。不要清数据，重新编译或关掉再打开，勾选还在。Storage 键：`tcm_habit_checkins`。

**旧日记提示：** 若调试器里已经有 `tcm_diary_entries`，第一次打开打卡页会提示一次：「以前的养生日记已保存在本机，新版改为习惯打卡；旧记录暂不展示，不会删除。」没有旧数据则不提示。这条键不会被清掉。

**笔记列表验证：** 内置笔记进现有详情页；自建笔记进上面的模板表单。

**删除与头像：** 笔记列表卡片右上角是「删除」文字按钮。点下去弹出「确认删除？」，确认后才删除（内置笔记仍只是本机隐藏）；取消则记录还在。登录后的头像应是正圆。

内置学习笔记只保留「小儿脾胃不和」，详情仍可打开。其余内置笔记已从 `utils/seed.js` 和 `cloud/database` 删掉。导航、按钮和底栏选中色是茶褐 `#6B4F2A`。

## 开通云开发（可选）

1. 开发者工具顶部「云开发」→ 开通，创建环境，复制**环境 ID**。  
2. 在 `app.js` 中设置：

```js
const cloudEnv = '你的环境ID'; // 非空且 init 成功后走云函数
```

3. 在云开发控制台创建集合（权限建议先「仅管理端可写，所有用户可读」，或按业务收紧 `view_logs`）：

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
`view_logs` 初始为空即可。

### 部署云函数

对 `cloudfunctions` 下每个目录（`getSymptoms`、`getRecipeById`、`logView`）：

1. 右键 →「上传并部署：云端安装依赖」（需已关联云环境）。  
2. 部署完成后重新编译小程序；首页应变为「云开发已连接」。  
3. 云调用失败时前端仍会回退本地数据，避免白屏。

## 云函数清单

| 名称 | 作用 |
|------|------|
| `getSymptoms` | 返回症状列表（按 `sort`） |
| `getRecipeById` | 按食疗 ID 或症状 ID 取详情 |
| `logView` | 写入浏览日志 |

## 开源协议

[MIT License](./LICENSE)

## 再次强调的免责声明

本项目提供的食疗内容为**传统文化与饮食角度的理性讨论与技术演示**，**不构成医疗建议**，**不能替代执业中医师 / 医师的面诊、辨证与处方**。若有不适，请及时前往正规医疗机构就诊。
