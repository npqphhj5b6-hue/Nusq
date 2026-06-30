"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { recordRead } from "@/lib/streak";
import StreakToast from "@/components/StreakToast";

interface Props {
  briefingId: string;
  userId: string | null;
}

export default function ReadTracker({ briefingId, userId }: Props) {
  const [streakCount, setStreakCount] = useState<number | null>(null);

  useEffect(() => {
    // Record in Supabase for logged-in users
    if (userId) {
      const supabase = createClient();
      supabase
        .from("reading_history")
        .upsert(
          { user_id: userId, briefing_id: briefingId },
          { onConflict: "user_id,briefing_id", ignoreDuplicates: true }
        )
        .then(() => {});
    }

    // Record streak for everyone (localStorage)
    const { data, isNew } = recordRead();
    if (isNew) {
      setStreakCount(data.count);
    }
  }, [briefingId, userId]);

  if (!streakCount) return null;
  return <StreakToast count={streakCount} />;
}
