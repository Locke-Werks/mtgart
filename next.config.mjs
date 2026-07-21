/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp is a native module; keep it external to the server bundle.
  serverExternalPackages: ["sharp"],
  // Pin the workspace root so a stray lockfile in a parent directory does not
  // make Next infer the wrong root for output file tracing.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
