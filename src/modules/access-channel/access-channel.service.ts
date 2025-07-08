import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import {
  CreateChannelDto,
  CreateChannelResponseDto,
  ActivateChannelDto,
  ActivateChannelResponseDto,
  DeactivateChannelDto,
  DeactivateChannelResponseDto,
  ChannelNameDto,
  ChannelInfoResponseDto,
} from './dto';
import { BlockchainProvider } from '../../blockchain/providers/blockchain.provider';
import { ContractErrorHandler } from '../../common/utils/contract-error.handler';

@Injectable()
export class AccessChannelService {
  private readonly logger = new Logger(AccessChannelService.name);

  private static readonly CACHE_TTL = 5 * 60 * 1000;
  private static readonly MAX_CACHE_SIZE = 100;
  private readonly cacheTimestamps = new Map<string, number>();
  private readonly contractAddressCache = new Map<string, string>();

  constructor(private readonly blockchainProvider: BlockchainProvider) {
    this.ACCESS_CHANNEL_MANAGER_BYTES32 =
      this.blockchainProvider.stringToBytes32('ACCESS_CHANNEL_MANAGER');
  }

  private readonly ACCESS_CHANNEL_MANAGER_BYTES32: string;

  /**
   * Create a new channel
   */
  async createChannel(
    createDto: CreateChannelDto,
    privateKey: string,
  ): Promise<CreateChannelResponseDto> {
    if (!createDto.channelName?.trim()) {
      throw new BadRequestException('Nome do canal é obrigatório');
    }
    return this.executeChannelOperation(
      'createChannel',
      createDto.channelName,
      privateKey,
      async (contract, channelNameBytes32) => {
        const tx = await contract.createChannel(channelNameBytes32);
        return { tx, channelName: createDto.channelName };
      },
    );
  }

  /**
   * Activate a channel
   */
  async activateChannel(
    activateChannelDto: ActivateChannelDto,
    privateKey: string,
  ): Promise<ActivateChannelResponseDto> {
    return this.executeChannelOperation(
      'activateChannel',
      activateChannelDto.channelName,
      privateKey,
      async (contract, channelNameBytes32) => {
        const tx = await contract.activateChannel(channelNameBytes32);
        return { tx, channelName: activateChannelDto.channelName };
      },
    );
  }

  /**
   * Desactivate a channel
   */
  async deactivateChannel(
    deactivateChannelDto: DeactivateChannelDto,
    privateKey: string,
  ): Promise<DeactivateChannelResponseDto> {
    return this.executeChannelOperation(
      'deactivateChannel',
      deactivateChannelDto.channelName,
      privateKey,
      async (contract, channelNameBytes32) => {
        const tx = await contract.desactivateChannel(channelNameBytes32);
        return { tx, channelName: deactivateChannelDto.channelName };
      },
    );
  }

  /**
   * Get channel info
   */
  async getChannelInfo(
    channelNameDto: ChannelNameDto,
  ): Promise<ChannelInfoResponseDto> {
    this.logger.log(
      `Buscando informações do canal: ${channelNameDto.channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;

      // Obter contrato com a chave privada do usuário
      const addressDiscoveryContract = this.blockchainProvider.getContract(
        'AddressDiscovery',
        tempPrivateKey,
      );

      const contractNameBytes32 = this.blockchainProvider.stringToBytes32(
        'ACCESS_CHANNEL_MANAGER',
      );

      const contractAddress =
        await addressDiscoveryContract.getContractAddress(contractNameBytes32);

      const contract = this.blockchainProvider.getContract(
        'AccessChannelManager',
        tempPrivateKey,
        contractAddress,
      );

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        channelNameDto.channelName,
      );

      const result = await contract.getChannelInfo(channelNameBytes32);

      this.logger.log(
        `Informações do canal ${channelNameDto.channelName} obtidas com sucesso`,
      );

      return {
        channelName: channelNameDto.channelName,
        exists: result[0],
        isActive: result[1],
        creator: result[2],
        memberCount: Number(result[3]),
        createdAt: Number(result[4]),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar informações do canal: ${error.message}`,
        error.stack,
      );

      const customError = ContractErrorHandler.parseContractError(error);

      if (customError) {
        throw customError;
      }

      // Fallback para erros genéricos
      if (error.code === 'CALL_EXCEPTION') {
        throw new BadRequestException(
          'Erro na chamada do contrato. Verifique se o canal existe.',
        );
      }

      throw error;
    }
  }

  /**
   * Execute generic channel operation
   */
  private async executeChannelOperation<
    T extends {
      success: boolean;
      transactionHash: string;
      channelName: string;
      blockNumber?: number;
      gasUsed?: string;
    },
  >(
    operationName: string,
    channelName: string,
    privateKey: string,
    operation: (
      contract: ethers.Contract,
      channelNameBytes32: string,
    ) => Promise<{
      tx: ethers.ContractTransactionResponse;
      channelName: string;
    }>,
  ): Promise<T> {
    const startTime = Date.now();
    this.logger.log(`[${operationName}] Iniciando para canal: ${channelName}`);

    try {
      const contract = await this.getAccessChannelManagerContract(privateKey);

      const channelNameBytes32 =
        this.blockchainProvider.stringToBytes32(channelName);

      const { tx, channelName: responseChannelName } = await operation(
        contract,
        channelNameBytes32,
      );

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
        channelName: responseChannelName,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      } as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${operationName}] Falhou após ${duration}ms:`,
        error.message,
      );
      return this.handleContractError(error, operationName, channelName);
    }
  }

  /**
   * Get contract address from blockchain
   */
  private async getAccessChannelManagerContract(
    privateKey: string,
  ): Promise<ethers.Contract> {
    const cacheKey = privateKey.slice(0, 10);
    const now = Date.now();

    const cacheTime = this.cacheTimestamps.get(cacheKey);
    const isExpired =
      !cacheTime || now - cacheTime > AccessChannelService.CACHE_TTL;

    let contractAddress = this.contractAddressCache.get(cacheKey);

    if (!contractAddress || isExpired) {
      const addressDiscoveryContract = this.blockchainProvider.getContract(
        'AddressDiscovery',
        privateKey,
      );

      const discoveredAddress =
        await addressDiscoveryContract.getContractAddress(
          this.ACCESS_CHANNEL_MANAGER_BYTES32,
        );

      if (!discoveredAddress) {
        throw new Error('Contract address not found');
      }

      contractAddress = discoveredAddress;

      this.contractAddressCache.set(cacheKey, contractAddress as string);

      this.logger.debug(
        `Endereço AccessChannelManager cached: ${contractAddress}`,
      );

      this.contractAddressCache.set(cacheKey, contractAddress as string);
      this.cacheTimestamps.set(cacheKey, now);

      if (
        this.contractAddressCache.size > AccessChannelService.MAX_CACHE_SIZE
      ) {
        this.clearOldestCacheEntry();
      }

      this.logger.debug(
        `Endereço AccessChannelManager cached: ${contractAddress}`,
      );
    }

    return this.blockchainProvider.getContract(
      'AccessChannelManager',
      privateKey,
      contractAddress,
    );
  }

  /**
   * Handler errors from contract
   */
  private handleContractError(
    error: any,
    operationName: string,
    channelName: string,
  ): never {
    this.logger.error(
      `Erro ao executar ${operationName} no canal ${channelName}: ${error.message}`,
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
      maxSize: AccessChannelService.MAX_CACHE_SIZE,
      keys: Array.from(this.contractAddressCache.keys()),
      oldestEntry: sorted[0]?.[0],
      newestEntry: sorted[sorted.length - 1]?.[0],
    };
  }
}
