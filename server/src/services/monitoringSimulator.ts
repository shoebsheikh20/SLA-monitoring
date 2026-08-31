import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ServiceProfile {
  baseLatency: number;
  latencyVariance: number;
  spikeChance: number;
  baseUptime: number;
  baseErrorRate: number;
}

const profiles: Record<string, ServiceProfile> = {
  'Stripe Payment Gateway':   { baseLatency: 140, latencyVariance: 45,  spikeChance: 0.04, baseUptime: 99.99, baseErrorRate: 0.04 },
  'AWS S3 Object Storage':    { baseLatency: 65,  latencyVariance: 25,  spikeChance: 0.02, baseUptime: 99.995,baseErrorRate: 0.01 },
  'Auth0 Identity Service':   { baseLatency: 90,  latencyVariance: 30,  spikeChance: 0.02, baseUptime: 99.99, baseErrorRate: 0.02 },
  'OpenAI GPT-4 API':         { baseLatency: 650, latencyVariance: 250, spikeChance: 0.08, baseUptime: 99.6,  baseErrorRate: 1.2 },
  'SendGrid Email Engine':    { baseLatency: 210, latencyVariance: 75,  spikeChance: 0.05, baseUptime: 99.92, baseErrorRate: 0.15 },
  'Algolia Search Index':     { baseLatency: 35,  latencyVariance: 15,  spikeChance: 0.02, baseUptime: 99.99, baseErrorRate: 0.01 },
  'Twilio SMS & Voice Gateway':{ baseLatency: 180, latencyVariance: 60,  spikeChance: 0.04, baseUptime: 99.96, baseErrorRate: 0.08 },
  'Cloudflare Edge CDN':      { baseLatency: 22,  latencyVariance: 10,  spikeChance: 0.01, baseUptime: 99.999,baseErrorRate: 0.005 },
  'MongoDB Atlas Cluster':    { baseLatency: 38,  latencyVariance: 18,  spikeChance: 0.03, baseUptime: 99.97, baseErrorRate: 0.03 },
  'Redis Cloud Cache':        { baseLatency: 8,   latencyVariance: 4,   spikeChance: 0.01, baseUptime: 99.99, baseErrorRate: 0.005 },
  'Datadog Telemetry Pipeline':{ baseLatency: 240, latencyVariance: 90,  spikeChance: 0.06, baseUptime: 99.85, baseErrorRate: 0.25 },
  'GitHub Webhook Relay':     { baseLatency: 160, latencyVariance: 55,  spikeChance: 0.03, baseUptime: 99.94, baseErrorRate: 0.08 },
  'PostgreSQL Core DB':       { baseLatency: 18,  latencyVariance: 8,   spikeChance: 0.02, baseUptime: 99.99, baseErrorRate: 0.01 },
  'Customer Mobile App API':  { baseLatency: 110, latencyVariance: 40,  spikeChance: 0.04, baseUptime: 99.95, baseErrorRate: 0.06 },
  'Kubernetes Control Plane': { baseLatency: 28,  latencyVariance: 12,  spikeChance: 0.02, baseUptime: 99.98, baseErrorRate: 0.015 },
};

function getProfile(name: string): ServiceProfile {
  return profiles[name] || { baseLatency: 200, latencyVariance: 80, spikeChance: 0.05, baseUptime: 99.9, baseErrorRate: 0.2 };
}

function generateMetric(profile: ServiceProfile, isSpike: boolean) {
  const hourOfDay = new Date().getHours();
  const loadFactor = hourOfDay >= 9 && hourOfDay <= 18 ? 1.3 : 0.8; // Higher load during business hours

  const noise = (Math.random() - 0.5) * profile.latencyVariance;
  let latency = profile.baseLatency * loadFactor + noise;

  if (isSpike) {
    const spikeMagnitude = 2 + Math.random() * 4; // 2x–6x spike
    latency *= spikeMagnitude;
  }
  latency = Math.max(5, latency);

  const pageLoadTime = (latency / 1000) * (1.5 + Math.random() * 2);

  const uptime = isSpike
    ? profile.baseUptime - Math.random() * 0.8
    : profile.baseUptime - Math.random() * 0.02;

  const errorRate = isSpike
    ? profile.baseErrorRate * (3 + Math.random() * 5)
    : profile.baseErrorRate * (0.5 + Math.random());

  return {
    latency: Math.round(latency * 10) / 10,
    pageLoadTime: Math.round(pageLoadTime * 100) / 100,
    uptime: Math.min(100, Math.round(uptime * 1000) / 1000),
    errorRate: Math.round(errorRate * 100) / 100,
  };
}

