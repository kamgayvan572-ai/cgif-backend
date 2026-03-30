// ─── prisma/seed.ts ───────────────────────────────────────────────────────────
// CGIF — Seed de développement
// Commande : npm run db:seed
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CGIF database...');

  // ── 1. Clusters ──────────────────────────────────────────────
  const clusters = await Promise.all([
    prisma.cluster.upsert({ where: { name: 'Santé & Médecine' }, update: {}, create: { name: 'Santé & Médecine', code: 'H', domain: 'health', active: true, color: '#13883C', iconType: 'foret' } }),
    prisma.cluster.upsert({ where: { name: 'Finance & Investissement' }, update: {}, create: { name: 'Finance & Investissement', code: 'F', domain: 'finance', active: true, color: '#C8821A', iconType: 'mont' } }),
    prisma.cluster.upsert({ where: { name: 'Éducation & Formation' }, update: {}, create: { name: 'Éducation & Formation', code: 'ED', domain: 'education', active: true, color: '#2563EB', iconType: 'ville' } }),
    prisma.cluster.upsert({ where: { name: 'Énergie & Environnement' }, update: {}, create: { name: 'Énergie & Environnement', code: 'EN', domain: 'energy', active: true, color: '#7E57C2', iconType: 'foret' } }),
    prisma.cluster.upsert({ where: { name: 'Numérique & Tech' }, update: {}, create: { name: 'Numérique & Tech', code: 'T', domain: 'tech', active: true, color: '#0891B2', iconType: 'ville' } }),
    prisma.cluster.upsert({ where: { name: 'Agro-alimentaire' }, update: {}, create: { name: 'Agro-alimentaire', code: 'A', domain: 'agro', active: true, color: '#65A30D', iconType: 'foret' } }),
  ]);

  const [sante, finance, , , tech] = clusters;
  console.log(`✅ ${clusters.length} clusters créés`);

  // ── 2. Admin ──────────────────────────────────────────────────
  const adminHash  = await bcrypt.hash(process.env.ADMIN_PASSWORD  || 'Admin@CGIF2024!',  12);
  const memberHash = await bcrypt.hash(process.env.MEMBER_PASSWORD || 'Member@CGIF2024!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'yvan@cgif.cm' }, update: {},
    create: { email: 'yvan@cgif.cm', passwordHash: adminHash, name: 'Yvan Kamga', initials: 'YK', role: 'ADMIN', status: 'ACTIVE', kycStatus: 'APPROVED', country: 'France', city: 'Paris', domain: 'finance', clusterId: finance.id },
  });

  const amina = await prisma.user.upsert({
    where: { email: 'amina@cgif.cm' }, update: {},
    create: { email: 'amina@cgif.cm', passwordHash: memberHash, name: 'Amina Bello', initials: 'AB', role: 'MEMBER', status: 'ACTIVE', kycStatus: 'APPROVED', country: 'Canada', city: 'Montréal', domain: 'health', clusterId: sante.id },
  });

  const paul = await prisma.user.upsert({
    where: { email: 'paul@cgif.cm' }, update: {},
    create: { email: 'paul@cgif.cm', passwordHash: memberHash, name: 'Paul Essomba', initials: 'PE', role: 'MEMBER', status: 'ACTIVE', kycStatus: 'PENDING', country: 'Allemagne', city: 'Berlin', domain: 'tech', clusterId: tech.id },
  });

  console.log('✅ 3 utilisateurs créés (admin + 2 membres)');

  // ── 3. KYC Amina ──────────────────────────────────────────────
  await prisma.kycRecord.upsert({
    where: { memberId: amina.id }, update: {},
    create: { memberId: amina.id, status: 'APPROVED', nom: 'Bello', prenom: 'Amina', dateNaissance: '1990-04-12', nationalite: 'Camerounaise', adresse: '12 rue Laurier, Montréal', docType: 'passport', proofType: 'facture', reviewedById: admin.id, reviewedAt: new Date() },
  });

  // ── 4. Projets ────────────────────────────────────────────────
  const projet1 = await prisma.project.upsert({
    where: { id: 'proj-clinique-001' }, update: {},
    create: { id: 'proj-clinique-001', title: 'Clinique Spécialisée Yaoundé', description: 'Construction d\'une clinique spécialisée en cardiologie et chirurgie à Yaoundé.', status: 'FUNDING', targetAmount: 150_000_000, sharePrice: 5000, collectedAmount: 48_500_000, progress: 32, fundingDeadline: new Date('2025-09-30'), category: 'Santé', location: 'Yaoundé, Cameroun', returnRate: 8.5, duration: '5 ans', clusterId: sante.id, submitterId: admin.id, analystId: admin.id },
  });

  await prisma.project.upsert({
    where: { id: 'proj-fintech-001' }, update: {},
    create: { id: 'proj-fintech-001', title: 'FinTech OHADA Platform', description: 'Plateforme fintech conforme aux normes OHADA pour faciliter les transferts et micro-investissements.', status: 'REVIEW', targetAmount: 75_000_000, sharePrice: 5000, collectedAmount: 0, progress: 0, category: 'Finance', location: 'Douala, Cameroun', returnRate: 12, duration: '3 ans', clusterId: finance.id, submitterId: amina.id },
  });

  await prisma.project.upsert({
    where: { id: 'proj-solar-001' }, update: {},
    create: { id: 'proj-solar-001', title: 'SolarVille — Villages Solaires', description: 'Installation de micro-réseaux solaires dans 15 villages ruraux du Grand Nord Cameroun.', status: 'FUNDED', targetAmount: 200_000_000, sharePrice: 5000, collectedAmount: 200_000_000, progress: 100, category: 'Énergie', location: 'Maroua, Cameroun', returnRate: 7, duration: '7 ans', clusterId: clusters[3].id, submitterId: admin.id, analystId: admin.id },
  });

  console.log('✅ 3 projets créés');

  // ── 5. Investissement démo ────────────────────────────────────
  const existInv = await prisma.investment.findFirst({ where: { memberId: amina.id, projectId: projet1.id } });
  if (!existInv) {
    await prisma.investment.create({
      data: { memberId: amina.id, projectId: projet1.id, amount: 500_000, sharePrice: 5000, sharesCount: 100, paymentMethod: 'VIREMENT_SEPA', status: 'ACTIVE', refVirement: `CGIF-0001-AMIN-${Date.now().toString(36).toUpperCase()}`, memberNom: 'Bello', memberPrenom: 'Amina', activatedAt: new Date(Date.now() - 3 * 86400_000) },
    });
  }

  // ── 6. Notifications démo ─────────────────────────────────────
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      { userId: amina.id, type: 'success', icon: '✅', title: 'KYC validé', message: 'Votre identité a été vérifiée. Vous pouvez désormais investir.', entityType: 'kyc' },
      { userId: amina.id, type: 'info', icon: '💼', title: 'Investissement activé', message: '100 parts activées dans "Clinique Spécialisée Yaoundé"', entityType: 'investment' },
      { userId: paul.id, type: 'info', icon: '🪪', title: 'KYC en attente', message: 'Votre dossier KYC est en cours d\'examen.', entityType: 'kyc' },
    ],
  });

  // ── 7. Annonce ────────────────────────────────────────────────
  await prisma.announcement.upsert({
    where: { id: 'ann-welcome-001' }, update: {},
    create: { id: 'ann-welcome-001', title: 'Bienvenue sur CGIF', body: 'La plateforme CGIF est en ligne. Complétez votre KYC pour accéder aux projets.', scope: 'all', priority: 'high', status: 'published', authorId: admin.id },
  });

  // ── 8. Audit log ──────────────────────────────────────────────
  await prisma.auditLog.create({ data: { action: 'SEED_COMPLETED', actorRole: 'SYSTEM', target: 'Database', type: 'system', severity: 'info' } });

  console.log('\n✅ Seed terminé avec succès !');
  console.log('─────────────────────────────────────────────────');
  console.log(' Admin  : yvan@cgif.cm   / $ADMIN_PASSWORD');
  console.log(' Membre : amina@cgif.cm  / $MEMBER_PASSWORD');
  console.log(' Paul   : paul@cgif.cm   / $MEMBER_PASSWORD');
  console.log('─────────────────────────────────────────────────');
  console.log(' ⚠️  Changer les mots de passe en production !');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
