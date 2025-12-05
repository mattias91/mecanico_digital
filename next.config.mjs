/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Fix para o erro de resolução do postgrest-js
    config.resolve.alias = {
      ...config.resolve.alias,
      '@supabase/postgrest-js': '@supabase/postgrest-js/dist/module/index.js',
    };
    
    return config;
  },
};

export default nextConfig;
