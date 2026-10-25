import React from "react";

export const metadata = {
  title: "Youth Spark India Foundation | Backend API Engine",
};

export default function BackendStatusPage() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "48px 24px", maxWidth: "680px", margin: "0 auto", color: "#0f172a" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} />
        <h1 style={{ fontSize: "24px", margin: 0, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          YSIF Backend API Server
        </h1>
      </div>
      <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>
        Official REST API, Neon PostgreSQL database engine, and Cloudinary media processing service for Youth Spark India Foundation.
      </p>

      <div style={{ marginTop: "32px", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "14px", margin: "0 0 12px 0", color: "#334155" }}>Service Endpoints</h2>
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#0369a1", lineHeight: "2" }}>
          <li><code>/api/health</code> - Neon database health and latency diagnostics</li>
          <li><code>/api/events</code> - Community events & registration links</li>
          <li><code>/api/testimonials</code> - Community voices & beneficiary quotes</li>
          <li><code>/api/pages</code> - Static policy and public page content</li>
          <li><code>/api/programmes</code> - NGO operational programmes</li>
          <li><code>/api/stories</code> - Field narratives and news updates</li>
          <li><code>/api/media/list</code> - Cloudinary media asset library</li>
          <li><code>/api/documents</code> - Transparency and statutory disclosures</li>
        </ul>
      </div>

      <div style={{ marginTop: "32px", fontSize: "12px", color: "#94a3b8" }}>
        Youth Spark India Foundation · Igniting Potential; Empowering Futures !
      </div>
    </div>
  );
}