async function runSimulation() {
  try {
    const services = await prisma.service.findMany({
      where: { monitoringEnabled: true },
    });

    for (const service of services) {
      const profile = getProfile(service.name);
      const isSpike = Math.random() < profile.spikeChance;

      const metric = generateMetric(profile, isSpike);

      await prisma.metric.create({
        data: {
          serviceId: service.id,
          ...metric,
        },
      });

      // Determine new status
      let newStatus = 'healthy';
      if (
        metric.latency > service.latencyThreshold * 1.5 ||
        metric.uptime < service.slaTarget - 0.5 ||
        metric.errorRate > service.errorRateThreshold * 3
      ) {
        newStatus = 'down';
      } else if (
        metric.latency > service.latencyThreshold ||
        metric.uptime < service.slaTarget ||
        metric.errorRate > service.errorRateThreshold
      ) {
        newStatus = 'at-risk';
      } else if (isSpike) {
        newStatus = 'degraded';
      }

      // Only update status if changed
      if (newStatus !== service.status) {
        await prisma.service.update({
          where: { id: service.id },
          data: { status: newStatus },
        });
      }

      // Create alerts for SLA violations
      if (metric.latency > service.latencyThreshold) {
        await prisma.alert.create({
          data: {
            serviceId: service.id,
            severity: metric.latency > service.latencyThreshold * 2 ? 'critical' : 'warning',
            message: `${service.name} latency ${metric.latency.toFixed(0)}ms exceeded SLA threshold of ${service.latencyThreshold}ms`,
          },
        });

        // Auto-create incident for critical spikes (only if no open incident exists)
        if (metric.latency > service.latencyThreshold * 2) {
          const existingIncident = await prisma.incident.findFirst({
            where: { serviceId: service.id, status: { not: 'resolved' } },
          });

          if (!existingIncident) {
            await prisma.incident.create({
              data: {
                serviceId: service.id,
                severity: 'critical',
                title: `${service.name} — Critical Latency SLA Breach`,
                description: `Automated detection: Response time ${metric.latency.toFixed(0)}ms exceeded critical threshold (${service.latencyThreshold * 2}ms). Service is impacting end users.`,
                status: 'open',
                slaImpact: Math.min(0.5, ((metric.latency - service.latencyThreshold) / service.latencyThreshold) * 0.1),
              },
            });
          }
        }
      }

      if (metric.uptime < service.slaTarget - 0.1) {
        await prisma.alert.create({
          data: {
            serviceId: service.id,
            severity: 'critical',
            message: `${service.name} uptime ${metric.uptime.toFixed(3)}% below SLA target of ${service.slaTarget}%`,
          },
        });
      }
    }

    // Cleanup old alerts (keep last 500 unread + all read from last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.alert.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: sevenDaysAgo },
      },
    });

    // Cleanup old metrics based on retention setting
    const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '30');
    const retentionDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await prisma.metric.deleteMany({
      where: { timestamp: { lt: retentionDate } },
    });

  } catch (error) {
    console.error('[Simulator] Error:', error);
  }
}

export function startMonitoringSimulator() {
  const intervalMs = parseInt(process.env.SIMULATOR_INTERVAL_MS || '30000');

  // Run immediately on start
  runSimulation();

  // Then run on cron schedule (every 30 seconds by default)
  if (intervalMs >= 60000) {
    // Use node-cron for minute-level intervals
    const minutes = Math.floor(intervalMs / 60000);
    cron.schedule(`*/${minutes} * * * *`, runSimulation);
  } else {
    // Use setInterval for sub-minute intervals
    setInterval(runSimulation, intervalMs);
  }

  console.log(`[Simulator] Running every ${intervalMs / 1000}s`);
}
