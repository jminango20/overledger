import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import {
  CreateSchemaDto,
  CreateSchemaResponseDto,
  SchemaDto,
  SchemaInfoResponseDto,
  GetSchemaDto,
  SchemaInputContract,
  SchemaStatus,
} from './dto/schema-registry.dto';
import { BlockchainProvider } from '../../blockchain/providers/blockchain.provider';
import { ContractErrorHandler } from '../../common/utils/contract-error.handler';

@Injectable()
export class SchemaRegistryService {
  private readonly logger = new Logger(SchemaRegistryService.name);

  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100;
  private readonly cacheTimestamps = new Map<string, number>();
  private readonly contractAddressCache = new Map<string, string>();

  constructor(private readonly blockchainProvider: BlockchainProvider) {
    this.SCHEMA_REGISTRY_BYTES32 =
      this.blockchainProvider.stringToBytes32('SCHEMA_REGISTRY');
  }

  private readonly SCHEMA_REGISTRY_BYTES32: string;

  /**
   * Create a new schema
   */
  async createSchema(
    createDto: CreateSchemaDto,
    privateKey: string,
  ): Promise<CreateSchemaResponseDto> {
    if (!createDto.schemaId?.trim()) {
      throw new BadRequestException('ID do schema é obrigatório');
    }

    if (!createDto.name?.trim()) {
      throw new BadRequestException('Nome do schema é obrigatório');
    }

    if (!createDto.channelName?.trim()) {
      throw new BadRequestException('Nome do canal é obrigatório');
    }

    if (!createDto.dataHash?.trim()) {
      throw new BadRequestException('Hash dos dados é obrigatório');
    }

    return this.executeSchemaOperation(
      'createSchema',
      createDto.schemaId,
      createDto.channelName,
      privateKey,
      async (contract) => {
        // Preparar o struct SchemaInput para o contrato
        const schemaInput: SchemaInputContract = {
          id: this.blockchainProvider.stringToBytes32(createDto.schemaId),
          name: createDto.name,
          dataHash: createDto.dataHash.startsWith('0x')
            ? createDto.dataHash
            : `0x${createDto.dataHash}`,
          channelName: this.blockchainProvider.stringToBytes32(
            createDto.channelName,
          ),
          description: createDto.description || '',
        };

        this.logger.debug(`Chamando createSchema com:`, {
          schemaId: createDto.schemaId,
          name: createDto.name,
          channelName: createDto.channelName,
          dataHash: createDto.dataHash,
        });

        const tx = await contract.createSchema(schemaInput);

        return {
          tx,
          schemaId: createDto.schemaId,
          name: createDto.name,
          channelName: createDto.channelName,
        };
      },
    );
  }

  /**
   * Get active schema
   */
  async getActiveSchema(getSchemaDto: GetSchemaDto, privateKey: string,): Promise<SchemaDto> {
    this.logger.log(
      `Buscando schema ativo: ${getSchemaDto.schemaId} no canal ${getSchemaDto.channelName}`,
    );

    try {
      const contract = await this.getSchemaRegistryContract(privateKey);

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        getSchemaDto.channelName,
      );
      const schemaIdBytes32 = this.blockchainProvider.stringToBytes32(
        getSchemaDto.schemaId,
      );

      const result = await contract.getActiveSchema(
        channelNameBytes32,
        schemaIdBytes32,
      );

      return this.parseSchemaFromContract(result);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar schema ativo: ${error.message}`,
        error.stack,
      );

      const customError = ContractErrorHandler.parseContractError(error);
      if (customError) {
        throw customError;
      }

      if (error.code === 'CALL_EXCEPTION') {
        throw new BadRequestException(
          'Erro na chamada do contrato. Verifique se o schema existe e está ativo no canal.',
        );
      }

      throw error;
    }
  }

  /**
   * Get schema info
   */
  async getSchemaInfo(
    getSchemaDto: GetSchemaDto,
    privateKey: string,
  ): Promise<SchemaInfoResponseDto> {
    this.logger.log(
      `Buscando informações do schema: ${getSchemaDto.schemaId} no canal ${getSchemaDto.channelName}`,
    );

    try {
      const contract = await this.getSchemaRegistryContract(privateKey);

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        getSchemaDto.channelName,
      );
      const schemaIdBytes32 = this.blockchainProvider.stringToBytes32(
        getSchemaDto.schemaId,
      );

      const result = await contract.getSchemaInfo(
        channelNameBytes32,
        schemaIdBytes32,
      );

      this.logger.log(
        `Informações do schema ${getSchemaDto.schemaId} obtidas com sucesso`,
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
    } catch (error) {
      this.logger.error(
        `Erro ao buscar informações do schema: ${error.message}`,
        error.stack,
      );

      const customError = ContractErrorHandler.parseContractError(error);
      if (customError) {
        throw customError;
      }

      if (error.code === 'CALL_EXCEPTION') {
        throw new BadRequestException(
          'Erro na chamada do contrato. Verifique se o schema existe.',
        );
      }

      throw error;
    }
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
      const contract = await this.getSchemaRegistryContract(privateKey);
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
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${operationName}] Concluído em ${duration}ms - TxHash: ${tx.hash}`,
      );

