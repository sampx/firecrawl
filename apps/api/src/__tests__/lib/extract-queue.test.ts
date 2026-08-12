import {
  addExtractJob,
  consumeExtractJobs,
  consumeExtractDLQ,
  shutdownExtractQueue,
  ExtractJobData,
} from "../../services/extract-queue";

jest.mock("ioredis", () => {
  const mockClient = {
    lpush: jest.fn().mockResolvedValue(1),
    rpush: jest.fn().mockResolvedValue(1),
    brpop: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined),
  };
  return jest.fn(() => mockClient);
});

const IORedisMock = jest.requireMock("ioredis") as jest.Mock;
const redisMock = IORedisMock();

const mockData: ExtractJobData = {
  extractId: "extract-1",
  request: { urls: ["https://example.com"] },
  teamId: "team-1",
  createdAt: Date.now(),
};

import IORedis from "ioredis";

describe("Extract Queue (Redis)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await shutdownExtractQueue();
  });

  describe("addExtractJob", () => {
    it("should push job to extract.jobs list", async () => {
      await addExtractJob("extract-1", mockData);

      expect(redisMock.lpush).toHaveBeenCalledWith(
        "extract.jobs",
        JSON.stringify(mockData),
      );
    });
  });

  describe("consumeExtractJobs", () => {
    it("should block-pop jobs and invoke handler with ack/nack", async () => {
      (redisMock.brpop as jest.Mock)
        .mockResolvedValueOnce(["extract.jobs", JSON.stringify(mockData)])
        .mockResolvedValueOnce(null);

      const handler = jest.fn().mockResolvedValue(undefined);
      const controller = new AbortController();
      const consumePromise = consumeExtractJobs(handler, controller.signal);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(handler).toHaveBeenCalledWith(
        mockData,
        expect.any(Function),
        expect.any(Function),
      );

      const ack = handler.mock.calls[0][1];
      await ack();
      expect(redisMock.rpush).not.toHaveBeenCalled();

      controller.abort();
      await consumePromise;
    });

    it("should nack job to DLQ when handler throws", async () => {
      (redisMock.brpop as jest.Mock)
        .mockResolvedValueOnce(["extract.jobs", JSON.stringify(mockData)])
        .mockResolvedValueOnce(null);

      const handler = jest.fn().mockRejectedValue(new Error("boom"));
      const controller = new AbortController();
      const consumePromise = consumeExtractJobs(handler, controller.signal);

      await new Promise(resolve => setTimeout(resolve, 50));

      const nack = handler.mock.calls[0][2];
      await nack();
      expect(redisMock.rpush).toHaveBeenCalledWith(
        "extract.dlq",
        JSON.stringify(mockData),
      );

      controller.abort();
      await consumePromise;
    });
  });

  describe("consumeExtractDLQ", () => {
    it("should block-pop DLQ jobs and invoke handler", async () => {
      (redisMock.brpop as jest.Mock)
        .mockResolvedValueOnce(["extract.dlq", JSON.stringify(mockData)])
        .mockResolvedValueOnce(null);

      const handler = jest.fn().mockResolvedValue(undefined);
      const controller = new AbortController();
      const consumePromise = consumeExtractDLQ(handler, controller.signal);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(handler).toHaveBeenCalledWith(mockData);
      controller.abort();
      await consumePromise;
    });
  });
});
