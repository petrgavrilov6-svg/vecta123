import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Начало заполнения базы данных...');
    // 1. Создание платформенного админа
    const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@vecta.local';
    const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD || 'admin123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const platformAdmin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: adminPasswordHash,
            isPlatformAdmin: true,
        },
    });
    console.log(`✅ Платформенный админ создан: ${platformAdmin.email}`);
    // 2. Создание тестового пользователя-клиента
    const userEmail = 'user@test.local';
    const userPassword = 'test123';
    const userPasswordHash = await bcrypt.hash(userPassword, 10);
    const testUser = await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
            email: userEmail,
            passwordHash: userPasswordHash,
            isPlatformAdmin: false,
        },
    });
    console.log(`✅ Тестовый пользователь создан: ${testUser.email}`);
    // 3. Создание workspace для тестового пользователя
    const workspace = await prisma.workspace.upsert({
        where: { slug: 'test-workspace' },
        update: {},
        create: {
            name: 'Тестовый Workspace',
            slug: 'test-workspace',
        },
    });
    console.log(`✅ Workspace создан: ${workspace.name}`);
    // 4. Создание membership (OWNER)
    await prisma.member.upsert({
        where: {
            workspaceId_userId: {
                workspaceId: workspace.id,
                userId: testUser.id,
            },
        },
        update: {},
        create: {
            workspaceId: workspace.id,
            userId: testUser.id,
            role: 'OWNER',
        },
    });
    console.log(`✅ Membership создан: ${testUser.email} -> OWNER`);
    // 5. Создание тестовых клиентов
    const client1 = await prisma.client.create({
        data: {
            workspaceId: workspace.id,
            assignedToUserId: testUser.id,
            name: 'Иван Петров',
            email: 'ivan@example.com',
            phone: '+7 (999) 123-45-67',
            notes: 'Потенциальный клиент, интерес к продукту',
            tags: 'VIP,Потенциал',
        },
    });
    const client2 = await prisma.client.create({
        data: {
            workspaceId: workspace.id,
            assignedToUserId: testUser.id,
            name: 'Мария Сидорова',
            email: 'maria@example.com',
            phone: '+7 (999) 765-43-21',
            notes: 'Активный клиент',
            tags: 'Активный',
        },
    });
    console.log(`✅ Клиенты созданы: ${client1.name}, ${client2.name}`);
    // 6. Создание тестовых сделок
    const deal1 = await prisma.deal.create({
        data: {
            workspaceId: workspace.id,
            clientId: client1.id,
            stage: 'negotiation',
            amount: 150000,
            assignedToUserId: testUser.id,
        },
    });
    const deal2 = await prisma.deal.create({
        data: {
            workspaceId: workspace.id,
            clientId: client2.id,
            stage: 'closed_won',
            amount: 250000,
            assignedToUserId: testUser.id,
        },
    });
    console.log(`✅ Сделки созданы: ${deal1.stage}, ${deal2.stage}`);
    // 7. Создание тестовых задач
    const task1 = await prisma.task.create({
        data: {
            workspaceId: workspace.id,
            title: 'Связаться с Иваном Петровым',
            description: 'Обсудить условия договора',
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через 7 дней
            status: 'TODO',
            assignedToUserId: testUser.id,
            relatedClientId: client1.id,
            relatedDealId: deal1.id,
        },
    });
    const task2 = await prisma.task.create({
        data: {
            workspaceId: workspace.id,
            title: 'Отправить счет Марии Сидоровой',
            description: 'Счет на оплату по закрытой сделке',
            dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // через 2 дня
            status: 'IN_PROGRESS',
            assignedToUserId: testUser.id,
            relatedClientId: client2.id,
            relatedDealId: deal2.id,
        },
    });
    console.log(`✅ Задачи созданы: ${task1.title}, ${task2.title}`);
    // 8. Создание тестового audit event
    await prisma.auditEvent.create({
        data: {
            workspaceId: workspace.id,
            actorUserId: testUser.id,
            entityType: 'Workspace',
            entityId: workspace.id,
            action: 'CREATE',
            payloadJson: JSON.stringify({ name: workspace.name }),
        },
    });
    console.log('✅ Audit event создан');
    console.log('\n🎉 Заполнение базы данных завершено!');
    console.log('\n📋 Тестовые данные:');
    console.log(`   Клиент: ${userEmail} / ${userPassword}`);
    console.log(`   Админ: ${adminEmail} / ${adminPassword}`);
    console.log(`   Workspace slug: ${workspace.slug}`);
}
main()
    .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map