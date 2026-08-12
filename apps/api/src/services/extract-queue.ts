import IORedis from "ioredis";
import { config } from "../config";
import { logger as _logger } from "../lib/logger";

const EXTRACT_QUEUE = "extract.jobs";
const EXTRACT_DLQ = "extract.dlq";

// BRPOP is a blocking command and is incompatible with enableAutoPipelining,
// so this queue uses its own connection without auto-pipelining.
// Each consumer gets its own connection: two concurrent BRPOPs on one
// ioredis connection would serialize and starve one of the queues.
const queueConnection = new IORedis(config.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
});

function createConsumerConnection(): IORedis {
  return new IORedis(config.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
  });
}

export type ExtractJobData = {
  extractId: string;
  request: any;
  teamId: string;
  subId?: string | null;
  apiKeyId?: number | null;
  agent?: any;
  createdAt: number;
};

export async function addExtractJob(
  extractId: string,
  data: ExtractJobData,
): Promise<void> {
  await queueConnection.lpush(EXTRACT_QUEUE, JSON.stringify(data));
  _logger.info("Extract job added to queue", { extractId });
}

export async function consumeExtractJobs(
  handler: (
    data: ExtractJobData,
    ack: () => void,
    nack: () => void,
  ) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  const connection = createConsumerConnection();
  while (!signal?.aborted) {
    const result = await connection.brpop(EXTRACT_QUEUE, 0);
    if (!result) {
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    const data = JSON.parse(result[1]) as ExtractJobData;
    const logger = _logger.child({
      module: "extract-queue",
      extractId: data.extractId,
    });

    logger.info("Processing extract job");

    try {
      await handler(
        data,
        () => {},
        () => {
          connection
            .rpush(EXTRACT_DLQ, JSON.stringify(data))
            .catch(err =>
              logger.error("Failed to nack extract job to DLQ", { err }),
            );
        },
      );
    } catch (error) {
      logger.error("Extract job handler threw an error", { error });
      await connection.rpush(EXTRACT_DLQ, JSON.stringify(data));
    }
  }
  await connection.quit().catch(() => {});
}

export async function consumeExtractDLQ(
  handler: (data: ExtractJobData) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  const connection = createConsumerConnection();
  while (!signal?.aborted) {
    const result = await connection.brpop(EXTRACT_DLQ, 0);
    if (!result) {
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    const data = JSON.parse(result[1]) as ExtractJobData;
    const logger = _logger.child({
      module: "extract-dlq",
      extractId: data.extractId,
    });

    logger.info("Processing dead-lettered extract job");

    try {
      await handler(data);
    } catch (error) {
      logger.error("DLQ handler threw an error, requeueing", { error });
      await connection.lpush(EXTRACT_DLQ, JSON.stringify(data));
    }
  }
  await connection.quit().catch(() => {});
}

export async function shutdownExtractQueue(): Promise<void> {
  await queueConnection.quit().catch(() => {});
}
