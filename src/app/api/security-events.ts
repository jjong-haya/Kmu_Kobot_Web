import { getSupabaseBrowserClient } from "../auth/supabase";

export type SecurityEventInput = {
  eventType: string;
  path?: string | null;
  entityTable?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordSecurityEvent(input: SecurityEventInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.rpc("record_security_event", {
    p_event_type: input.eventType,
    p_path: input.path ?? null,
    p_entity_table: input.entityTable ?? null,
    p_entity_id: input.entityId ?? null,
    p_metadata: input.metadata ?? {},
  });
}
