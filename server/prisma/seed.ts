import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const services = [
  {
    name: 'Stripe Payment Gateway',
    description: 'Global online payment processing & subscription billing API',
    url: 'https://api.stripe.com/v1/charges',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 250,
    pageLoadThreshold: 1.2,
    errorRateThreshold: 0.05,
  },
  {
    name: 'AWS S3 Object Storage',
    description: 'Scalable cloud storage for media assets and backups',
    url: 'https://s3.us-east-1.amazonaws.com',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 120,
    pageLoadThreshold: 0.8,
    errorRateThreshold: 0.01,
  },
  {
    name: 'Auth0 Identity Service',
    description: 'Enterprise OAuth2 / OIDC authentication & user sessions',
    url: 'https://auth.slapulse.auth0.com/oauth/token',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 180,
    pageLoadThreshold: 1.0,
    errorRateThreshold: 0.02,
  },
  {
    name: 'OpenAI GPT-4 API',
    description: 'Generative AI LLM inference & vector embedding pipeline',
    url: 'https://api.openai.com/v1/chat/completions',
    environment: 'production',
    region: 'us-west-2',
    slaTarget: 99.5,
    latencyThreshold: 1200,
    pageLoadThreshold: 3.5,
    errorRateThreshold: 1.5,
  },
  {
    name: 'SendGrid Email Engine',
    description: 'High-volume transactional email delivery & webhook dispatcher',
    url: 'https://api.sendgrid.com/v3/mail/send',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.9,
    latencyThreshold: 350,
    pageLoadThreshold: 2.0,
    errorRateThreshold: 0.2,
  },
  {
    name: 'Algolia Search Index',
    description: 'Ultra-fast real-world product & content search index engine',
    url: 'https://slapulse-dsn.algolia.net/1/indexes',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 80,
    pageLoadThreshold: 0.6,
    errorRateThreshold: 0.02,
  },
  {
    name: 'Twilio SMS & Voice Gateway',
    description: 'Multi-channel SMS, 2FA verification & voice dispatching',
    url: 'https://api.twilio.com/2010-04-01/Accounts',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.95,
    latencyThreshold: 300,
    pageLoadThreshold: 1.8,
    errorRateThreshold: 0.1,
  },
  {
    name: 'Cloudflare Edge CDN',
    description: 'Global Anycast CDN caching, DDoS mitigation & WAF edge security',
    url: 'https://api.cloudflare.com/client/v4/zones',
    environment: 'production',
    region: 'global',
    slaTarget: 99.999,
    latencyThreshold: 45,
    pageLoadThreshold: 0.4,
    errorRateThreshold: 0.01,
  },
  {
    name: 'MongoDB Atlas Cluster',
    description: 'Fully managed distributed NoSQL document database cluster',
    url: 'https://cloud.mongodb.com/api/atlas/v1.0',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.95,
    latencyThreshold: 75,
    pageLoadThreshold: 0.5,
    errorRateThreshold: 0.05,
  },
  {
    name: 'Redis Cloud Cache',
    description: 'High-speed in-memory session cache & API rate limiter',
    url: 'https://redis.cloud/api/v1/clusters',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 20,
    pageLoadThreshold: 0.2,
    errorRateThreshold: 0.01,
  },
  {
    name: 'Datadog Telemetry Pipeline',
    description: 'Cloud-scale APM metrics, distributed trace & log ingestion',
    url: 'https://http-intake.logs.datadoghq.com/v1/input',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.9,
    latencyThreshold: 400,
    pageLoadThreshold: 2.0,
    errorRateThreshold: 0.3,
  },
  {
    name: 'GitHub Webhook Relay',
    description: 'CI/CD automation & automated code deployment webhooks',
    url: 'https://api.github.com/repos/slapulse/app/hooks',
    environment: 'production',
    region: 'us-west-2',
    slaTarget: 99.9,
    latencyThreshold: 280,
    pageLoadThreshold: 1.4,
    errorRateThreshold: 0.1,
  },
  {
    name: 'PostgreSQL Core DB',
    description: 'High-availability relational database cluster with read replicas',
    url: 'https://db-primary.slapulse.internal',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 35,
    pageLoadThreshold: 0.4,
    errorRateThreshold: 0.01,
  },
  {
    name: 'Customer Mobile App API',
    description: 'Core backend REST API serving iOS and Android mobile apps',
    url: 'https://mobile-api.slapulse.io/v2',
    environment: 'production',
    region: 'eu-central-1',
    slaTarget: 99.9,
    latencyThreshold: 220,
    pageLoadThreshold: 1.5,
    errorRateThreshold: 0.1,
  },
  {
    name: 'Kubernetes Control Plane',
    description: 'Cloud container orchestration, auto-healing & ingress router',
    url: 'https://k8s-control.slapulse.internal:6443',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.95,
    latencyThreshold: 50,
    pageLoadThreshold: 0.5,
    errorRateThreshold: 0.02,
  },
];

