"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTheme } from "@/lib/theme";

export async function setTheme(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const theme = normalizeTheme(formData.get("theme")?.toString());

  // Scoped to an active, approved account so the write itself is the access
  // check — no extra query now that the proxy no longer makes one.
  const updated = await prisma.user.updateMany({
    where: { email: session.user.email, isActive: true, accessApproved: true },
    data: { theme },
  });
  if (updated.count === 0) redirect("/login");

  revalidatePath("/", "layout");
  redirect("/mer/teman");
}
