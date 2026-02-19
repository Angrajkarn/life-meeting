import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const meetings = await prisma.meeting.findMany({
            include: {
                participants: {
                    include: {
                        user: true
                    }
                },
                host: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });
        return NextResponse.json(meetings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, date, time, type } = body;

        // Simplified creation logic for demo
        // In real app, would parse date/time properly from UI input
        // For now assuming body comes in prepared or we map it here

        // Mocking a future date for simplicity if raw strings provided
        const startTime = new Date(); // Replace with actual parsing
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

        // Hardcoding host to the first admin user for now (Nivedita)
        const host = await prisma.user.findFirst({ where: { role: 'Admin' } });

        if (!host) {
            return NextResponse.json({ error: "Host not found" }, { status: 404 });
        }

        const newMeeting = await prisma.meeting.create({
            data: {
                title,
                startTime,
                endTime,
                type: 'video',
                status: 'scheduled',
                hostId: host.id,
            }
        });

        return NextResponse.json(newMeeting);

    } catch (error) {
        return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 });
    }
}
