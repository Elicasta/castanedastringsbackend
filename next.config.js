/** @type {import('next').NextConfig} */
module.exports = {
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async redirects() {
    return [
      { source: "/admin/login", destination: "/login", permanent: false },
      { source: "/admin/dashboard", destination: "/dashboard", permanent: false },
      { source: "/admin/inquiries/:path*", destination: "/inquiries/:path*", permanent: false },
      { source: "/admin/quotes/:path*", destination: "/quotes/:path*", permanent: false },
      { source: "/admin/contracts/:path*", destination: "/contracts/:path*", permanent: false },
      { source: "/admin/invoices/:path*", destination: "/invoices/:path*", permanent: false },
      { source: "/admin/clients/:path*", destination: "/clients/:path*", permanent: false },
      { source: "/admin/settings", destination: "/settings", permanent: false },
      { source: "/admin/email-logs", destination: "/communications", permanent: false },
      { source: "/admin/calendar", destination: "/dashboard", permanent: false },
      { source: "/admin/projects/:path*", destination: "/dashboard", permanent: false },
    ];
  },
};
