import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ai-founder/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: { include: { subscription: true } } },
    });

    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

    return NextResponse.json({ success: true, data: membership.organization });
  } catch (error) {
    console.error('GET /api/organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } },
    });

    if (!membership) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const { name, slug } = await request.json();

    const updated = await prisma.organization.update({
      where: { id: membership.organizationId },
      data: { name, slug },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PUT /api/organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

