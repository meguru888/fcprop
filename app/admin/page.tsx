import { isAdminAuthed, adminLogout } from "@/lib/actions/admin-auth";
import { getUsageMetrics, getDocumentMetrics, listAdminDocuments } from "@/lib/actions/admin";
import { listFcs } from "@/lib/actions/fc-management";
import { AdminLoginForm } from "@/components/admin-login-form";
import { FcManagementPanel } from "@/components/fc-management-panel";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200/70 bg-white px-4 py-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const authed = await isAdminAuthed();
  if (!authed) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <AdminLoginForm />
      </main>
    );
  }

  const [usage, docMetrics, documents, fcs] = await Promise.all([
    getUsageMetrics(),
    getDocumentMetrics(),
    listAdminDocuments(),
    listFcs(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Admin · Not visible to FCs
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Metrics Dashboard</h1>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
            Log out
          </button>
        </form>
      </div>

      <div className="mt-8">
        <FcManagementPanel fcs={fcs} />
      </div>

      <section className="mt-6 rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Section 1 · ICP</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <MetricCard label="Unique FCs using text window" value={usage.section1.icpTextInput} />
          <MetricCard label="Unique FCs clicking Switch" value={usage.section1.icpSwitchClick} />
          <MetricCard label="Unique FCs clicking Edit" value={usage.section1.icpEditClick} />
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Section 2 · Clients</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MetricCard label="Unique FCs clicking + New client" value={usage.section2.newClientClick} />
          <MetricCard
            label="Unique FCs clicking existing clients"
            value={usage.section2.existingClientClick}
          />
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Section 3 · Benefit Illustration</h2>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <MetricCard
            label="Unique FCs uploading benefit illustrations"
            value={usage.section3.benefitIllustrationUpload}
          />
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Section 4 · Product Knowledge Base</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MetricCard label="Unique FCs uploading documents" value={docMetrics.uniqueUploaders} />
          <MetricCard label="Total documents uploaded (all FCs)" value={docMetrics.totalDocs} />
        </div>

        {docMetrics.perFc.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-ink-soft">
                  <th className="py-2 pr-4">FC</th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Total docs</th>
                  <th className="py-2 pr-4">By type</th>
                  <th className="py-2 pr-4">By day</th>
                </tr>
              </thead>
              <tbody>
                {docMetrics.perFc.map((fc) => (
                  <tr key={fc.key} className="border-b border-neutral-100 align-top">
                    <td className="py-2 pr-4 text-ink">
                      {fc.name ?? <span className="font-mono text-xs text-ink-soft">{fc.key}</span>}
                    </td>
                    <td className="py-2 pr-4 text-ink-soft">{fc.companyName ?? "—"}</td>
                    <td className="py-2 pr-4 font-medium text-ink">{fc.total}</td>
                    <td className="py-2 pr-4 text-xs text-ink-soft">
                      {Object.entries(fc.byType)
                        .map(([type, count]) => `${type}: ${count}`)
                        .join(", ")}
                    </td>
                    <td className="py-2 pr-4 text-xs text-ink-soft">
                      {Object.entries(fc.byDay)
                        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
                        .map(([day, count]) => `${day}: ${count}`)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[18px] border border-neutral-200/70 bg-paper-raised p-7 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-ink">Document Archive</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Every document uploaded by any FC, kept in a locked-down store separate from the FC-facing
          knowledge base. Download links expire after 5 minutes.
        </p>

        {documents.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">No documents archived yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-ink-soft">
                  <th className="py-2 pr-4">Filename</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Uploaded by</th>
                  <th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Uploaded at</th>
                  <th className="py-2 pr-4">Download</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-neutral-100">
                    <td className="py-2 pr-4 text-ink">{doc.original_filename ?? "—"}</td>
                    <td className="py-2 pr-4 text-ink-soft">{doc.doc_type ?? "other"}</td>
                    <td className="py-2 pr-4 text-ink-soft">
                      {doc.uploader_name ?? (
                        <span className="font-mono text-xs">{doc.uploader_anon_id ?? "—"}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-ink-soft">{formatBytes(doc.file_size)}</td>
                    <td className="py-2 pr-4 text-ink-soft">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">
                      {doc.download_url ? (
                        <a
                          href={doc.download_url}
                          className="text-brand-700 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-neutral-400">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
