/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  experimental: {
    serverComponentsExternalPackages: ['@babel/parser', '@babel/traverse', 'adm-zip'],
  },
};

module.exports = nextConfig;
