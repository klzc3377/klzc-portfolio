# KLzc Portfolio

Cheng Zhang（KLzc）的个人作品集网站。项目以深色、机械与电影感为统一视觉语言，串联个人介绍、VEX 机器人经历、竞赛荣誉、项目案例与互动成长地图，并针对桌面和手机体验分别做了布局与性能适配。

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

生产文件会生成在 `dist/`。站点使用 History API 路由，部署平台需要把未知路径回退到 `index.html`；仓库中的 `vercel.json` 已包含对应配置。

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
