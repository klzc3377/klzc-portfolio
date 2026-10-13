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
  { number: '01', href: '/atlas', label: 'Places', zh: '地点', title: '坐标档案', en: 'Coordinate Atlas', image: '/assets/atlas-shanghai.webp' },
  { number: '02', href: '/robotics', label: 'Build', zh: '机器人', title: 'VEX 机器人', en: 'VEX Robotics', image: '/assets/robot-build.webp' },
  { number: '03', href: '/awards', label: 'Compete', zh: '比赛', title: '比赛与荣誉', en: 'Competition Archive', image: '/assets/teamwork-trophy.webp' },
  { number: '04', href: '/projects', label: 'Make', zh: '项目', title: '项目与实践', en: 'Selected Work', image: '/assets/klzc-abstract-bg.webp' },
  { number: '05', href: '/profile', label: 'Now', zh: '现在', title: '关于我', en: 'Profile', image: '/assets/uoa-campus.webp' },
]

export function chapterFor(path: string) {
  return storyChapters.find((chapter) => (chapter.href === '/projects' ? path.startsWith('/projects') : chapter.href === path))
}

export const directions: Direction[] = [
  {
    title: 'Algorithms',
    zh: '算法与问题求解',
    icon: BrainCircuit,
    copy: '课程里正在继续学。',
    en: 'Currently studying this in class.',
  },
  {
    title: 'Software Engineering',
    zh: '软件工程',
    icon: Code2,
    copy: '做一些自己的项目。',
    en: 'Building a few personal projects.',
  },
  {
    title: 'AI Tools',
    zh: 'AI 工具',
    icon: Cpu,
    copy: '用在日常学习和开发里。',
    en: 'Using them in everyday study and development.',
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
    zh: '从 VEX IQ 开始。2019 年第一次去国外参赛。',
    en: 'Started with VEX IQ. First overseas competition in 2019.',
  },
  {
    year: '74000M',
    title: '队伍 / Team',
    zh: '后来进入 74000M，担任过队员和队长。',
    en: 'Later joined 74000M as a member and captain.',
  },
  {
    year: 'Match',
    title: '赛场 / Competition',
    zh: '2023 年：上海一等奖，重庆团队协作冠军。',
    en: '2023: first prize in Shanghai and teamwork champion in Chongqing.',
  },
  {
    year: 'Now',
    title: '延伸 / Computer Science',
    zh: '相关证书、照片和模型整理在这个网站里。',
    en: 'Certificates, photos and models are kept on this site.',
  },
]

