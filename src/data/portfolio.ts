import { BrainCircuit, Code2, Cpu } from 'lucide-react'
import type {
  Award,
  Direction,
  NavItem,
  Project,
  RoboticsTimelineItem,
  StoryChapter,
} from '../types/portfolio'

export const navItems: NavItem[] = [
  { path: '/', label: 'Home', zh: '首页' },
  { path: '/atlas', label: 'Atlas', zh: '坐标档案' },
  { path: '/robotics', label: 'Robotics', zh: '机器人经历' },
  { path: '/awards', label: 'Awards', zh: '比赛记录' },
  { path: '/projects', label: 'Projects', zh: '项目' },
  { path: '/profile', label: 'Profile', zh: '关于我' },
]

export const storyChapters: StoryChapter[] = [
  { number: '01', href: '/atlas', label: 'Places', zh: '地点' },
  { number: '02', href: '/robotics', label: 'Build', zh: '机器人' },
  { number: '03', href: '/awards', label: 'Compete', zh: '比赛' },
  { number: '04', href: '/projects', label: 'Make', zh: '项目' },
  { number: '05', href: '/profile', label: 'Now', zh: '现在' },
]

export const directions: Direction[] = [
  {
    title: 'Algorithms',
    zh: '算法与问题求解',
    icon: BrainCircuit,
    copy: '把复杂问题拆开、验证假设，再用更清楚的结构把解法做出来。',
    en: 'I break complex problems down, test assumptions and turn the result into a clearer solution.',
  },
  {
    title: 'Software Engineering',
    zh: '软件工程',
    icon: Code2,
    copy: '关注能长期维护的前端结构、真实交互，以及桌面与手机都可靠的体验。',
    en: 'I care about maintainable frontend structure, real interactions and reliable desktop-to-mobile experiences.',
  },
  {
    title: 'AI Tools',
    zh: 'AI 工具',
    icon: Cpu,
    copy: '把 AI 放进日常开发流程，观察它真正能节省时间、增强创作的地方。',
    en: 'I use AI inside everyday development and focus on where it genuinely saves time or expands what I can make.',
  },
]

export const awards: Award[] = [
  {
    title: '2023 National VEX Robotics Elite Competition — First Prize',
    zh: '科创青禾 2023 全国 VEX 机器人精英赛 高中组一等奖',
    year: '2023',
    image: '/assets/award-1.webp',
  },
  {
    title: '2022–2023 China–Canada VEX International Competition (Southwest) — Teamwork Champion',
    zh: '2022–2023 中国—加拿大 VEX 机器人国际赛（西南区）团队协作冠军',
    year: '2023',
    image: '/assets/award-2.webp',
  },
  {
    title: '2022–2023 China–Canada VEX International Competition (Southwest) — First Prize',
    zh: '2022–2023 中国—加拿大 VEX 机器人国际赛（西南区）一等奖',
    year: '2023',
    image: '/assets/award-3.webp',
  },
  {
    title: '3rd China–Canada International Robotics Exchange Competition — Second Prize',
    zh: '第三届中国—加拿大机器人国际精英交流赛二等奖',
    year: '2023',
    image: '/assets/award-4.webp',
  },
  {
    title: '2020 VEX IQ China National Final — First Prize',
    zh: '2020 VEX 世锦赛中国总决赛 VEX IQ 初中组一等奖',
    year: '2020',
    image: '/assets/award-5.webp',
  },
  {
    title: '2022 Sichuan Youth Arts Showcase, Science and Technology Innovation — First Prize',
    zh: '2022 四川省青少年文化艺术展演科技创新类统一初评一等奖',
    year: '2022/23',
    image: '/assets/award-6.webp',
  },
  {
    title: '13th VEX Asia-Pacific Robotics Championship — VEX IQ Bronze Award',
    zh: '2019 第十三届 VEX 亚太机器人锦标赛 VEX IQ 初中组铜奖',
    year: '2019',
    image: '/assets/award-7.webp',
  },
  {
    title: '17th VEX Asia Robotics Championship Signature Event — V5RC Second Prize',
    zh: '2024 第十七届 VEX 亚洲机器人锦标赛签名赛 V5RC 高中组二等奖',
    year: '2024/25',
    image: '/assets/award-8.webp',
  },
]

