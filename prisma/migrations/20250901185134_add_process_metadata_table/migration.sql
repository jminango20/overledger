-- CreateTable
CREATE TABLE "process_metadata" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "processIdBytes32" TEXT NOT NULL,
    "natureId" TEXT NOT NULL,
    "natureIdBytes32" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "stageIdBytes32" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelNameBytes32" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "process_metadata_transactionHash_key" ON "process_metadata"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "process_metadata_processId_natureId_stageId_channelName_key" ON "process_metadata"("processId", "natureId", "stageId", "channelName");
