import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateSchemaDto,
  CreateSchemaResponseDto,
  UpdateSchemaDto,
  UpdateSchemaResponseDto,
  DeprecateSchemaDto,
  DeprecateSchemaResponseDto,
  InactivateSchemaDto,
  InactivateSchemaResponseDto,
  GetSchemaDto,
  GetSchemaByVersionDto,
  SchemaDto,
  SchemaInputContract,
  SchemaInfoResponseDto,
  SchemaStatus,
  SchemaUpdateInputContract,
  SetSchemaStatusDto,
  SetSchemaStatusResponseDto,
  SchemaStatusConverter,
} from './dto/schema-registry.dto';
import { BlockchainProvider } from '@/blockchain/providers/blockchain.provider';
import { ABIName } from '@/blockchain/abis';
import { BaseContractService } from '@/blockchain/services/base-contract.service';
import { SchemaEventParser } from './services/schema-event-parser.service';
import { SchemaValidator } from './services/schema-validator.service';
import { ethers } from 'ethers';

@Injectable()
export class SchemaRegistryService extends BaseContractService {
  private readonly SCHEMA_REGISTRY_BYTES32: string;

  constructor(
    blockchainProvider: BlockchainProvider,
    private readonly prismaService: PrismaService,
    private readonly eventParser: SchemaEventParser,
    private readonly validator: SchemaValidator,
  ) {
    super(blockchainProvider);
    this.SCHEMA_REGISTRY_BYTES32 = this.toBytes32('SCHEMA_REGISTRY');
  }

  protected getContractNameBytes32(): string {
    return this.SCHEMA_REGISTRY_BYTES32;
  }

  protected getContractABIName(): ABIName {
    return 'SchemaRegistry';
  }

  /**
   * Create a new schema
   */
  async createSchema(
    createDto: CreateSchemaDto,
    privateKey: string,
  ): Promise<CreateSchemaResponseDto> {
    this.validator.validateSchemaInput(createDto, [
      'schemaId',
      'name',
      'channelName',
      'dataHash',
    ]);

    return this.executeTransactionOperation(
      'createSchema',
      createDto.schemaId,
      createDto.channelName,
      privateKey,
      async (contract, walletAddress) => {
        const schemaInput: SchemaInputContract = {
          id: this.toBytes32(createDto.schemaId),
          name: createDto.name,
          dataHash: createDto.dataHash.startsWith('0x')
            ? createDto.dataHash
            : `0x${createDto.dataHash}`,
          channelName: this.toBytes32(createDto.channelName),
          description: createDto.description || '',
        };

        this.logger.debug(`Chamando createSchema com:`, {
          schemaId: createDto.schemaId,
          name: createDto.name,
          channelName: createDto.channelName,
        });

        const tx = await contract.createSchema(schemaInput);
        return {
          tx,
          additionalData: {
            dto: createDto,
            schemaIdBytes32: schemaInput.id,
            channelNameBytes32: schemaInput.channelName,
            walletAddress,
            contract,
          },
        };
      },
      (tx, receipt, walletAddress, additionalData) => {
        const eventData = this.parseContractEvent<{
          id: string;
          name: string;
          version: bigint;
          owner: string;
          channelName: string;
          timestamp: bigint;
        }>(receipt, 'SchemaCreated', additionalData.contract);

        const responseData = {
          schemaIdBytes32: eventData?.id || additionalData.schemaIdBytes32,
          schemaName: eventData?.name || additionalData.dto.name,
          version: eventData ? Number(eventData.version) : 1,
          owner: eventData?.owner || walletAddress,
          channelNameBytes32:
            eventData?.channelName || additionalData.dto.channelName,
        };

        // Após confirmação na blockchain, salvar metadados no banco
        this.saveSchemaMetadata({
          schemaId: additionalData.dto.schemaId,
          schemaIdBytes32: responseData.schemaIdBytes32,
          schemaName: responseData.schemaName,
          channelName: additionalData.dto.channelName,
          channelNameBytes32: responseData.channelNameBytes32,
          walletAddress: responseData.owner,
          transactionHash: tx.hash,
        });

        return {
          ...this.buildTransactionResponse(tx, receipt),
          schemaId: additionalData.dto.schemaId,
          schemaIdBytes32: responseData.schemaIdBytes32,
          name: additionalData.dto.name,
          version: responseData.version || 1,
          channelName: additionalData.dto.channelName,
          channelNameBytes32: responseData.channelNameBytes32,
          owner: walletAddress,
        };
      },
    );
  }

