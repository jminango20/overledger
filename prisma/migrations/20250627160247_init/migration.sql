-- CreateTable
CREATE TABLE "contract_addresses" (
    "id" TEXT NOT NULL,
    "contractName" TEXT NOT NULL,
    "contractHash" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_address_updates" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "oldAddress" TEXT,
    "newAddress" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_address_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contract_addresses_contractName_key" ON "contract_addresses"("contractName");

-- CreateIndex
CREATE UNIQUE INDEX "contract_addresses_contractHash_key" ON "contract_addresses"("contractHash");

-- CreateIndex
CREATE UNIQUE INDEX "contract_address_updates_transactionHash_key" ON "contract_address_updates"("transactionHash");

-- AddForeignKey
ALTER TABLE "contract_address_updates" ADD CONSTRAINT "contract_address_updates_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contract_addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
