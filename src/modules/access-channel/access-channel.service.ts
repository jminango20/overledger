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
  NumberResponseDto,
  NumberMembersInChannelResponseDto,
  ChannelMemberDto,
  ChannelMemberResponseDto,
  ChannelMembersDto,
  ChannelMembersResponseDto,
  CheckMemberDto,
  MembershipCheckResponseDto,
  GetMembersDto,
  MembersResponseDto,
  PaginationDto,
  ChannelsResponseDto,
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
  async desactivateChannel(
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
   * Add a member to a channel
   */
  async addChannelMember(
    addMemberDto: ChannelMemberDto,
    privateKey: string,
  ): Promise<ChannelMemberResponseDto> {
    return this.executeMemberChannelOperation(
      'addChannelMember',
      addMemberDto.channelName,
      addMemberDto.addressMember,
      privateKey,
      async (contract, channelNameBytes32, addressMember) => {
        const tx = await contract.addChannelMember(
          channelNameBytes32,
          addressMember,
        );
        return {
          tx,
          channelName: addMemberDto.channelName,
          addressMember: addMemberDto.addressMember,
        };
      },
    );
  }

  /**
   * Remove a member to a channel
   */
  async removeChannelMember(
    removeMemberDto: ChannelMemberDto,
    privateKey: string,
  ): Promise<ChannelMemberResponseDto> {
    return this.executeMemberChannelOperation(
      'removeChannelMember',
      removeMemberDto.channelName,
      removeMemberDto.addressMember,
      privateKey,
      async (contract, channelNameBytes32, addressMember) => {
        const tx = await contract.removeChannelMember(
          channelNameBytes32,
          addressMember,
        );
        return {
          tx,
          channelName: removeMemberDto.channelName,
          addressMember: removeMemberDto.addressMember,
        };
      },
    );
  }

  /**
   * Add multiple members to a channel
   */
  async addChannelMembers(
    addMembersDto: ChannelMembersDto,
    privateKey: string,
  ): Promise<ChannelMembersResponseDto> {
    if (!addMembersDto.memberAddresses?.length) {
      throw new BadRequestException('Lista de membros é obrigatória');
    }

    return this.executeBatchMemberOperation(
      'addChannelMembers',
      addMembersDto.channelName,
      addMembersDto.memberAddresses,
      privateKey,
      async (contract, channelNameBytes32, memberAddresses) => {
        const tx = await contract.addChannelMembers(
          channelNameBytes32,
          memberAddresses,
        );
        return {
          tx,
          channelName: addMembersDto.channelName,
          memberAddresses,
        };
      },
    );
  }

  /**
   * Remove multiple members from a channel
   */
  async removeChannelMembers(
    removeMembersDto: ChannelMembersDto,
    privateKey: string,
  ): Promise<ChannelMembersResponseDto> {
    if (!removeMembersDto.memberAddresses?.length) {
      throw new BadRequestException('Lista de membros é obrigatória');
    }

    return this.executeBatchMemberOperation(
      'removeChannelMembers',
      removeMembersDto.channelName,
      removeMembersDto.memberAddresses,
      privateKey,
      async (contract, channelNameBytes32, memberAddresses) => {
        const tx = await contract.removeChannelMembers(
          channelNameBytes32,
          memberAddresses,
        );
        return {
          tx,
          channelName: removeMembersDto.channelName,
          memberAddresses,
        };
      },
    );
  }

  /**
   * Check if address is channel member
   */
  async isChannelMember(
    checkMemberDto: CheckMemberDto,
  ): Promise<MembershipCheckResponseDto> {
    this.logger.log(
      `Verificando se ${checkMemberDto.addressMember} é membro do canal ${checkMemberDto.channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract =
        await this.getAccessChannelManagerContract(tempPrivateKey);

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        checkMemberDto.channelName,
      );

      const isMember = await contract.isChannelMember(
        channelNameBytes32,
        checkMemberDto.addressMember,
      );

      return {
        success: true,
        transactionHash: isMember.transactionHash,
        isMember,
        channelName: checkMemberDto.channelName,
        memberAddress: checkMemberDto.addressMember,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao verificar membresía: ${error.message}`,
        error.stack,
      );

      const customError = ContractErrorHandler.parseContractError(error);
      if (customError) {
        throw customError;
      }

      if (error.code === 'CALL_EXCEPTION') {
        throw new BadRequestException(
          'Erro na chamada do contrato. Verifique se o canal existe e está ativo.',
        );
      }

      throw error;
    }
  }

  /**
   * Check multiple addresses membership
   */
  async areChannelMembers(
    channelName: string,
    memberAddresses: string[],
  ): Promise<boolean[]> {
    this.logger.log(
      `Verificando membresía de ${memberAddresses.length} endereços no canal ${channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract =
        await this.getAccessChannelManagerContract(tempPrivateKey);

      const channelNameBytes32 =
        this.blockchainProvider.stringToBytes32(channelName);

      const results = await contract.areChannelMembers(
        channelNameBytes32,
        memberAddresses,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Erro ao verificar membresías múltiplas: ${error.message}`,
        error.stack,
      );

      const customError = ContractErrorHandler.parseContractError(error);
      if (customError) {
        throw customError;
      }

      throw error;
    }
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

      const contract =
        await this.getAccessChannelManagerContract(tempPrivateKey);

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
   * Get the number of channels
   */
  async getChannelCount(): Promise<NumberResponseDto> {
    this.logger.log('Buscando o número de canais');

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;

      const contract =
        await this.getAccessChannelManagerContract(tempPrivateKey);

      const result = await contract.getChannelCount();

      return {
        number: Number(result),
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
   * Get the number of members in channel
   */
  async getChannelMemberCount(
    channelNameDto: ChannelNameDto,
  ): Promise<NumberMembersInChannelResponseDto> {
    this.logger.log(
      `Buscando o número de membros do canal ${channelNameDto.channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;

      const contract =
        await this.getAccessChannelManagerContract(tempPrivateKey);

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        channelNameDto.channelName,
      );

      const result = await contract.getChannelMemberCount(channelNameBytes32);

      return {
        success: true,
        transactionHash: result.transactionHash,
        channelName: channelNameDto.channelName,
        memberCount: Number(result),
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
   * Get channel members with pagination
   */
  async getChannelMembersPaginated(
    getMembersDto: GetMembersDto,
  ): Promise<MembersResponseDto> {
    this.logger.log(
      `Buscando membros do canal ${getMembersDto.channelName} - Página: ${getMembersDto.page}, Tamanho: ${getMembersDto.pageSize}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract =
        await this.getAccessChannelManagerContract(tempPrivateKey);

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        getMembersDto.channelName,
      );

      const result = await contract.getChannelMembersPaginated(
        channelNameBytes32,
        getMembersDto.page || 1,
        getMembersDto.pageSize || 50,
      );

      return {
        success: true,
        transactionHash: result.transactionHash,
        members: result.members,
        totalMembers: Number(result.totalMembers),
        totalPages: Number(result.totalPages),
        hasNextPage: result.hasNextPage,
        currentPage: getMembersDto.page || 1,
        channelName: getMembersDto.channelName,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar membros paginados: ${error.message}`,
        error.stack,
      );

      const customError = ContractErrorHandler.parseContractError(error);
      if (customError) {
        throw customError;
      }

      throw error;
    }
  }

  /**
   * Get all channels with pagination
   */
  async getAllChannelsPaginated(
    paginationDto: PaginationDto,
  ): Promise<ChannelsResponseDto> {
    this.logger.log(
      `Buscando todos os canais - Página: ${paginationDto.page}, Tamanho: ${paginationDto.pageSize}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract =
        await this.getAccessChannelManagerContract(tempPrivateKey);

      const result = await contract.getAllChannelsPaginated(
        paginationDto.page || 1,
        paginationDto.pageSize || 50,
      );

      const channelNames = result.channels.map((channelBytes32: string) => {
        return channelBytes32;
      });

      return {
        channels: channelNames,
        totalChannels: Number(result.totalChannels),
        totalPages: Number(result.totalPages),
        hasNextPage: result.hasNextPage,
        currentPage: paginationDto.page || 1,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar canais paginados: ${error.message}`,
        error.stack,
      );

      const customError = ContractErrorHandler.parseContractError(error);
      if (customError) {
        throw customError;
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
   * Execute generic channel member operation
   */
  private async executeMemberChannelOperation<
    T extends {
      success: boolean;
      transactionHash: string;
      channelName: string;
      addressMember: string;
      blockNumber?: number;
      gasUsed?: string;
    },
  >(
    operationName: string,
    channelName: string,
    addressMember: string,
    privateKey: string,
    operation: (
      contract: ethers.Contract,
      channelNameBytes32: string,
      addressMember: string,
    ) => Promise<{
      tx: ethers.ContractTransactionResponse;
      channelName: string;
      addressMember: string;
    }>,
  ): Promise<T> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para canal: ${channelName} e membro: ${addressMember}`,
    );

    try {
      const contract = await this.getAccessChannelManagerContract(privateKey);

      const channelNameBytes32 =
        this.blockchainProvider.stringToBytes32(channelName);

      const { tx, channelName: responseChannelName } = await operation(
        contract,
        channelNameBytes32,
        addressMember,
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
        addressMember: addressMember,
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
   * Execute batch member operation
   */
  private async executeBatchMemberOperation<
    T extends {
      success: boolean;
      transactionHash: string;
      channelName: string;
      addressMembers: string[];
      addressCount?: number;
      blockNumber?: number;
      gasUsed?: string;
    },
  >(
    operationName: string,
    channelName: string,
    memberAddresses: string[],
    privateKey: string,
    operation: (
      contract: ethers.Contract,
      channelNameBytes32: string,
      memberAddresses: string[],
    ) => Promise<{
      tx: ethers.ContractTransactionResponse;
      channelName: string;
      memberAddresses: string[];
    }>,
  ): Promise<T> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para canal: ${channelName} com ${memberAddresses.length} membros`,
    );

    try {
      const contract = await this.getAccessChannelManagerContract(privateKey);

      const channelNameBytes32 =
        this.blockchainProvider.stringToBytes32(channelName);

      const {
        tx,
        channelName: responseChannelName,
        memberAddresses: responseMembers,
      } = await operation(contract, channelNameBytes32, memberAddresses);

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
        addressMembers: responseMembers,
        addressCount: responseMembers.length,
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
