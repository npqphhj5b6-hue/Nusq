"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function login(_prev: unknown, formData: FormData) {
  const password = formData.get("password") as string;

  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "Incorrect password." };
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", process.env.ADMIN_PASSWORD!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}

export async function approveBriefing(id: string) {
  const { error } = await supabaseAdmin
    .from("briefings")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  redirect("/admin");
}

export async function deleteBriefing(id: string) {
  const { error } = await supabaseAdmin
    .from("briefings")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  redirect("/admin");
}
