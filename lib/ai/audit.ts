import type { SupabaseClient } from "@supabase/supabase-js";

export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: {
    tool_name: string;
    input_ref_id?: string | null;
    output_ref_id?: string | null;
    triggered_by?: string;
    status: "ok" | "error";
    latency_ms: number;
  },
): Promise<void> {
  await supabase.from("audit_logs").insert({
    tool_name: entry.tool_name,
    input_ref_id: entry.input_ref_id ?? null,
    output_ref_id: entry.output_ref_id ?? null,
    triggered_by: entry.triggered_by ?? "fc_button_click",
    status: entry.status,
    latency_ms: entry.latency_ms,
  });
}