export const projects: Project[] = [
  {
    slug: 'klzc-portfolio',
    title: 'KLzc Personal Website',
    zh: '个人网站',
    year: '2026',
    kind: 'WEB / INTERACTION',
    image: '/assets/cinematic-tunnel-environment.webp',
    imageAlt: 'KLzc portfolio mechanical memory environment',
    summaryZh: '用来整理过去的经历、照片和项目。',
    summaryEn: 'A place for past experiences, photos and projects.',
    whyZh: '资料散落在不同文件夹里，所以集中放到这里。',
    whyEn: 'The material was spread across different folders, so I put it together here.',
    roleZh: '自己整理、设计和开发。',
    roleEn: 'Organised, designed and built independently.',
    stack: ['React 19', 'TypeScript', 'Three.js', 'Framer Motion', 'Blender', 'GLB'],
    metrics: [
      { value: '06', label: '页面', labelEn: 'sections' },
      { value: '08', label: '比赛证书', labelEn: 'certificates' },
      { value: '2', label: '响应式形态', labelEn: 'responsive modes' },
    ],
    steps: [
      {
        title: '档案与结构 / Archive & structure',
        titleEn: 'Archive and structure',
        zh: '核对比赛年份、地点、证书和照片，再按页面整理。',
        en: 'Checked years, places, certificates and photos, then organised them by page.',
      },
      {
        title: '三维流程 / 3D pipeline',
        titleEn: '3D pipeline',
        zh: '将装配模型转成 GLB，并完成网页中的 3D 场景。',
        en: 'Converted the assembly to GLB and built the 3D web scene.',
      },
      {
        title: '自适应渲染 / Adaptive rendering',
        titleEn: 'Interaction and resilience',
        zh: '分别适配电脑和手机。',
        en: 'Adapted the site for desktop and mobile.',
      },
      {
        title: '发布验证 / Release QA',
        titleEn: 'Release validation',
        zh: '检查页面、路由、弹窗和触控操作。',
        en: 'Checked pages, routes, dialogs and touch controls.',
      },
    ],
    interestingZh: '首页使用 74000M 的真实装配模型。',
    interestingEn: 'The homepage uses the real 74000M assembly model.',
    statusZh: '会继续更新。',
    statusEn: 'Still being updated.',
    gallery: [
      { src: '/assets/robot-74000m.webp', alt: 'Team 74000M robot used in the interactive homepage' },
      { src: '/assets/about-vector-klzc-clean.webp', alt: 'Illustrated profile artwork for Cheng Zhang' },
      { src: '/assets/award-1.webp', alt: '2023 National VEX Robotics Elite Competition certificate' },
    ],
    links: [
      { href: '/', label: '查看首页', labelEn: 'View home' },
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
    summaryZh: '74000M 的模型、照片、证书和比赛记录。',
    summaryEn: 'Models, photos, certificates and competition records from 74000M.',
    whyZh: '把不同年份的材料放在一起，方便以后查看。',
    whyEn: 'Material from different years kept together for later reference.',
    roleZh: '整理资料并完成网页实现。',
    roleEn: 'Organised the material and built the web archive.',
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
        zh: '核对证书上的赛事、组别、队号、年份和奖项。',
        en: 'Checked each certificate for event, division, team number, year and award.',
      },
      {
        title: '重新关联 / Reconnect',
        titleEn: 'Reconnect',
        zh: '按年份和地点整理照片与证书。',
        en: 'Organised photos and certificates by year and place.',
      },
      {
        title: '模型 / Model',
        titleEn: 'Model',
        zh: '将 74000M 的装配模型放进网页。',
        en: 'Added the 74000M assembly model to the website.',
      },
    ],
    interestingZh: '模型来自当时保存的真实装配文件。',
    interestingEn: 'The model comes from the original assembly file.',
    statusZh: '主要材料已经整理完成。',
    statusEn: 'The main material has been organised.',
    gallery: [
      { src: '/assets/robot-74000m.webp', alt: 'Team 74000M VEX robot' },
      { src: '/assets/robotics-klzc.webp', alt: 'Cheng Zhang working with a VEX robotics team' },
      { src: '/assets/vex-asia-pacific.webp', alt: 'VEX Asia-Pacific competition memory' },
    ],
    links: [
      { href: '/robotics', label: '查看机器人记录', labelEn: 'View robotics' },
      { href: '/awards', label: '查看比赛证书', labelEn: 'View certificates' },
    ],
  },
  {
    slug: 'growth-atlas',
    title: 'Interactive Growth Atlas',
    zh: '地点记录',
    year: '2019—NOW',
    kind: 'MAP / DATA STORY',
    image: '/assets/atlas-shanghai.webp',
    imageAlt: 'Interactive map showing Shanghai in the growth atlas',
    summaryZh: '与学习和机器人比赛有关的七个地点。',
    summaryEn: 'Seven places connected to study and robotics competitions.',
    whyZh: '用地图查看这些经历发生在哪里。',
    whyEn: 'A map showing where these experiences took place.',
    roleZh: '整理地点和坐标，完成地图交互。',
    roleEn: 'Organised the locations and built the map interaction.',
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
        zh: '整理每个地点的坐标、文字和图片。',
        en: 'Organised coordinates, text and images for each place.',
      },
      {
        title: '地图交互 / Map interaction',
        titleEn: 'Map interaction',
        zh: '完成地图标记和镜头移动。',
        en: 'Built the map markers and camera movement.',
      },
      {
        title: '响应式控制 / Responsive controls',
        titleEn: 'Responsive controls',
        zh: '适配电脑和手机操作。',
        en: 'Adapted the controls for desktop and mobile.',
      },
    ],
    interestingZh: '每个地点对应一段记录或图片。',
    interestingEn: 'Each place links to a record or image.',
    statusZh: '目前收录七个地点。',
    statusEn: 'Seven places are currently included.',
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