      return {
        success: true,
        transactionHash: tx.hash,
        schemaId: responseSchemaId,
        name,
        version: 1, // Para createSchema sempre é 1
        channelName: responseChannelName,
        owner: walletAddress,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
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
   * Get contract address from blockchain
   */
  private async getSchemaRegistryContract(
    privateKey: string,
  ): Promise<ethers.Contract> {
    const cacheKey = privateKey.slice(0, 10);
    const now = Date.now();

    const cacheTime = this.cacheTimestamps.get(cacheKey);
    const isExpired =
      !cacheTime || now - cacheTime > SchemaRegistryService.CACHE_TTL;

    let contractAddress = this.contractAddressCache.get(cacheKey);

    if (!contractAddress || isExpired) {
      const addressDiscoveryContract = this.blockchainProvider.getContract(
        'AddressDiscovery',
        privateKey,
      );

      const discoveredAddress =
        await addressDiscoveryContract.getContractAddress(
          this.SCHEMA_REGISTRY_BYTES32,
        );

      if (!discoveredAddress) {
        throw new Error('SchemaRegistry contract address not found');
      }

      contractAddress = discoveredAddress;

      this.contractAddressCache.set(cacheKey, contractAddress as string);
      this.cacheTimestamps.set(cacheKey, now);

      if (
        this.contractAddressCache.size > SchemaRegistryService.MAX_CACHE_SIZE
      ) {
        this.clearOldestCacheEntry();
      }

      this.logger.debug(`Endereço SchemaRegistry cached: ${contractAddress}`);
    }

    return this.blockchainProvider.getContract(
      'SchemaRegistry',
      privateKey,
      contractAddress,
    );
  }

  /**
   * Parse schema from contract response
   */
  private parseSchemaFromContract(contractResult: any): SchemaDto {
    return {
      id: this.blockchainProvider.bytes32ToString(contractResult.id),
      name: contractResult.name,
      version: Number(contractResult.version),
      dataHash: contractResult.dataHash,
      owner: contractResult.owner,
      channelName: this.blockchainProvider.bytes32ToString(
        contractResult.channelName,
      ),
      status: Number(contractResult.status) as SchemaStatus,
      createdAt: Number(contractResult.createdAt),
      updatedAt: Number(contractResult.updatedAt),
      description: contractResult.description,
    };
  }

  /**
   * Handler errors from contract
   */
  private handleContractError(
    error: any,
    operationName: string,
    schemaId: string,
    channelName: string,
  ): never {
    this.logger.error(
      `Erro ao executar ${operationName} para schema ${schemaId} no canal ${channelName}: ${error.message}`,
      error.stack,
    );

    const customError = ContractErrorHandler.parseContractError(error);
    if (customError) {
      throw customError;
    }

    if (error.code === 'CALL_EXCEPTION') {
      throw new BadRequestException(
        'Erro na chamada do contrato. Verifique os parâmetros.',
      );
    }

    if (error.code === 'NETWORK_ERROR') {
      throw new BadRequestException(
        'Erro de rede. Tente novamente em alguns instantes.',
      );
    }

    throw error;
  }

  /**
   * Clean address cache
   */
  public clearAddressCache(): void {
    const beforeSize = this.contractAddressCache.size;
    this.contractAddressCache.clear();
    this.cacheTimestamps.clear();
    this.logger.log(`Cache limpo: ${beforeSize} entradas removidas`);
  }

  private clearOldestCacheEntry(): void {
    const oldestKey = [...this.cacheTimestamps.entries()].sort(
      ([, a], [, b]) => a - b,
    )[0]?.[0];

    if (oldestKey) {
      this.contractAddressCache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }
  }

  public getCacheStats(): {
    size: number;
    maxSize: number;
    keys: string[];
    oldestEntry?: string;
    newestEntry?: string;
  } {
    const timestamps = [...this.cacheTimestamps.entries()];
    const sorted = timestamps.sort(([, a], [, b]) => a - b);

    return {
      size: this.contractAddressCache.size,
      maxSize: SchemaRegistryService.MAX_CACHE_SIZE,
      keys: Array.from(this.contractAddressCache.keys()),
      oldestEntry: sorted[0]?.[0],
      newestEntry: sorted[sorted.length - 1]?.[0],
    };
  }
}
