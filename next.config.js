/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: 'build',
  env: {
    APP_DOMAIN: process.env.APP_DOMAIN,
    FIX_ROOM_ID: process.env.FIX_ROOM_ID,
    JANUS_DEFAULT_SERVER: process.env.JANUS_DEFAULT_SERVER,
    JANUS_SECOND_SERVER: process.env.JANUS_SECOND_SERVER,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    FIREBASE_REALTIME_DB_URL: process.env.FIREBASE_REALTIME_DB_URL
  },
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['pages']
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'graph.facebook.com',
      'firebasestorage.googleapis.com'
    ]
  }
}

module.exports = nextConfig
