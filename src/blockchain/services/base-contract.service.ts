import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import { BlockchainProvider } from '../providers/blockchain.provider';
import { ABIName } from '../abis';
import { ContractErrorHandler } from '../../common/utils/contract-error.handler';

/**
 * Base service for all contract interactions
 */
@Injectable()
export abstract class BaseContractService {
  protected readonly logger = new Logger(this.constructor.name);

  protected static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  protected static readonly MAX_CACHE_SIZE = 100;

  // Shared cache across all services
  private static readonly contractAddressCache = new Map<
    string,
    {
      address: string;
      timestamp: number;
      network: string;
    }
  >();

  private static readonly cacheTimestamps = new Map<string, number>();

  constructor(protected readonly blockchainProvider: BlockchainProvider) {}

  // =============================================================
  //                    CACHE MANAGEMENT
  // =============================================================

  protected async getContract(
    contractNameBytes32: string,
    contractTypeName: ABIName,
    privateKey: string,
  ): Promise<ethers.Contract> {
    const network = await this.blockchainProvider.provider.getNetwork();
    const cacheKey = `${contractTypeName}_${network.chainId}`;
    const now = Date.now();

    let cached = BaseContractService.contractAddressCache.get(cacheKey);
    const isExpired =
      !cached || now - cached.timestamp > BaseContractService.CACHE_TTL;

    if (!cached || isExpired) {
      const addressDiscoveryContract = this.blockchainProvider.getContract(
        'AddressDiscovery',
        privateKey,
      );

      const contractAddress =
        await addressDiscoveryContract.getContractAddress(contractNameBytes32);

      if (!contractAddress) {
        throw new Error(`Erro ao obter endereço do ${contractTypeName}`);
      }

      const newCacheEntry = {
        address: contractAddress,
        timestamp: now,
        network: network.name,
      };

      BaseContractService.contractAddressCache.set(cacheKey, newCacheEntry);

      if (
        BaseContractService.contractAddressCache.size >
        BaseContractService.MAX_CACHE_SIZE
      ) {
        this.clearOldestCacheEntry();
      }

      this.logger.debug(
        `Endereço ${contractTypeName} cached: ${contractAddress}`,
      );
      cached = newCacheEntry;
    }

    return this.blockchainProvider.getContract(
      contractTypeName,
      privateKey,
      cached.address,
    );
  }

  private clearOldestCacheEntry(): void {
    const timestamps = [...BaseContractService.cacheTimestamps.entries()];
    const oldestKey = timestamps.sort(([, a], [, b]) => a - b)[0]?.[0];

    if (oldestKey) {
      BaseContractService.contractAddressCache.delete(oldestKey);
      BaseContractService.cacheTimestamps.delete(oldestKey);
    }
  }

  public clearAddressCache(): void {
    const beforeSize = BaseContractService.contractAddressCache.size;
    BaseContractService.contractAddressCache.clear();
    BaseContractService.cacheTimestamps.clear();
    this.logger.log(`Cache limpo: ${beforeSize} entradas removidas`);
  }

  public getCacheStats(): {
    size: number;
    maxSize: number;
    keys: string[];
    oldestEntry?: string;
    newestEntry?: string;
  } {
    const timestamps = [...BaseContractService.cacheTimestamps.entries()];
    const sorted = timestamps.sort(([, a], [, b]) => a - b);

    return {
      size: BaseContractService.contractAddressCache.size,
      maxSize: BaseContractService.MAX_CACHE_SIZE,
      keys: Array.from(BaseContractService.contractAddressCache.keys()),
      oldestEntry: sorted[0]?.[0],
      newestEntry: sorted[sorted.length - 1]?.[0],
    };
  }

  protected async executeTransactionOperation<
    TResult extends {
      success: boolean;
      transactionHash: string;
      blockNumber?: number;
      gasUsed?: string;
    },
  >(
    operationName: string,
    entityId: string,
    channelName: string,
    privateKey: string,
    operation: (
      contract: ethers.Contract,
      walletAddress: string,
    ) => Promise<{
      tx: ethers.ContractTransactionResponse;
      additionalData?: any;
    }>,
    responseBuilder: (
      tx: ethers.ContractTransactionResponse,
      receipt: ethers.TransactionReceipt | null,
      walletAddress: string,
      additionalData?: any,
    ) => TResult,
  ): Promise<TResult> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para ${entityId} no canal: ${channelName}`,
    );

    try {
      const contract = await this.getContractInstance(privateKey);
      const walletAddress =
        await this.blockchainProvider.getWalletAddress(privateKey);

      const { tx, additionalData } = await operation(contract, walletAddress);

      this.logger.log(`Transação enviada: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${operationName}] Concluído em ${duration}ms - TxHash: ${tx.hash}`,
      );

      return responseBuilder(tx, receipt, walletAddress, additionalData);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${operationName}] Falhou após ${duration}ms:`,
        error.message,
      );
      return this.handleContractError(
        error,
        operationName,
        entityId,
        channelName,
      );
    }
  }

  /**
   * Execute view operation (read-only) with error handling
   */
  protected async executeViewOperation<TResult>(
    operationName: string,
    entityId: string,
    channelName: string,
    operation: (contract: ethers.Contract) => Promise<TResult>,
  ): Promise<TResult> {
    this.logger.log(
      `Executando ${operationName} para ${entityId} no canal ${channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract = await this.getContractInstance(tempPrivateKey);

      return await operation(contract);
    } catch (error) {
      this.logger.error(
        `Erro ao executar ${operationName}: ${error.message}`,
        error.stack,
      );
      return this.handleContractViewError(error, operationName);
    }
  }

  // =============================================================
  //                    ERROR HANDLING
  // =============================================================

  /**
   * Handle contract transaction errors
   */
  protected handleContractError(
    error: any,
    operationName: string,
    entityId: string,
    channelName: string,
  ): never {
    this.logger.error(
      `Erro ao executar ${operationName} para ${entityId} no canal ${channelName}: ${error.message}`,
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
   * Handle contract view operation errors
   */
  protected handleContractViewError(error: any, operationName: string): never {
    const customError = ContractErrorHandler.parseContractError(error);
    if (customError) {
      throw customError;
    }

    if (error.code === 'CALL_EXCEPTION') {
      throw new BadRequestException(
        `Erro na operação ${operationName}: Dados não encontrados ou parâmetros inválidos.`,
      );
    }

    throw error;
  }

  // =============================================================
  //                    UTILITY METHODS
  // =============================================================

  protected toBytes32(value: string): string {
    if (!value?.trim()) {
      throw new BadRequestException(
        'Valor não pode ser vazio para conversão bytes32',
      );
    }
    return this.blockchainProvider.stringToBytes32(value.trim());
  }

  protected fromBytes32(value: string): string {
    if (!value) {
      throw new BadRequestException('Valor bytes32 inválido para conversão');
    }
    return this.blockchainProvider.bytes32ToString(value);
  }
  protected buildTransactionResponse(
    tx: ethers.ContractTransactionResponse,
    receipt: ethers.TransactionReceipt | null,
    additionalFields: any = {},
  ): {
    success: boolean;
    transactionHash: string;
    blockNumber?: number;
    gasUsed?: string;
  } {
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString(),
      ...additionalFields,
    };
  }

  // =============================================================
  //                    ABSTRACT METHODS
  // =============================================================

  protected async getContractInstance(
    privateKey: string,
  ): Promise<ethers.Contract> {
    return this.getContract(
      this.getContractNameBytes32(),
      this.getContractABIName(),
      privateKey,
    );
  }

  protected abstract getContractNameBytes32(): string;
  protected abstract getContractABIName(): ABIName;
}
