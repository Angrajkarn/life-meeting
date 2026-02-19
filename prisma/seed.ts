import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Clean up existing data
    await prisma.activityLog.deleteMany()
    await prisma.participant.deleteMany()
    await prisma.meeting.deleteMany()
    await prisma.user.deleteMany()

    // 1. Create Main User
    const mainUser = await prisma.user.create({
        data: {
            email: 'nivedita@lifemeeting.com',
            name: 'Nivedita',
            role: 'Admin',
            avatar: 'https://github.com/shadcn.png',
        },
    })

    // 2. Create Teammates
    const teammates = await Promise.all([
        prisma.user.create({ data: { email: 'sarah@lifemeeting.com', name: 'Sarah J.', role: 'Member', avatar: 'https://i.pravatar.cc/100?img=5' } }),
        prisma.user.create({ data: { email: 'mike@lifemeeting.com', name: 'Mike Ross', role: 'Member', avatar: 'https://i.pravatar.cc/100?img=3' } }),
        prisma.user.create({ data: { email: 'alex@lifemeeting.com', name: 'Alex Johnson', role: 'Member', avatar: 'https://i.pravatar.cc/100?img=12' } }),
    ])

    const allUsers = [mainUser, ...teammates]

    // 3. Create Meetings

    // Meeting 1: Upcoming (In 15 mins)
    const meeting1 = await prisma.meeting.create({
        data: {
            title: 'Weekly Design Sync',
            description: 'Discussing new auth flow & dashboard widgets',
            startTime: new Date(Date.now() + 15 * 60 * 1000), // +15 mins
            endTime: new Date(Date.now() + 75 * 60 * 1000),   // +1h 15m
            status: 'scheduled',
            type: 'video',
            goal: 'Finalize Dashboard Layout',
            tags: 'Design,Product',
            hostId: mainUser.id,
        }
    })

    // Meeting 2: Upcoming (Later today)
    const meeting2 = await prisma.meeting.create({
        data: {
            title: 'Client Onboarding: Acme Corp',
            description: 'Onboarding the Acme Corp team to the platform.',
            startTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // +4 hours
            endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
            status: 'scheduled',
            type: 'video',
            goal: 'Customer Success',
            tags: 'Onboarding,Client',
            hostId: teammates[0].id, // Sarah
        }
    })

    // Meeting 3: Past (Yesterday)
    const meeting3 = await prisma.meeting.create({
        data: {
            title: 'Q1 Roadmap Review',
            description: 'Planning out the next quarter.',
            startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // -24 hours
            endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
            status: 'completed',
            type: 'hybrid',
            goal: 'Strategy Alignment',
            tags: 'Strategy',
            hostId: mainUser.id,
        }
    })

    // 4. Add Participants
    await prisma.participant.createMany({
        data: [
            { userId: mainUser.id, meetingId: meeting1.id },
            { userId: teammates[0].id, meetingId: meeting1.id },
            { userId: teammates[1].id, meetingId: meeting1.id },

            { userId: mainUser.id, meetingId: meeting2.id },
            { userId: teammates[0].id, meetingId: meeting2.id },
            { userId: teammates[2].id, meetingId: meeting2.id },

            { userId: mainUser.id, meetingId: meeting3.id },
            { userId: teammates[0].id, meetingId: meeting3.id },
            { userId: teammates[1].id, meetingId: meeting3.id },
            { userId: teammates[2].id, meetingId: meeting3.id },
        ]
    })

    // 5. Activity Logs
    await prisma.activityLog.createMany({
        data: [
            { action: 'Joined Meeting', description: 'Product Roadmap Q1', userId: mainUser.id, timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000) },
            { action: 'Updated Settings', description: 'Changed notification preferences', userId: mainUser.id, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            { action: 'Scheduled Meeting', description: 'Weekly Design Sync', userId: mainUser.id, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
        ]
    })

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
