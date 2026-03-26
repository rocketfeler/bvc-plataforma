import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración optimizada para Vercel
  reactStrictMode: true,
  
  // Eliminar rewrites que pueden causar problemas en producción
  // Las peticiones API se hacen directamente a la URL configurada
  
  // Optimización de imágenes
  images: {
    unoptimized: true,
  },
  
  // FIX: Configuración de Turbopack para Next.js 16
  // Esto resuelve el conflicto entre Turbopack y webpack custom config
  turbopack: {},
  
  // Webpack configuration para evitar problemas de build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Excluir source maps en producción para reducir tamaño
      config.devtool = false;
    }
    return config;
  },
};

export default nextConfig;
