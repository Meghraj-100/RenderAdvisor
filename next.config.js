/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@babel/parser', '@babel/traverse', 'adm-zip'],
  },
};

module.exports = nextConfig;
