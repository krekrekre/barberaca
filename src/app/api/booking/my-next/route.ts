import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/** Next upcoming appointment for the signed-in user (for book page summary). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ appointment: null });
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      userId: session.user.id,
      isPause: false,
      status: { in: ["CONFIRMED", "PENDING"] },
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: "asc" },
  });

  if (!appointment) {
    return NextResponse.json({ appointment: null });
  }

  const [service, employee] = await Promise.all([
    appointment.serviceId
      ? prisma.service.findUnique({
          where: { id: appointment.serviceId },
          select: { title: true },
        })
      : Promise.resolve(null),
    prisma.user.findUnique({
      where: { id: appointment.employeeId },
      select: { name: true },
    }),
  ]);

  if (!employee?.name) {
    return NextResponse.json({ appointment: null });
  }

  return NextResponse.json({
    appointment: {
      id: appointment.id,
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      serviceTitle: service?.title ?? null,
      employeeName: employee.name,
    },
  });
}
