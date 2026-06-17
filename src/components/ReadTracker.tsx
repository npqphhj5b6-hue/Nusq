"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  briefingId: string;
  userId: string | null;
}

export default function ReadTracker({ briefingId, userId }: Props) {
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("reading_history")
      .upsert(
        { user_id: userId, briefing_id: briefingId },
        { onConflict: "user_id,briefing_id", ignoreDuplicates: true }
      )
      .then(() => {});
  }, [briefingId, userId]);

  return null;
}