  /**
   * Deprecate a schema
   */
  async deprecateSchema(
    deprecateDto: DeprecateSchemaDto,
    privateKey: string,
  ): Promise<DeprecateSchemaResponseDto> {
    this.validator.validateSchemaInput(deprecateDto, [
      'schemaId',
      'channelName',
    ]);

    return this.executeTransactionOperation(
      'deprecateSchema',
      deprecateDto.schemaId,
      deprecateDto.channelName,
      privateKey,
      async (contract, walletAddress) => {
        this.logger.debug(`Chamando deprecateSchema com:`, {
          schemaId: deprecateDto.schemaId,
          channelName: deprecateDto.channelName,
        });

        const schemaUpdate = {
          schemaIdBytes32: this.toBytes32(deprecateDto.schemaId),
          channelNameBytes32: this.toBytes32(deprecateDto.channelName),
        };

        const tx = await contract.deprecateSchema(
          schemaUpdate.schemaIdBytes32,
          schemaUpdate.channelNameBytes32,
        );

        return {
          tx,
          additionalData: {
            dto: deprecateDto,
            schemaIdBytes32: schemaUpdate.schemaIdBytes32,
            channelNameBytes32: schemaUpdate.channelNameBytes32,
            walletAddress,
            contract,
          },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        schemaIdBytes32: additionalData.schemaIdBytes32,
        deprecatedVersion:
          this.eventParser.parseVersion(receipt, 'SchemaStatusChanged') || 1,
        channelName: additionalData.dto.channelName,
        channelNameBytes32: additionalData.channelNameBytes32,
        owner: walletAddress,
      }),
    );
  }

  /**
   * Update a schema
   */
  async updateSchema(
    updateDto: UpdateSchemaDto,
    privateKey: string,
  ): Promise<UpdateSchemaResponseDto> {
    this.validator.validateSchemaInput(updateDto, [
      'schemaId',
      'channelName',
      'newDataHash',
    ]);

    return this.executeTransactionOperation(
      'updateSchema',
      updateDto.schemaId,
      updateDto.channelName,
      privateKey,
      async (contract, walletAddress) => {
        const schemaUpdateInput: SchemaUpdateInputContract = {
          id: this.toBytes32(updateDto.schemaId),
          newDataHash: updateDto.newDataHash.startsWith('0x')
            ? updateDto.newDataHash
            : `0x${updateDto.newDataHash}`,
          channelName: this.toBytes32(updateDto.channelName),
          description: updateDto.description || '',
        };

        this.logger.debug(`Chamando updateSchema com:`, {
          schemaId: updateDto.schemaId,
          channelName: updateDto.channelName,
          newDataHash: updateDto.newDataHash,
        });

        const tx = await contract.updateSchema(schemaUpdateInput);

        return {
          tx,
          additionalData: {
            dto: updateDto,
            schemaIdBytes32: schemaUpdateInput.id,
            channelNameBytes32: schemaUpdateInput.channelName,
            walletAddress,
          },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        schemaIdBytes32: additionalData.schemaIdBytes32,
        previousVersion:
          this.eventParser.parsePreviousVersion(receipt, 'SchemaUpdated') || 1,
        newVersion:
          this.eventParser.parseNewVersion(receipt, 'SchemaUpdated') || 2,
        channelName: additionalData.dto.channelName,
        channelNameBytes32: additionalData.channelNameBytes32,
        owner: walletAddress,
      }),
    );
  }