function generateRealisticMetrics(
  baseLatency: number,
  _slaTarget: number,
  hoursAgo: number
): {
  latency: number;
  pageLoadTime: number;
  uptime: number;
  errorRate: number;
} {
  const timeVariation = Math.sin(hoursAgo * 0.3) * 0.15;
  const noise = (Math.random() - 0.5) * 0.2;
  const spike = Math.random() < 0.05 ? Math.random() * 3 : 1;

  const latency = Math.max(
    10,
    baseLatency * (0.7 + timeVariation + noise) * spike
  );
  const pageLoadTime = latency * (1.5 + Math.random() * 1.5) / 1000;
  const uptimeBase = 99.9 + Math.random() * 0.1;
  const uptime = spike > 2 ? uptimeBase - Math.random() * 0.5 : uptimeBase;
  const errorRate =
    spike > 2
      ? Math.random() * 5
      : Math.random() * 0.8;

  return {
    latency: Math.round(latency * 10) / 10,
    pageLoadTime: Math.round(pageLoadTime * 100) / 100,
    uptime: Math.round(uptime * 1000) / 1000,
    errorRate: Math.round(errorRate * 100) / 100,
  };
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.alert.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.sLAConfig.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@slapulse.io',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Admin user created: admin@slapulse.io / Admin@123');

  // Create services with historical metrics
  for (let i = 0; i < services.length; i++) {
    const svcData = services[i];
    const baseLatency = svcData.latencyThreshold * (0.3 + Math.random() * 0.4);

    const service = await prisma.service.create({
      data: {
        ...svcData,
        status: i === 3 ? 'at-risk' : i === 5 ? 'degraded' : 'healthy',
      },
    });

    // Create SLA config
    await prisma.sLAConfig.create({
      data: {
        serviceId: service.id,
        availabilitySLA: svcData.slaTarget,
        responseTimeSLA: svcData.latencyThreshold,
        pageLoadSLA: svcData.pageLoadThreshold,
        errorRateSLA: svcData.errorRateThreshold,
      },
    });

    // Generate 7 days of historical metrics (every 15 minutes)
    const metricsData = [];
    const pointsPerDay = 4 * 24; // 15-min intervals
    const totalPoints = pointsPerDay * 7;

    for (let j = totalPoints; j >= 0; j--) {
      const hoursAgo = j / 4;
      const metrics = generateRealisticMetrics(baseLatency, svcData.slaTarget, hoursAgo);
      metricsData.push({
        serviceId: service.id,
        ...metrics,
        timestamp: new Date(Date.now() - j * 15 * 60 * 1000),
      });
    }

    await prisma.metric.createMany({ data: metricsData });

    // Create incidents
    if (i < 5) {
      await prisma.incident.create({
        data: {
          serviceId: service.id,
          severity: i === 0 ? 'high' : i === 3 ? 'critical' : 'medium',
          title:
            i === 3
              ? `${svcData.name} SLA Breach — Latency Exceeded`
              : `${svcData.name} Performance Degradation`,
          description: `Automated detection: ${svcData.name} has experienced performance issues affecting SLA compliance.`,
          status: i < 2 ? 'open' : i < 4 ? 'investigating' : 'resolved',
          slaImpact: Math.random() * 0.5,
          startedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          resolvedAt:
            i >= 4
              ? new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000)
              : null,
          notes:
            i >= 4
              ? 'Issue resolved by restarting the service and scaling up resources.'
              : '',
        },
      });
    }

    // Create alerts
    const alertMessages = [
      {
        severity: 'critical',
        message: `${svcData.name} response time exceeded SLA threshold of ${svcData.latencyThreshold}ms`,
      },
      {
        severity: 'warning',
        message: `${svcData.name} latency approaching SLA limit — currently at ${Math.round(svcData.latencyThreshold * 0.85)}ms`,
      },
      {
        severity: 'info',
        message: `${svcData.name} monitoring configuration updated`,
      },
    ];

    const alertsToCreate = alertMessages.slice(0, i < 3 ? 3 : i < 6 ? 2 : 1);
    for (const alert of alertsToCreate) {
      await prisma.alert.create({
        data: {
          serviceId: service.id,
          severity: alert.severity,
          message: alert.message,
          isRead: Math.random() > 0.5,
          createdAt: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000),
        },
      });
    }

    console.log(`✅ Service seeded: ${svcData.name}`);
  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
