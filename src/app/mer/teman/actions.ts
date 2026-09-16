"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { normalizeTheme } from "@/lib/theme";

export async function setTheme(formData: FormData) {
  const user = await requireActiveUser();

  const theme = normalizeTheme(formData.get("theme")?.toString());

  await prisma.user.update({
    where: { id: user.id },
    data: { theme },
  });

  revalidatePath("/", "layout");
  redirect("/mer/teman");
}
