import { Injectable, BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import {
  CreateSchemaDto,
  CreateSchemaResponseDto,
  DeprecateSchemaDto,
  UpdateSchemaDto,
  InactivateSchemaDto,
  SchemaDto,
  SchemaInfoResponseDto,
  GetSchemaDto,
  SchemaInputContract,
  SchemaStatus,
  DeprecateSchemaResponseDto,
  UpdateSchemaResponseDto,
  SchemaUpdateInputContract,
  InactivateSchemaResponseDto,
  GetSchemaByVersionDto,
  GetLatestSchemaResponseDto,
  GetSchemaVersionsResponseDto,
  SetSchemaStatusDto,
  SetSchemaStatusResponseDto,
  SchemaStatusConverter,
} from './dto/schema-registry.dto';
import { BlockchainProvider } from '@/blockchain/providers/blockchain.provider';
import { ABIName } from '@/blockchain/abis';
import { BaseContractService } from '@/blockchain/services/base-contract.service';

@Injectable()
export class SchemaRegistryService extends BaseContractService {
  private readonly SCHEMA_REGISTRY_BYTES32: string;

  constructor(blockchainProvider: BlockchainProvider) {
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
    this.validateSchemaInput(createDto, [
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
          additionalData: { dto: createDto },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        name: additionalData.dto.name,
        version: this.parseEventVersion(receipt, 'SchemaCreated') || 1,
        channelName: additionalData.dto.channelName,
        owner: walletAddress,
      }),
    );
  }

  /**
   * Deprecate a schema
   */
  async deprecateSchema(
    deprecateDto: DeprecateSchemaDto,
    privateKey: string,
  ): Promise<DeprecateSchemaResponseDto> {
    this.validateSchemaInput(deprecateDto, ['schemaId', 'channelName']);

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

        const tx = await contract.deprecateSchema(
          this.toBytes32(deprecateDto.schemaId),
          this.toBytes32(deprecateDto.channelName),
        );

        return {
          tx,
          additionalData: { dto: deprecateDto },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        deprecatedVersion:
          this.parseEventVersion(receipt, 'SchemaStatusChanged') || 1,
        channelName: additionalData.dto.channelName,
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
    this.validateSchemaInput(updateDto, [
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
          additionalData: { dto: updateDto },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        previousVersion:
          this.parseEventPreviousVersion(receipt, 'SchemaUpdated') || 1,
        newVersion: this.parseEventNewVersion(receipt, 'SchemaUpdated') || 2,
        channelName: additionalData.dto.channelName,
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
    this.validateSchemaInput(inactivateDto, ['schemaId', 'channelName']);
    this.validateVersion(inactivateDto.version);

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

        const tx = await contract.inactivateSchema(
          this.toBytes32(inactivateDto.schemaId),
          inactivateDto.version,
          this.toBytes32(inactivateDto.channelName),
        );

        return {
          tx,
          additionalData: { dto: inactivateDto },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        inactivatedVersion: additionalData.dto.version,
        previousStatus: SchemaStatusConverter.enumToString(
          this.parseEventPreviousStatus(receipt, 'SchemaStatusChanged') ||
            SchemaStatus.ACTIVE,
        ),
        channelName: additionalData.dto.channelName,
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
    this.validateSchemaInput(setSchemaStatusDto, ['schemaId', 'channelName']);
    this.validateVersion(setSchemaStatusDto.version);

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

        const tx = await contract.setSchemaStatus(
          this.toBytes32(setSchemaStatusDto.schemaId),
          setSchemaStatusDto.version,
          this.toBytes32(setSchemaStatusDto.channelName),
          statusEnum,
        );

        return {
          tx,
          additionalData: { dto: setSchemaStatusDto },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        inactivatedVersion: additionalData.dto.version,
        previousStatus: SchemaStatusConverter.enumToString(
          this.parseEventPreviousStatus(receipt, 'SchemaStatusChanged') ||
            SchemaStatus.ACTIVE,
        ),
        currentStatus: additionalData.dto.status,
        channelName: additionalData.dto.channelName,
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
        const result = await contract.getSchemaByVersion(
          this.toBytes32(getSchemaByVersionDto.channelName),
          this.toBytes32(getSchemaByVersionDto.schemaId),
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
   * Get latest schema
   */
  async getLatestSchema(
    getSchemaDto: GetSchemaDto,
  ): Promise<GetLatestSchemaResponseDto> {
    return this.executeViewOperation(
      'getLatestSchema',
      getSchemaDto.schemaId,
      getSchemaDto.channelName,
      async (contract) => {
        const channelNameBytes32 = this.toBytes32(getSchemaDto.channelName);
        const schemaIdBytes32 = this.toBytes32(getSchemaDto.schemaId);

        const result = await contract.getLatestSchema(
          channelNameBytes32,
          schemaIdBytes32,
        );
        const schema = this.parseSchemaFromContract(
          result,
          getSchemaDto.schemaId,
          getSchemaDto.channelName,
        );

        // Verificar se esta é também a versão ativa
        let isActiveVersion = false;
        try {
          const activeResult = await contract.getActiveSchema(
            channelNameBytes32,
            schemaIdBytes32,
          );
          const activeSchema = this.parseSchemaFromContract(activeResult);
          isActiveVersion = schema.version === activeSchema.version;
        } catch {
          this.logger.debug('Não há versão ativa para este schema');
        }

        return { schema, isActiveVersion };
      },
    );
  }

  /**
   * Get schema versions
   */
  async getSchemaVersions(
    getSchemaDto: GetSchemaDto,
  ): Promise<GetSchemaVersionsResponseDto> {
    return this.executeViewOperation(
      'getSchemaVersions',
      getSchemaDto.schemaId,
      getSchemaDto.channelName,
      async (contract) => {
        const channelNameBytes32 = this.toBytes32(getSchemaDto.channelName);
        const schemaIdBytes32 = this.toBytes32(getSchemaDto.schemaId);

        // Obter todas as versões
        const result = await contract.getSchemaVersions(
          channelNameBytes32,
          schemaIdBytes32,
        );
        const versions: number[] = result.versions.map((v: any) => Number(v));
        const schemas: SchemaDto[] = result.schemas.map((schema: any) =>
          this.parseSchemaFromContract(schema),
        );

        // Obter informações adicionais do schema
        const infoResult = await contract.getSchemaInfo(
          channelNameBytes32,
          schemaIdBytes32,
        );
        const activeVersion = Number(infoResult.activeVersion);
        const latestVersion = Number(infoResult.latestVersion);

        return {
          schemaId: getSchemaDto.schemaId,
          channelName: getSchemaDto.channelName,
          versions,
          schemas,
          activeVersion,
          latestVersion,
          totalVersions: versions.length,
        };
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
        const result = await contract.getSchemaInfo(
          this.toBytes32(getSchemaDto.channelName),
          this.toBytes32(getSchemaDto.schemaId),
        );

        return {
          schemaId: getSchemaDto.schemaId,
          channelName: getSchemaDto.channelName,
          latestVersion: Number(result.latestVersion),
          activeVersion: Number(result.activeVersion),
          hasActiveVersion: result.hasActiveVersion,
          owner: result.owner,
          totalVersions: Number(result.totalVersions),
        };
      },
    );
  }

  /**
   * Execute generic schema operation
   */
  private async executeSchemaOperation<
    T extends {
      success: boolean;
      transactionHash: string;
      schemaId: string;
      name: string;
      channelName: string;
      version?: number;
      owner?: string;
      blockNumber?: number;
      gasUsed?: string;
    },
  >(
    operationName: string,
    schemaId: string,
    channelName: string,
    privateKey: string,
    operation: (contract: ethers.Contract) => Promise<{
      tx: ethers.ContractTransactionResponse;
      schemaId: string;
      name: string;
      channelName: string;
    }>,
  ): Promise<T> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para schema: ${schemaId} no canal: ${channelName}`,
    );

    try {
      const contract = await this.getContractInstance(privateKey);
      const walletAddress =
        await this.blockchainProvider.getWalletAddress(privateKey);

      const {
        tx,
        schemaId: responseSchemaId,
        name,
        channelName: responseChannelName,
      } = await operation(contract);

      this.logger.log(`Transação enviada: ${tx.hash}`);

      const receipt = await tx.wait();

      const schemaCreatedEvent = receipt?.logs?.find(
        (log) =>
          log.topics[0] ===
          ethers.id(
            'SchemaCreated(bytes32,string,uint256,address,bytes32,uint256)',
          ),
      );

      let eventCreatedVersion = 1; // default fallback

      if (schemaCreatedEvent && schemaCreatedEvent.data) {
        try {
          // Parse data: version, owner, channelName, timestamp (non-indexed fields)
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          const decoded = abiCoder.decode(
            ['uint256', 'address', 'bytes32', 'uint256'],
            schemaCreatedEvent.data,
          );
          eventCreatedVersion = Number(decoded[0]);
        } catch (decodeError) {
          this.logger.warn(
            'Error parsing SchemaCreated event:',
            decodeError.message,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${operationName}] Concluído em ${duration}ms - TxHash: ${tx.hash}`,
      );

      return {
        ...this.buildTransactionResponse(tx, receipt, {
          schemaId: responseSchemaId,
          name,
          version: eventCreatedVersion,
          channelName: responseChannelName,
          owner: walletAddress,
        }),
      } as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${operationName}] Falhou após ${duration}ms:`,
        error.message,
      );
      return this.handleContractError(
        error,
        operationName,
        schemaId,
        channelName,
      );
    }
  }

  /**
   * Execute deprecate schema operation
   */
  private async executeDeprecateSchemaOperation(
    operationName: string,
    schemaId: string,
    channelName: string,
    privateKey: string,
    operation: (contract: ethers.Contract) => Promise<{
      tx: ethers.ContractTransactionResponse;
      schemaId: string;
      channelName: string;
    }>,
  ): Promise<DeprecateSchemaResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para schema: ${schemaId} no canal: ${channelName}`,
    );

    try {
      const contract = await this.getContractInstance(privateKey);
      const walletAddress =
        await this.blockchainProvider.getWalletAddress(privateKey);

      const {
        tx,
        schemaId: responseSchemaId,
        channelName: responseChannelName,
      } = await operation(contract);

      this.logger.log(`Transação enviada: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      // Extrair informações do evento SchemaStatusChanged
      const schemaDeprecatedEvent = receipt?.logs?.find(
        (log) =>
          log.topics[0] ===
          ethers.id(
            'SchemaStatusChanged(bytes32,uint256,bytes32,uint8,uint8,address,uint256)',
          ),
      );

      let deprecatedVersion = 0;

      if (schemaDeprecatedEvent) {
        try {
          // Decodificar o evento SchemaStatusChanged
          deprecatedVersion = Number(BigInt(schemaDeprecatedEvent.topics[2]));
        } catch (decodeError) {
          this.logger.warn(
            'Erro ao decodificar evento SchemaStatusChanged:',
            decodeError.message,
          );
          deprecatedVersion = 1;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${operationName}] Concluído em ${duration}ms - TxHash: ${tx.hash}`,
      );

      return {
        success: true,
        transactionHash: tx.hash,
        schemaId: responseSchemaId,
        deprecatedVersion,
        channelName: responseChannelName,
        owner: walletAddress,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${operationName}] Falhou após ${duration}ms:`,
        error.message,
      );
      return this.handleContractError(
        error,
        operationName,
        schemaId,
        channelName,
      );
    }
  }

  /**
   * Execute update schema operation
   */
  private async executeUpdateSchemaOperation(
    operationName: string,
    schemaId: string,
    channelName: string,
    privateKey: string,
    operation: (contract: ethers.Contract) => Promise<{
      tx: ethers.ContractTransactionResponse;
      schemaId: string;
      channelName: string;
    }>,
  ): Promise<UpdateSchemaResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para schema: ${schemaId} no canal: ${channelName}`,
    );

    try {
      const contract = await this.getContractInstance(privateKey);
      const walletAddress =
        await this.blockchainProvider.getWalletAddress(privateKey);

      const {
        tx,
        schemaId: responseSchemaId,
        channelName: responseChannelName,
      } = await operation(contract);

      this.logger.log(`Transação enviada: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      // Extrair informações do evento SchemaUpdated
      const schemaUpdatedEvent = receipt?.logs?.find(
        (log) =>
          log.topics[0] ===
          ethers.id(
            'SchemaUpdated(bytes32,uint256,uint256,address,bytes32,uint256)',
          ),
      );

      let previousVersion = 0;
      let newVersion = 0;
      let eventOwner: string | undefined = undefined;

      if (schemaUpdatedEvent) {
        try {
          previousVersion = Number(schemaUpdatedEvent.topics[2]);
          newVersion = Number(schemaUpdatedEvent.topics[3]);

          // Decodificar o evento SchemaUpdated
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          const decoded = abiCoder.decode(
            ['address', 'bytes32', 'uint256'],
            schemaUpdatedEvent.data,
          );
          eventOwner = decoded[0];
        } catch (decodeError) {
          this.logger.warn(
            'Erro ao decodificar evento SchemaUpdated:',
            decodeError.message,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${operationName}] Concluído em ${duration}ms - TxHash: ${tx.hash}`,
      );

      return {
        success: true,
        transactionHash: tx.hash,
        schemaId: responseSchemaId,
        previousVersion,
        newVersion,
        channelName: responseChannelName,
        owner: eventOwner ?? walletAddress,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${operationName}] Falhou após ${duration}ms:`,
        error.message,
      );
      return this.handleContractError(
        error,
        operationName,
        schemaId,
        channelName,
      );
    }
  }

  /**
   * Execute inactivate schema operation
   */
  private async executeInactivateSchemaOperation(
    operationName: string,
    schemaId: string,
    channelName: string,
    version: number,
    privateKey: string,
    operation: (contract: ethers.Contract) => Promise<{
      tx: ethers.ContractTransactionResponse;
      schemaId: string;
      version: number;
      channelName: string;
    }>,
  ): Promise<InactivateSchemaResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para schema: ${schemaId} versão: ${version} no canal: ${channelName}`,
    );

    try {
      const contract = await this.getContractInstance(privateKey);
      const walletAddress =
        await this.blockchainProvider.getWalletAddress(privateKey);

      const {
        tx,
        schemaId: responseSchemaId,
        version: responseVersion,
        channelName: responseChannelName,
      } = await operation(contract);

      this.logger.log(`Transação enviada: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      // Extrair informações do evento SchemaInactivated
      const schemaInactivatedEvent = receipt?.logs?.find(
        (log) =>
          log.topics[0] ===
          ethers.id(
            'SchemaStatusChanged(bytes32,uint256,bytes32,uint8,uint8,address,uint256)',
          ),
      );

      let previousStatus = SchemaStatus.ACTIVE; // Default

      if (schemaInactivatedEvent && schemaInactivatedEvent.data) {
        try {
          // Decodificar o evento SchemaInactivated
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          const decoded = abiCoder.decode(
            ['uint8', 'uint8', 'address', 'uint256'],
            schemaInactivatedEvent.data,
          );
          previousStatus = Number(decoded[0]) as SchemaStatus;
        } catch (decodeError) {
          this.logger.warn(
            'Erro ao decodificar evento SchemaStatusChanged:',
            decodeError.message,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${operationName}] Concluído em ${duration}ms - TxHash: ${tx.hash}`,
      );

      return {
        success: true,
        transactionHash: tx.hash,
        schemaId: responseSchemaId,
        inactivatedVersion: responseVersion,
        previousStatus: SchemaStatusConverter.enumToString(previousStatus),
        channelName: responseChannelName,
        owner: walletAddress,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${operationName}] Falhou após ${duration}ms:`,
        error.message,
      );
      return this.handleContractError(
        error,
        operationName,
        schemaId,
        channelName,
      );
    }
  }

  /**
   * Set schema status operation
   */
  private async executeSetSchemaStatusOperation(
    operationName: string,
    schemaId: string,
    channelName: string,
    version: number,
    privateKey: string,
    operation: (contract: ethers.Contract) => Promise<{
      tx: ethers.ContractTransactionResponse;
      schemaId: string;
      version: number;
      channelName: string;
      status: SchemaStatus;
    }>,
  ): Promise<SetSchemaStatusResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para schema: ${schemaId} versão: ${version} no canal: ${channelName}`,
    );

    try {
      const contract = await this.getContractInstance(privateKey);
      const walletAddress =
        await this.blockchainProvider.getWalletAddress(privateKey);

      const {
        tx,
        schemaId: responseSchemaId,
        version: responseVersion,
        channelName: responseChannelName,
        status: responseStatus,
      } = await operation(contract);

      this.logger.log(`Transação enviada: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      // Extrair informações do evento SchemaStatusChanged
      const statusChangedEvent = receipt?.logs?.find(
        (log) =>
          log.topics[0] ===
          ethers.id(
            'SchemaStatusChanged(bytes32,uint256,bytes32,uint8,uint8,address,uint256)',
          ),
      );

      let previousStatus = SchemaStatus.ACTIVE; // Default

      if (statusChangedEvent && statusChangedEvent.data) {
        try {
          // Decodificar o evento SchemaStatusChanged
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          const decoded = abiCoder.decode(
            ['uint8', 'uint8', 'address', 'uint256'],
            statusChangedEvent.data,
          );
          previousStatus = Number(decoded[0]) as SchemaStatus;
        } catch (decodeError) {
          this.logger.warn(
            'Erro ao decodificar evento SchemaStatusChanged:',
            decodeError.message,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${operationName}] Concluído em ${duration}ms - TxHash: ${tx.hash}`,
      );

      return {
        success: true,
        transactionHash: tx.hash,
        schemaId: responseSchemaId,
        inactivatedVersion: responseVersion,
        previousStatus: SchemaStatusConverter.enumToString(previousStatus),
        currentStatus: responseStatus,
        channelName: responseChannelName,
        owner: walletAddress,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${operationName}] Falhou após ${duration}ms:`,
        error.message,
      );
      return this.handleContractError(
        error,
        operationName,
        schemaId,
        channelName,
      );
    }
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
      id: schemaId ?? this.fromBytes32(contractResult.id),
      name: contractResult.name,
      version: Number(contractResult.version),
      dataHash: contractResult.dataHash,
      owner: contractResult.owner,
      channelName: channelName ?? this.fromBytes32(contractResult.channelName),
      status: SchemaStatus[statusNumber],
      createdAt: Number(contractResult.createdAt),
      updatedAt: Number(contractResult.updatedAt),
      description: contractResult.description,
    };
  }

  private validateSchemaInput(dto: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!dto[field]?.trim?.() && dto[field] !== 0) {
        throw new BadRequestException(`${field} é obrigatório`);
      }
    }
  }

  private parseEventVersion(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,string,uint256,address,bytes32,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const decoded = abiCoder.decode(
          ['uint256', 'address', 'bytes32', 'uint256'],
          event.data,
        );
        return Number(decoded[0]);
      } catch (error) {
        this.logger.warn(`Erro ao parsear evento ${eventName}:`, error.message);
      }
    }
    return null;
  }

  private parseEventPreviousVersion(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,uint256,uint256,address,bytes32,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.topics?.[2]) {
      try {
        return Number(event.topics[2]);
      } catch (error) {
        this.logger.warn(`Erro ao parsear versão anterior:`, error.message);
      }
    }
    return null;
  }

  private parseEventNewVersion(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,uint256,uint256,address,bytes32,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.topics?.[3]) {
      try {
        return Number(event.topics[3]);
      } catch (error) {
        this.logger.warn(`Erro ao parsear nova versão:`, error.message);
      }
    }
    return null;
  }

  private validateVersion(version: number): void {
    if (!version || version < 1) {
      throw new BadRequestException('Versão deve ser maior que 0');
    }
  }

  private parseEventPreviousStatus(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): SchemaStatus | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,uint256,bytes32,uint8,uint8,address,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const decoded = abiCoder.decode(
          ['uint8', 'uint8', 'address', 'uint256'],
          event.data,
        );
        return Number(decoded[0]) as SchemaStatus;
      } catch (error) {
        this.logger.warn(`Erro ao parsear evento ${eventName}:`, error.message);
      }
    }
    return null;
  }
}
