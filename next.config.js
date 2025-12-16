/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // 支持大文件上传
    },
  },
  transpilePackages: ['@supabase/supabase-js'],
}

module.exports = nextConfig
