/**
 * 【next.config.mjs 配置说明】
 * output: 'export' 是 Next.js 配置文件 next.config.js 中的一个选项，它的作用就是将整个应用构建为一套纯静态的 HTML、CSS 和 JS 文件
 * 在运行 npm run build 时。Next.js 会在构建期对所有页面进行预渲染（Pre-rendering），把每个路由都直接编译成对应的静态 HTML 文件，
 * 并统一存放到默认的 out/ 文件夹中。运行时（Runtime）不再需要 Node.js 服务器。
 * 
 * 什么时候适合使用它？
 * output: 'export' 最适合这些场景：
 * 预算有限或需要边缘部署：静态托管服务 (如 Vercel, Netlify, GitHub Pages) 通常有慷慨的免费额度且自动享受全球CDN加速。
 * 内容不频繁更新：如个人博客、营销官网、帮助文档等，每次内容更新只需重新构建并部署即可。
 * 追求极致安全和性能：去除了Node.js后端，大幅减少了攻击面；预生成的静态文件天然具有极快的加载速度。
 */
/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: isProd ? '/react-fund' : '',
  assetPrefix: isProd ? '/react-fund/' : '',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
