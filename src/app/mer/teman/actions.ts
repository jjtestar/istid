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

  await prisma.user.update({
    where: { email: session.user.email },
    data: { theme },
  });

  revalidatePath("/", "layout");
  redirect("/mer/teman");
}
