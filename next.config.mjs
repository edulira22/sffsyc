/** @type {import('next').NextConfig} */
const nextConfig = {
  // Herramienta interna: un warning de ESLint (import sin usar, etc.) NO debe
  // tumbar el deploy en Vercel. Los errores reales de tipos siguen revisándose
  // con TypeScript (typescript.ignoreBuildErrors queda en false a propósito).
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
