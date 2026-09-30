/** @type {import('next').NextConfig} */
const nextConfig = {
  // Herramienta interna: un warning de ESLint (import sin usar, etc.) NO debe
  // tumbar el deploy en Vercel. Los errores reales de tipos siguen revisándose
  // con TypeScript (typescript.ignoreBuildErrors queda en false a propósito).
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Las páginas y archivos públicos del Informe (registro, acomodo del staff,
  // planos) se comparten por WhatsApp y contienen nombres: fuera de buscadores.
  async headers() {
    return [
      {
        source: "/informe/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ]
  },
}

export default nextConfig
