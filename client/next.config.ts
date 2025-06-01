/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Example for Google profile pictures
        port: '',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // Example for GitHub avatars
        port: '',
        pathname: '/u/**',
      },
      // Add other hostnames your app might use for user images
    ],
  },
};

module.exports = nextConfig;