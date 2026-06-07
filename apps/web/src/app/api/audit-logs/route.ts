import { NextResponse } from "next/server";
import { prisma } from "@ai-founder/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
  });

  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return NextResponse.json({ success: true, data: logs });
}

