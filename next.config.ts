import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable static file serving
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/uploads/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for MySQL and other Node.js modules in client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        events: false,
        querystring: false,
        child_process: false,
        cluster: false,
        dgram: false,
        dns: false,
        domain: false,
        http2: false,
        https: false,
        inspector: false,
        module: false,
        perf_hooks: false,
        process: false,
        punycode: false,
        readline: false,
        repl: false,
        string_decoder: false,
        sys: false,
        timers: false,
        tty: false,
        v8: false,
        vm: false,
        worker_threads: false,
      };

      // Exclude serverless-mysql and mysql from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'serverless-mysql': 'commonjs serverless-mysql',
        'mysql': 'commonjs mysql',
        'mysql2': 'commonjs mysql2',
      });
    }
    return config;
  },
};

export default nextConfig;
