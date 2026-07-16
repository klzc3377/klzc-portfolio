# KLzc Portfolio

Cheng Zhang（KLzc）的个人作品集网站。项目以深色、机械与电影感为统一视觉语言，串联个人介绍、VEX 机器人经历、竞赛荣誉、项目案例与互动成长地图，并针对桌面和手机体验分别做了布局与性能适配。

线上版本：<https://klzc-portfolio.vercel.app>

代码仓库：<https://github.com/klzc3377/klzc-portfolio>

## OpenAI Build Week 2026

这个项目最初是一个已有的个人档案站；在黑客松提交期开始后，我用 Codex 与 GPT-5.6 对它进行了实质性扩展。7 月 14–15 日的提交期内工作可以从 Git 历史中的 `36df5a4` 及后续提交核对，主要包括：

- 重新组织首页的 Three.js / GLB 机械叙事，并为桌面高刷新率和移动设备分别调整渲染策略。
- 建立统一的深色机械视觉系统，重做字体、色彩、留白、页面层级、动效与自定义指针。
- 完善响应式导航、触控操作、深链接路由、SEO、站点地图与 Vercel 生产部署。
- 对首页、坐标档案、机器人、证书、项目和个人页进行桌面与移动端的真实浏览器视觉 QA。
- 重写中英文内容，使其保持事实准确、语气自然，并由统一的结构化数据驱动。

### 我如何与 Codex 协作

我负责产品方向和最终判断：选择“个人经历作为机械记忆档案”的主题，提供自己的照片、证书、机器人模型与事实资料，确定视觉取舍，并逐轮反馈光标、性能和文案是否符合预期。Codex 与 GPT-5.6 负责检查现有代码、提出实现方案、修改 React / TypeScript / CSS / Three.js 代码、运行 lint 与生产构建、在浏览器中截屏和交互验收，并根据反馈继续迭代。

Codex 加速最明显的部分是跨页面的一致性改造、WebGL 性能调试、响应式 QA 和重复验证。关键内容选择、事实核对、个人资料使用范围以及最终视觉方向由我决定。项目核心搭建与公网部署所用的 Codex Session ID 为 `019e1667-bd6d-7a71-9dc7-8b066c9259a2`。

### 黑客松评审入口

- 在线体验：<https://klzc-portfolio.vercel.app>
- 项目详情：<https://klzc-portfolio.vercel.app/projects/klzc-portfolio>
- 无需账号或测试数据；使用现代桌面或移动浏览器即可。
- 首页为实时 WebGL 场景。在低性能设备或启用减少动态效果时，网站会自动采用更轻的呈现方式。

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

发布前检查：

```bash
npm run lint
npm run build
npm run preview
```

前端生产文件会生成在 `dist/client/`。站点使用 History API 路由，部署平台需要把未知路径回退到 `index.html`；仓库中的 `vercel.json` 已包含对应配置，Sites 构建会同时生成 `dist/server/index.js` 作为静态资源与 SPA 回退入口。

## 代码结构

```text
src/
├─ app/                 路由识别与页面标题
├─ components/
│  ├─ layout/           全站导航、章节轨道、背景与页脚
│  └─ ui/               链接、标题、弹窗与动效等通用组件
├─ data/                个人经历、荣誉与项目案例的集中内容数据
├─ pages/               Profile、Robotics、Awards、Projects 等页面
├─ styles/              发布级响应式、无障碍与组件补充样式
├─ types/               路由和作品集内容的 TypeScript 类型
├─ AtlasPage.*           互动成长地图
├─ MechanicalMemoryExperience.*  首页 3D 机械叙事
└─ App.tsx              页面编排、路由状态与全站元信息

worker/
└─ index.js              Sites / Cloudflare Workers 静态资源与 SPA 回退入口

public/
├─ assets/              已压缩的图片、HDR 与案例图
├─ models/              当前使用的 GLB 三维模型
├─ robots.txt
└─ site.webmanifest
```

## 内容维护

- 大部分文字、项目、奖项和时间线统一在 `src/data/portfolio.ts` 修改。
- 内容结构及字段约束在 `src/types/portfolio.ts`。
- 新增案例时，补充项目数据与图片即可；详情页由通用模板自动生成。
- 全站基础 SEO 在 `index.html`，页面级标题、描述和 canonical 地址由 `src/App.tsx` 根据当前路由更新。
- 图片应优先使用 WebP；三维模型放入 `public/models/`，不要直接导入到页面组件。

## 发布检查清单

- `npm run lint` 无错误或警告。
- `npm run build` 成功。
- 检查 `/profile`、`/projects` 与每个 `/projects/:slug` 深链接。
- 用桌面与 390px 左右手机视口验证导航、弹窗、3D 首页和地图页。
- 确认邮箱、外部链接、分享图、站点域名与 canonical 地址。
- 部署后再次检查刷新子页面是否仍能正确打开。

## License

源代码采用 [MIT License](./LICENSE)。个人照片、证书、文字档案、机器人模型及 `public/assets`、`public/models` 中的媒体不包含在 MIT 授权范围内，除非对应文件另有说明。
