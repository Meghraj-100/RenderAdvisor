/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@babel/parser', '@babel/traverse', 'adm-zip'],
  },
};

module.exports = nextConfig;
