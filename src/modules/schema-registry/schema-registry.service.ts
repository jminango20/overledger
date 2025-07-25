import { Injectable } from '@nestjs/common';
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
import { SchemaEventParser } from './services/schema-event-parser.service';
import { SchemaValidator } from './services/schema-validator.service';

@Injectable()
export class SchemaRegistryService extends BaseContractService {
  private readonly SCHEMA_REGISTRY_BYTES32: string;

  constructor(
    blockchainProvider: BlockchainProvider,
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
          additionalData: { dto: createDto },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        name: additionalData.dto.name,
        version: this.eventParser.parseVersion(receipt, 'SchemaCreated') || 1,
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
          this.eventParser.parseVersion(receipt, 'SchemaStatusChanged') || 1,
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
          additionalData: { dto: updateDto },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        schemaId: additionalData.dto.schemaId,
        previousVersion:
          this.eventParser.parsePreviousVersion(receipt, 'SchemaUpdated') || 1,
        newVersion:
          this.eventParser.parseNewVersion(receipt, 'SchemaUpdated') || 2,
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
          this.eventParser.parsePreviousStatus(
            receipt,
            'SchemaStatusChanged',
          ) || SchemaStatus.ACTIVE,
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
          this.eventParser.parsePreviousStatus(
            receipt,
            'SchemaStatusChanged',
          ) || SchemaStatus.ACTIVE,
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
}