  /**
   * Inactivate a specific version of a schema
   */
  async inactivateSchema(
    inactivateDto: InactivateSchemaDto,
    privateKey: string,
  ): Promise<InactivateSchemaResponseDto> {
    this.validator.validateSchemaInput(inactivateDto, [
      'schemaId',
      'channelName',
    ]);
    this.validator.validateVersion(inactivateDto.version);

    return this.executeTransactionOperation(
      'inactivateSchema',
      inactivateDto.schemaId,
      inactivateDto.channelName,
      privateKey,
      async (contract, walletAddress) => {
        this.logger.debug(`Chamando inactivateSchema com:`, {
          schemaId: inactivateDto.schemaId,
          version: inactivateDto.version,
          channelName: inactivateDto.channelName,
        });

        const schemaInactivate = {
          schemaIdBytes32: this.toBytes32(inactivateDto.schemaId),
          channelNameBytes32: this.toBytes32(inactivateDto.channelName),
        };

        const tx = await contract.inactivateSchema(
          schemaInactivate.schemaIdBytes32,
          inactivateDto.version,
          schemaInactivate.channelNameBytes32,
        );

        return {
          tx,
          additionalData: {
            dto: inactivateDto,
            schemaIdBytes32: schemaInactivate.schemaIdBytes32,
            channelNameBytes32: schemaInactivate.channelNameBytes32,
            walletAddress,
          },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        schemaIdBytes32: additionalData.schemaIdBytes32,
        inactivatedVersion: additionalData.dto.version,
        previousStatus: SchemaStatusConverter.enumToString(
          this.eventParser.parsePreviousStatus(
            receipt,
            'SchemaStatusChanged',
          ) || SchemaStatus.ACTIVE,
        ),
        channelName: additionalData.dto.channelName,
        channelNameBytes32: additionalData.channelNameBytes32,
        owner: walletAddress,
      }),
    );
  }

  /**
   * Set the status of a specific version of a schema
   */
  async setSchemaStatus(
    setSchemaStatusDto: SetSchemaStatusDto,
    privateKey: string,
  ): Promise<SetSchemaStatusResponseDto> {
    this.validator.validateSchemaInput(setSchemaStatusDto, [
      'schemaId',
      'channelName',
    ]);
    this.validator.validateVersion(setSchemaStatusDto.version);

    return this.executeTransactionOperation(
      'setSchemaStatus',
      setSchemaStatusDto.schemaId,
      setSchemaStatusDto.channelName,
      privateKey,
      async (contract, walletAddress) => {
        const statusEnum = SchemaStatusConverter.stringToEnum(
          String(setSchemaStatusDto.status),
        );

        this.logger.debug(`Chamando setSchemaStatus com:`, {
          schemaId: setSchemaStatusDto.schemaId,
          version: setSchemaStatusDto.version,
          channelName: setSchemaStatusDto.channelName,
          statusEnum,
        });

        const schemaSetStatus = {
          schemaIdBytes32: this.toBytes32(setSchemaStatusDto.schemaId),
          channelNameBytes32: this.toBytes32(setSchemaStatusDto.channelName),
        };

        const tx = await contract.setSchemaStatus(
          schemaSetStatus.schemaIdBytes32,
          setSchemaStatusDto.version,
          schemaSetStatus.channelNameBytes32,
          statusEnum,
        );

        return {
          tx,
          additionalData: {
            dto: setSchemaStatusDto,
            schemaIdBytes32: schemaSetStatus.schemaIdBytes32,
            channelNameBytes32: schemaSetStatus.channelNameBytes32,
            walletAddress,
          },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        schemaIdBytes32: additionalData.schemaIdBytes32,
        inactivatedVersion: additionalData.dto.version,
        previousStatus: SchemaStatusConverter.enumToString(
          this.eventParser.parsePreviousStatus(
            receipt,
            'SchemaStatusChanged',
          ) || SchemaStatus.ACTIVE,
        ),
        currentStatus: additionalData.dto.status,
        channelName: additionalData.dto.channelName,
        channelNameBytes32: additionalData.channelNameBytes32,
        owner: walletAddress,
      }),
    );
  }

  /**
   * Get schema by version
   */
  async getSchemaByVersion(
    getSchemaByVersionDto: GetSchemaByVersionDto,
  ): Promise<SchemaDto> {
    return this.executeViewOperation(
      'getSchemaByVersion',
      getSchemaByVersionDto.schemaId,
      getSchemaByVersionDto.channelName,
      async (contract) => {
        const getSchema = {
          schemaIdBytes32: this.toBytes32(getSchemaByVersionDto.schemaId),
          channelNameBytes32: this.toBytes32(getSchemaByVersionDto.channelName),
        };
        const result = await contract.getSchemaByVersion(
          getSchema.channelNameBytes32,
          getSchema.schemaIdBytes32,
          getSchemaByVersionDto.version,
        );
        return this.parseSchemaFromContract(
          result,
          getSchemaByVersionDto.schemaId,
          getSchemaByVersionDto.channelName,
        );
      },
    );
  }

