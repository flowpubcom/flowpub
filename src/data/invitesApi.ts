import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Lectura server-side de la landing /i/[code] (funciona sin sesión: el RPC
// es security definer con grant a anon).

export interface InviteInfo {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  available: boolean;
}

export const fetchInviteInfo = cache(
  async (code: string): Promise<InviteInfo | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_invite_info", {
      invite_code: code,
    });
    if (error || !data) return null;
    const d = data as Record<string, unknown>;
    return {
      username: String(d.username ?? ""),
      displayName: String(d.displayName ?? d.username ?? ""),
      avatarUrl: (d.avatarUrl as string | null) ?? null,
      available: d.available === true,
    };
  },
);
