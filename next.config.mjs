/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mode standalone pour Docker (réduit la taille de l'image)
  output: "standalone",

  // Autorise les Server Actions depuis le domaine de production (derrière Traefik)
  // @react-pdf/renderer reste externe pour éviter le conflit React dual-instance
  experimental: {
    serverActions: {
      allowedOrigins: ["elodie.fs0ciety.org", "localhost:3000"],
    },
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },

  // Ne pas bloquer le build sur les erreurs TS/ESLint en CI/Docker
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimisation des images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Headers de sécurité HTTP
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
