import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

interface CoverageRow {
  council_id: string;
  council_name: string;
  last_import_at: string | null;
  bays_count: number;
  restrictions_count: number;
  sensors_count: number;
  meters_count: number;
  is_stale: boolean;
  is_active: boolean;
}

interface QualityMetrics {
  coverage: CoverageRow[];
  duplicates: unknown[];
  missingRestrictions: unknown[];
  invalidCoords: unknown[];
  recentFailures: Array<{ council_name: string; status: string; error_message: string | null; started_at: string }>;
}

function App() {
  const [data, setData] = useState<QualityMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/admin/quality`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F7F9FC", minHeight: "100vh", color: "#111827" }}>
      <header style={{ background: "#1A2744", color: "white", padding: "16px 24px" }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>ParkTime Admin — Data Quality</h1>
      </header>
      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        {loading && <p>Loading metrics…</p>}
        {error && <p style={{ color: "#EF4444" }}>Error: {error}</p>}
        {data && (
          <>
            <section style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid rgba(0,0,0,0.08)" }}>
              <h2 style={{ marginTop: 0 }}>Council coverage</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>
                    <th>Council</th><th>Bays</th><th>Restrictions</th><th>Sensors</th><th>Meters</th><th>Last import</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coverage.map((c) => (
                    <tr key={c.council_id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "8px 0" }}>{c.council_name}</td>
                      <td>{c.bays_count}</td>
                      <td>{c.restrictions_count}</td>
                      <td>{c.sensors_count}</td>
                      <td>{c.meters_count}</td>
                      <td>{c.last_import_at ? new Date(c.last_import_at).toLocaleString() : "—"}</td>
                      <td>
                        <span style={{ color: c.is_stale ? "#F59E0B" : "#22C55E" }}>
                          {c.is_active ? (c.is_stale ? "Stale" : "OK") : "No data"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              {[
                ["Duplicate bays", data.duplicates.length],
                ["Missing restrictions", data.missingRestrictions.length],
                ["Invalid coordinates", data.invalidCoords.length],
                ["Recent import failures", data.recentFailures.length],
              ].map(([label, count]) => (
                <div key={String(label)} style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: 12, color: "#6B7280", textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#1A2744" }}>{count}</div>
                </div>
              ))}
            </div>
            {data.recentFailures.length > 0 && (
              <section style={{ marginTop: 16, background: "#FEE2E2", borderRadius: 12, padding: 16 }}>
                <h3>Recent import failures</h3>
                <ul>{data.recentFailures.map((f, i) => (
                  <li key={i}>{f.council_name}: {f.error_message ?? f.status} ({new Date(f.started_at).toLocaleString()})</li>
                ))}</ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
