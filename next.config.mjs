/** @type {import('next').NextConfig} */
const nextConfig = {
  // Herramienta interna: un warning de ESLint (import sin usar, etc.) NO debe
  // tumbar el deploy en Vercel. Los errores reales de tipos siguen revisándose
  // con TypeScript (typescript.ignoreBuildErrors queda en false a propósito).
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Los oficios escaneados se suben por Server Action (hasta 4 MB; Vercel
  // acepta 4.5 MB por petición). El límite por defecto es 1 MB.
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
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
