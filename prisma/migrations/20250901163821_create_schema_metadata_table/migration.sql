-- CreateTable
CREATE TABLE "schema_metadata" (
    "id" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,
    "schemaIdBytes32" TEXT NOT NULL,
    "schemaName" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelNameBytes32" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schema_metadata_transactionHash_key" ON "schema_metadata"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "schema_metadata_schemaId_channelName_key" ON "schema_metadata"("schemaId", "channelName");