export const roboticsTimeline: RoboticsTimelineItem[] = [
  {
    year: 'Early',
    title: '入门 / VEX IQ',
    zh: '我从场地任务和结构搭建学起，慢慢熟悉机械、规则与团队协作。',
    en: 'I started with field tasks and simple builds, learning mechanics, rules and teamwork as I went.',
  },
  {
    year: '74000M',
    title: '队伍 / Team',
    zh: '在 74000M，我参与搭建、调试和比赛，也承担过队员与队长的职责。',
    en: 'With 74000M, I worked on builds, testing and competitions as both a member and captain.',
  },
  {
    year: 'Match',
    title: '赛场 / Competition',
    zh: '比赛让我学会在时间、可靠性和团队沟通之间快速做取舍。',
    en: 'Competition taught me to make fast trade-offs between time, reliability and team communication.',
  },
  {
    year: 'Now',
    title: '延伸 / Computer Science',
    zh: '现在写软件时，我仍然沿用边做、边测、复盘再迭代的工作方式。',
    en: 'I now use the same build, test, review and iterate rhythm when I make software.',
  },
]

export const projects: Project[] = [
  {
    slug: 'klzc-portfolio',
    title: 'KLzc Personal Website',
    zh: '电影感个人作品集',
    year: '2026',
    kind: 'WEB / INTERACTION',
    image: '/assets/cinematic-tunnel-environment.webp',
    imageAlt: 'KLzc portfolio mechanical memory environment',
    summaryZh: '把七年的 VEX 经历、比赛证书与现在的计算机科学学习，做成兼顾沉浸叙事和快速阅读的双语互动作品集。',
    summaryEn: 'A bilingual interactive portfolio that turns seven years of VEX, competition records and current Computer Science work into one coherent experience.',
    whyZh: '照片、证书、模型和城市记录原本分散在不同文件夹里。我希望它们不只是被陈列，而是能组成一条从成都到奥克兰的完整成长路径。',
    whyEn: 'Photos, certificates, models and city records were scattered across folders. I wanted them to become a complete journey from Chengdu to Auckland rather than a static collection.',
    roleZh: '独立完成信息架构、视觉设计、前端开发、3D 资产整理、响应式适配与发布级验证。',
    roleEn: 'Independent information architecture, visual design, frontend development, 3D asset preparation, responsive adaptation and release validation.',
    stack: ['React 19', 'TypeScript', 'Three.js', 'Framer Motion', 'Blender', 'GLB'],
    metrics: [
      { value: '06', label: '叙事章节', labelEn: 'story chapters' },
      { value: '08', label: '比赛证书', labelEn: 'certificates' },
      { value: '2', label: '响应式形态', labelEn: 'responsive modes' },
    ],
    steps: [
      {
        title: '档案与结构 / Archive & structure',
        titleEn: 'Archive and structure',
        zh: '先核对比赛年份、地点、奖项和照片，再把内容拆成坐标、机器人、比赛、项目与现在五个章节。',
        en: 'I verified years, places, awards and photos before shaping the story into places, robotics, competitions, projects and now.',
      },
      {
        title: '三维流程 / 3D pipeline',
        titleEn: '3D pipeline',
        zh: '把 SolidWorks 装配模型整理为网页可加载的 GLB，并在 Blender 与 Three.js 中完成环境、材质、灯光和滚动镜头。',
        en: 'I prepared the SolidWorks assembly as a web-ready GLB, then built the environment, materials, lighting and scroll camera with Blender and Three.js.',
      },
      {
        title: '自适应渲染 / Adaptive rendering',
        titleEn: 'Interaction and resilience',
        zh: '手机端按设备能力动态调整渲染分辨率与粒子密度，同时保留电影调色、环境反射、实时阴影和可读的内容后备。',
        en: 'Mobile adapts render resolution and particle density to the device while preserving cinematic grading, reflections, real-time shadows and readable fallbacks.',
      },
      {
        title: '发布验证 / Release QA',
        titleEn: 'Release validation',
        zh: '逐页检查路由、证书弹窗、触控导航、断点布局和构建产物，让视觉表达不会牺牲基本可用性。',
        en: 'I checked routing, certificate dialogs, touch navigation, breakpoints and production output so the visual direction would not compromise usability.',
      },
    ],
    interestingZh: '最关键的取舍是让真实机器人始终是主角：视觉可以有电影感，但信息卡、导航与移动端仍要保持可读。',
    interestingEn: 'The key trade-off was keeping the real robot as the subject: the experience can feel cinematic while cards, navigation and mobile reading remain usable.',
    statusZh: '当前版本已经形成可发布的完整作品集，并保留后续增加独立软件项目和新经历的扩展空间。',
    statusEn: 'The current version is a release-ready portfolio with room to add independent software work and future experiences.',
    gallery: [
      { src: '/assets/robot-74000m.webp', alt: 'Team 74000M robot used in the interactive homepage' },
      { src: '/assets/about-vector-klzc-clean.webp', alt: 'Illustrated profile artwork for Cheng Zhang' },
      { src: '/assets/award-1.webp', alt: '2023 National VEX Robotics Elite Competition certificate' },
    ],
    links: [
      { href: '/', label: '打开沉浸首页', labelEn: 'Open the experience' },
      { href: '/profile', label: '了解设计者', labelEn: 'About the builder' },
    ],
  },
  {
    slug: 'vex-robot-build',
    title: 'VEX Robotics Archive',
    zh: '74000M 机器人档案',
    year: '2019—2025',
    kind: 'ROBOTICS / ARCHIVE',
    image: '/assets/robot-build.webp',
    imageAlt: 'VEX robot build from team 74000M',
    summaryZh: '把机器人装配模型、比赛照片、证书和参赛记录重新对齐到同一条时间线，留下可以验证的工程成长记录。',
    summaryEn: 'A structured archive aligning the robot assembly, competition photos, certificates and event records on one verifiable timeline.',
    whyZh: '多年比赛材料原本彼此分离。把它们放回正确的年份、城市与机器版本后，才能看出团队如何迭代，以及我如何从机械搭建走向软件。',
    whyEn: 'Years of competition material were separated. Returning each item to the right year, city and robot version reveals how the team iterated and how I moved from mechanics toward software.',
    roleZh: '担任档案整理者、内容核对者与网站实现者；所有素材来自自己的比赛与团队经历。',
    roleEn: 'Archive curator, record verifier and site builder using material from my own competitions and team experience.',
    stack: ['Structured content', 'Image pipeline', 'Three.js', 'GLB', 'Responsive UI'],
    metrics: [
      { value: '≈7', label: 'VEX 经历年数', labelEn: 'years in VEX' },
      { value: '08', label: '已整理证书', labelEn: 'certificates archived' },
      { value: '74000M', label: '队伍编号', labelEn: 'team identity' },
    ],
    steps: [
      {
        title: '核对 / Verify',
        titleEn: 'Verify',
        zh: '逐张核对证书上的赛事、组别、队号、年份和奖项，避免只凭记忆整理。',
        en: 'I checked each certificate for event, division, team number, year and award instead of relying on memory alone.',
      },
      {
        title: '重新关联 / Reconnect',
        titleEn: 'Reconnect',
        zh: '把上海、青岛、重庆、海南与首尔的材料放回地图和时间线，让照片与奖项彼此对应。',
        en: 'I returned material from Shanghai, Qingdao, Chongqing, Hainan and Seoul to the map and timeline so photos and awards reinforce one another.',
      },
      {
        title: '模型 / Model',
        titleEn: 'Model',
        zh: '把 74000M 的真实装配模型接入网页，让机器结构和比赛结果出现在同一个叙事空间。',
        en: 'I brought the real 74000M assembly into the web experience so the machine and its competition results share one narrative space.',
      },
    ],
    interestingZh: '它不只是获奖列表：模型、现场照片和证书互相提供上下文，让每次比赛都能回到具体的设计与团队过程。',
    interestingEn: 'It is more than an awards list: the model, field photos and certificates give one another context and reconnect every event to a real build and team process.',
    statusZh: '主要比赛节点、证书和已有照片已经完成整理，未来可以继续按年份追加新材料。',
    statusEn: 'The major events, certificates and available photos are organised, with a structure that can grow year by year.',
    gallery: [
      { src: '/assets/robot-74000m.webp', alt: 'Team 74000M VEX robot' },
      { src: '/assets/robotics-klzc.webp', alt: 'Cheng Zhang working with a VEX robotics team' },
      { src: '/assets/vex-asia-pacific.webp', alt: 'VEX Asia-Pacific competition memory' },
    ],
    links: [
      { href: '/robotics', label: '查看机器人经历', labelEn: 'View robotics story' },
      { href: '/awards', label: '查看比赛证书', labelEn: 'View certificates' },
    ],
  },
  {
    slug: 'growth-atlas',
    title: 'Interactive Growth Atlas',
    zh: '成长坐标档案',
    year: '2019—NOW',
    kind: 'MAP / DATA STORY',
    image: '/assets/atlas-shanghai.webp',
    imageAlt: 'Interactive map showing Shanghai in the growth atlas',
    summaryZh: '把七个与学习和机器人经历有关的地点，做成可以从世界视角进入城市细节的矢量地图叙事。',
    summaryEn: 'A vector-map story connecting seven locations from robotics and study, moving from a world view into city-level detail.',
    whyZh: '时间线能回答什么时候发生，地图则能回答这些经历如何跨越城市和国家。两种视角组合后，成长路径更容易被理解。',
    whyEn: 'A timeline explains when things happened; a map explains how the experience moved across cities and countries. Together they make the journey easier to understand.',
    roleZh: '独立完成地点资料整理、坐标建模、交互设计、MapLibre 实现与桌面/触控适配。',
    roleEn: 'Independent location research, coordinate modelling, interaction design, MapLibre implementation and desktop/touch adaptation.',
    stack: ['MapLibre GL', 'React', 'TypeScript', 'GeoJSON', 'Responsive UI'],
    metrics: [
      { value: '07', label: '地点节点', labelEn: 'location nodes' },
      { value: '2', label: '地图层级', labelEn: 'map scales' },
      { value: 'Touch', label: '触控适配', labelEn: 'touch ready' },
    ],
    steps: [
      {
        title: '数据模型 / Data model',
        titleEn: 'Data model',
        zh: '为每个地点整理经纬度、中英文说明、时间、类别、图片和镜头参数。',
        en: 'I modelled coordinates, bilingual copy, time, category, imagery and camera settings for every location.',
      },
      {
        title: '地图交互 / Map interaction',
        titleEn: 'Map interaction',
        zh: '使用矢量底图、地点图层和分阶段镜头，把世界概览、飞行过渡与城市探索连接起来。',
        en: 'I combined a vector basemap, location layers and staged camera movement across world overview, flight transition and city exploration.',
      },
      {
        title: '响应式控制 / Responsive controls',
        titleEn: 'Responsive controls',
        zh: '分别调整桌面鼠标与手机触控的按钮、信息面板和镜头节奏，避免地图只在大屏幕上可用。',
        en: 'I adapted controls, information panels and camera pacing for mouse and touch so the atlas would not depend on a large screen.',
      },
    ],
    interestingZh: '地图不是装饰背景，而是内容导航：每个坐标都能回到一段真实经历、图片或比赛记录。',
    interestingEn: 'The map is not decorative background; it is content navigation, with every coordinate leading back to a real memory, image or event record.',
    statusZh: '七个核心地点已经上线，并支持继续添加新的城市节点和材料。',
    statusEn: 'Seven core locations are live, with a structure ready for future cities and material.',
    gallery: [
      { src: '/assets/atlas-shanghai.webp', alt: 'Shanghai location image in the interactive atlas' },
      { src: '/assets/atlas-qingdao.webp', alt: 'Qingdao location image in the interactive atlas' },
      { src: '/assets/uoa-campus.webp', alt: 'University of Auckland campus in the interactive atlas' },
    ],
    links: [
      { href: '/atlas', label: '打开坐标档案', labelEn: 'Open the atlas' },
      { href: '/projects', label: '返回项目列表', labelEn: 'Back to selected work' },
    ],
  },
]