  /**
   * Get active schema
   */
  async getActiveSchema(getSchemaDto: GetSchemaDto): Promise<SchemaDto> {
    return this.executeViewOperation(
      'getActiveSchema',
      getSchemaDto.schemaId,
      getSchemaDto.channelName,
      async (contract) => {
        const result = await contract.getActiveSchema(
          this.toBytes32(getSchemaDto.channelName),
          this.toBytes32(getSchemaDto.schemaId),
        );
        return this.parseSchemaFromContract(
          result,
          getSchemaDto.schemaId,
          getSchemaDto.channelName,
        );
      },
    );
  }

  /**
   * Get schema info
   */
  async getSchemaInfo(
    getSchemaDto: GetSchemaDto,
  ): Promise<SchemaInfoResponseDto> {
    return this.executeViewOperation(
      'getSchemaInfo',
      getSchemaDto.schemaId,
      getSchemaDto.channelName,
      async (contract) => {
        const getSchema = {
          schemaIdBytes32: this.toBytes32(getSchemaDto.schemaId),
          channelNameBytes32: this.toBytes32(getSchemaDto.channelName),
        };
        const result = await contract.getSchemaInfo(
          getSchema.channelNameBytes32,
          getSchema.schemaIdBytes32,
        );

        return {
          schemaId: getSchemaDto.schemaId,
          schemaIdBytes32: getSchema.schemaIdBytes32,
          channelName: getSchemaDto.channelName,
          channelNameBytes32: getSchema.channelNameBytes32,
          latestVersion: Number(result.latestVersion),
          activeVersion: Number(result.activeVersion),
        };
      },
    );
  }

  /**
   * Parse schema from contract response
   */
  private parseSchemaFromContract(
    contractResult: any,
    schemaId?: string,
    channelName?: string,
  ): SchemaDto {
    const statusNumber = Number(contractResult.status) as SchemaStatus;

    return {
      schemaId: schemaId ?? contractResult.id,
      schemaIdBytes32: contractResult.id,
      name: contractResult.name,
      version: Number(contractResult.version),
      dataHash: contractResult.dataHash,
      owner: contractResult.owner,
      channelName: channelName ?? contractResult.channelName,
      channelNameBytes32: contractResult.channelName,
      status: SchemaStatus[statusNumber],
      createdAt: Number(contractResult.createdAt),
      updatedAt: Number(contractResult.updatedAt),
      description: contractResult.description,
    };
  }

  /**
   * Save schema metadata to database after blockchain confirmation
   */
  private async saveSchemaMetadata(data: {
    schemaId: string;
    schemaIdBytes32: string;
    schemaName: string;
    channelName: string;
    channelNameBytes32: string;
    transactionHash: string;
    walletAddress: string;
  }): Promise<void> {
    try {
      await this.prismaService.schemaMetadata.create({
        data: {
          schemaId: data.schemaId,
          schemaIdBytes32: data.schemaIdBytes32,
          schemaName: data.schemaName,
          channelName: data.channelName,
          channelNameBytes32: data.channelNameBytes32,
          transactionHash: data.transactionHash,
          walletAddress: data.walletAddress,
        },
      });

      this.logger.log(
        `Metadados salvos no banco para schema ${data.schemaId} no canal ${data.channelName}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao salvar metadados do schema ${data.schemaId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Parse genérico de eventos da blockchain
   */
  private parseContractEvent<T>(
    receipt: any,
    eventName: string,
    contract: ethers.Contract,
  ): T | null {
    try {
      for (const log of receipt.logs || []) {
        try {
          const parsedLog = contract.interface.parseLog(log);

          if (parsedLog?.name === eventName) {
            return parsedLog.args as T;
          }
        } catch {
          continue;
        }
      }
      return null;
    } catch (error) {
      this.logger.warn(`Erro ao parsear evento ${eventName}: ${error.message}`);
      return null;
    }
  }
}
