import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ethers } from 'ethers';
import {
  CreateProcessDto,
  CreateProcessResponseDto,
  UpdateProcessStatusDto,
  UpdateProcessStatusResponseDto,
  InactivateProcessDto,
  GetProcessDto,
  ProcessDto,
  ProcessValidationResponseDto,
  ProcessInputContract,
  ProcessStatus,
  ProcessAction,
  ProcessStatusConverter,
  ProcessActionConverter,
} from './dto/process-registry.dto';
import { BlockchainProvider } from '../../blockchain/providers/blockchain.provider';
import { ContractErrorHandler } from '../../common/utils/contract-error.handler';

@Injectable()
export class ProcessRegistryService {
  private readonly logger = new Logger(ProcessRegistryService.name);

  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100;
  private readonly cacheTimestamps = new Map<string, number>();
  private readonly contractAddressCache = new Map<
    string,
    {
      address: string;
      timestamp: number;
      network: string;
    }
  >();

  constructor(private readonly blockchainProvider: BlockchainProvider) {
    this.PROCESS_REGISTRY_BYTES32 =
      this.blockchainProvider.stringToBytes32('PROCESS_REGISTRY');
  }

  private readonly PROCESS_REGISTRY_BYTES32: string;

  // =============================================================
  //                    MAIN OPERATIONS
  // =============================================================

  /**
   * Create a new process
   */
  async createProcess(
    createDto: CreateProcessDto,
    privateKey: string,
  ): Promise<CreateProcessResponseDto> {
    this.validateCreateProcessInput(createDto);

    return this.executeProcessOperation(
      'createProcess',
      createDto.processId,
      createDto.channelName,
      privateKey,
      async (contract) => {
        // Prepare ProcessInput struct for contract
        const processInput: ProcessInputContract = {
          processId: this.blockchainProvider.stringToBytes32(
            createDto.processId,
          ),
          natureId: this.blockchainProvider.stringToBytes32(createDto.natureId),
          stageId: this.blockchainProvider.stringToBytes32(createDto.stageId),
          schemas: createDto.schemas.map((schema) => ({
            schemaId: this.blockchainProvider.stringToBytes32(schema.schemaId),
            version: schema.version,
          })),
          action: createDto.action,
          description: createDto.description || '',
          channelName: this.blockchainProvider.stringToBytes32(
            createDto.channelName,
          ),
        };

        this.logger.debug('Calling createProcess with:', {
          processId: createDto.processId,
          natureId: createDto.natureId,
          stageId: createDto.stageId,
          schemasCount: createDto.schemas.length,
          action: ProcessActionConverter.enumToString(createDto.action),
        });

        const tx = await contract.createProcess(processInput);

        return {
          tx,
          processId: createDto.processId,
          natureId: createDto.natureId,
          stageId: createDto.stageId,
          channelName: createDto.channelName,
          action: createDto.action,
        };
      },
    );
  }

  /**
   * Update process status
   */
  async updateProcessStatus(
    updateDto: UpdateProcessStatusDto,
    privateKey: string,
  ): Promise<UpdateProcessStatusResponseDto> {
    this.validateUpdateProcessStatusInput(updateDto);

    return this.executeUpdateProcessStatusOperation(
      'setProcessStatus',
      updateDto,
      privateKey,
      async (contract) => {
        const processIdBytes32 = this.blockchainProvider.stringToBytes32(
          updateDto.processId,
        );
        const natureIdBytes32 = this.blockchainProvider.stringToBytes32(
          updateDto.natureId,
        );
        const stageIdBytes32 = this.blockchainProvider.stringToBytes32(
          updateDto.stageId,
        );
        const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
          updateDto.channelName,
        );

        this.logger.debug('Chamando setProcessStatus com:', {
          channelName: updateDto.channelName,
          processId: updateDto.processId,
          natureId: updateDto.natureId,
          stageId: updateDto.stageId,
          newStatus: ProcessStatusConverter.enumToString(updateDto.newStatus),
        });

        const tx = await contract.setProcessStatus(
          channelNameBytes32,
          processIdBytes32,
          natureIdBytes32,
          stageIdBytes32,
          updateDto.newStatus,
        );

        return { tx, updateDto };
      },
    );
  }

  /**
   * Inactivate a process
   */
  async inactivateProcess(
    inactivateDto: InactivateProcessDto,
    privateKey: string,
  ): Promise<UpdateProcessStatusResponseDto> {
    this.validateInactivateProcessInput(inactivateDto);

    const updateDto: UpdateProcessStatusDto = {
      ...inactivateDto,
      newStatus: ProcessStatus.INACTIVE,
    };

    return this.executeUpdateProcessStatusOperation(
      'inactivateProcess',
      updateDto,
      privateKey,
      async (contract) => {
        const processIdBytes32 = this.blockchainProvider.stringToBytes32(
          inactivateDto.processId,
        );
        const natureIdBytes32 = this.blockchainProvider.stringToBytes32(
          inactivateDto.natureId,
        );
        const stageIdBytes32 = this.blockchainProvider.stringToBytes32(
          inactivateDto.stageId,
        );
        const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
          inactivateDto.channelName,
        );

        this.logger.debug('Chamando inactivateProcess com:', {
          channelName: inactivateDto.channelName,
          processId: inactivateDto.processId,
          natureId: inactivateDto.natureId,
          stageId: inactivateDto.stageId,
        });

        const tx = await contract.inactivateProcess(
          channelNameBytes32,
          processIdBytes32,
          natureIdBytes32,
          stageIdBytes32,
        );

        return { tx, updateDto };
      },
    );
  }

  // =============================================================
  //                    VIEW FUNCTIONS
  // =============================================================

  /**
   * Get process details
   */
  async getProcess(getProcessDto: GetProcessDto): Promise<ProcessDto> {
    this.logger.log(
      `Buscando processo ${getProcessDto.processId} (natureza: ${getProcessDto.natureId}, estágio: ${getProcessDto.stageId}) no canal ${getProcessDto.channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract = await this.getProcessRegistryContract(tempPrivateKey);

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.channelName,
      );
      const processIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.processId,
      );
      const natureIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.natureId,
      );
      const stageIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.stageId,
      );

      const result = await contract.getProcess(
        channelNameBytes32,
        processIdBytes32,
        natureIdBytes32,
        stageIdBytes32,
      );

      return this.parseProcessFromContract(result);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar processo: ${error.message}`,
        error.stack,
      );
      return this.handleContractViewError(error, 'getProcess');
    }
  }
  /**
   * Get process status
   */
  async getProcessStatus(
    getProcessDto: GetProcessDto,
  ): Promise<{ status: string }> {
    this.logger.log(
      `Buscando status do processo ${getProcessDto.processId} no canal ${getProcessDto.channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract = await this.getProcessRegistryContract(tempPrivateKey);

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.channelName,
      );
      const processIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.processId,
      );
      const natureIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.natureId,
      );
      const stageIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.stageId,
      );

      const status = await contract.getProcessStatus(
        channelNameBytes32,
        processIdBytes32,
        natureIdBytes32,
        stageIdBytes32,
      );

      return {
        status: ProcessStatusConverter.enumToString(Number(status)),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar status do processo: ${error.message}`,
        error.stack,
      );
      return this.handleContractViewError(error, 'getProcessStatus');
    }
  }

  /**
   * Get processes by process ID
   */
  async getProcessesByProcessId(
    processId: string,
    channelName: string,
  ): Promise<ProcessDto[]> {
    this.logger.log(
      `Buscando processos com ID: ${processId} no canal: ${channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract = await this.getProcessRegistryContract(tempPrivateKey);

      const processIdBytes32 =
        this.blockchainProvider.stringToBytes32(processId);
      const channelNameBytes32 =
        this.blockchainProvider.stringToBytes32(channelName);

      const result = await contract.getProcessesByProcessId(
        processIdBytes32,
        channelNameBytes32,
      );

      return result.map((process: any) =>
        this.parseProcessFromContract(process),
      );
    } catch (error) {
      this.logger.error(
        `Erro ao buscar processos: ${error.message}`,
        error.stack,
      );
      return this.handleContractViewError(error, 'getProcessesByProcessId');
    }
  }

  /**
   * Check if process is active
   */
  async isProcessActive(
    getProcessDto: GetProcessDto,
  ): Promise<{ isActive: boolean }> {
    this.logger.log(
      `Verificando se processo ${getProcessDto.processId} no canal ${getProcessDto.channelName} esta ativo`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract = await this.getProcessRegistryContract(tempPrivateKey);

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.channelName,
      );
      const processIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.processId,
      );
      const natureIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.natureId,
      );
      const stageIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.stageId,
      );

      const isActive = await contract.isProcessActive(
        channelNameBytes32,
        processIdBytes32,
        natureIdBytes32,
        stageIdBytes32,
      );

      return { isActive };
    } catch (error) {
      this.logger.error(
        `Erro ao verificar se processo esta ativo: ${error.message}`,
        error.stack,
      );
      return this.handleContractViewError(error, 'isProcessActive');
    }
  }

  /**
   * Validate process for submission
   */
  async validateProcessForSubmission(
    getProcessDto: GetProcessDto,
  ): Promise<ProcessValidationResponseDto> {
    this.logger.log(
      `Validando processo: ${getProcessDto.processId} no canal ${getProcessDto.channelName} para submissão`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract = await this.getProcessRegistryContract(tempPrivateKey);

      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.channelName,
      );
      const processIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.processId,
      );
      const natureIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.natureId,
      );
      const stageIdBytes32 = this.blockchainProvider.stringToBytes32(
        getProcessDto.stageId,
      );

      const result = await contract.validateProcessForSubmission(
        channelNameBytes32,
        processIdBytes32,
        natureIdBytes32,
        stageIdBytes32,
      );

      return {
        isValid: result.isValid,
        reason: result.reason || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao validar processo: ${error.message}`,
        error.stack,
      );
      return this.handleContractViewError(
        error,
        'validateProcessForSubmission',
      );
    }
  }

  // =============================================================
  //                    PRIVATE METHODS
  // =============================================================

  /**
   * Execute generic process operation
   */
  private async executeProcessOperation<
    T extends {
      success: boolean;
      transactionHash: string;
      processId: string;
      natureId: string;
      stageId: string;
      channelName: string;
      owner?: string;
      action?: string;
      blockNumber?: number;
      gasUsed?: string;
    },
  >(
    operationName: string,
    processId: string,
    channelName: string,
    privateKey: string,
    operation: (contract: ethers.Contract) => Promise<{
      tx: ethers.ContractTransactionResponse;
      processId: string;
      natureId: string;
      stageId: string;
      channelName: string;
      action: ProcessAction;
    }>,
  ): Promise<T> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para processo: ${processId} no canal: ${channelName}`,
    );

    try {
      const contract = await this.getProcessRegistryContract(privateKey);
      const walletAddress =
        await this.blockchainProvider.getWalletAddress(privateKey);

      const {
        tx,
        processId: responseProcessId,
        natureId,
        stageId,
        channelName: responseChannelName,
        action,
      } = await operation(contract);

      this.logger.log(`Transação enviada: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      // Parse ProcessCreated event
      const processCreatedEvent = receipt?.logs?.find(
        (log) =>
          log.topics[0] ===
          ethers.id(
            'ProcessCreated(bytes32,bytes32,bytes32,address,bytes32,uint8,uint256)',
          ),
      );

      // Parse event data if available
      if (processCreatedEvent && processCreatedEvent.data) {
        try {
          // Parse data: owner, channelName, action, timestamp (non-indexed)
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const decoded = abiCoder.decode(
            ['address', 'bytes32', 'uint8', 'uint256'],
            processCreatedEvent.data,
          );
          // Podríamos usar estos datos si necesitamos validar
        } catch (decodeError) {
          this.logger.warn(
            'Erro de parsing no evento ProcessCreated:',
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
        processId: responseProcessId,
        natureId,
        stageId,
        channelName: responseChannelName,
        owner: walletAddress,
        action: ProcessActionConverter.enumToString(action),
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
        processId,
        channelName,
      );
    }
  }

  /**
   * Execute update process status operation
   */
  private async executeUpdateProcessStatusOperation(
    operationName: string,
    updateDto: UpdateProcessStatusDto,
    privateKey: string,
    operation: (contract: ethers.Contract) => Promise<{
      tx: ethers.ContractTransactionResponse;
      updateDto: UpdateProcessStatusDto;
    }>,
  ): Promise<UpdateProcessStatusResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      `[${operationName}] Iniciando para processo: ${updateDto.processId} no canal: ${updateDto.channelName}`,
    );

    try {
      const contract = await this.getProcessRegistryContract(privateKey);
      const walletAddress =
        await this.blockchainProvider.getWalletAddress(privateKey);

      const { tx, updateDto: responseUpdateDto } = await operation(contract);

      this.logger.log(`Transação enviada: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      // Parse ProcessStatusChanged event
      const statusChangedEvent = receipt?.logs?.find(
        (log) =>
          log.topics[0] ===
          ethers.id(
            'ProcessStatusChanged(bytes32,bytes32,uint8,uint8,address,uint256)',
          ),
      );

      let previousStatus = ProcessStatus.ACTIVE; // default fallback

      if (statusChangedEvent && statusChangedEvent.data) {
        try {
          // topics: [signature, processId, channelName] (indexed)
          // data: [oldStatus, newStatus, updatedBy, timestamp] (non-indexed)
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          const decoded = abiCoder.decode(
            ['uint8', 'uint8', 'address', 'uint256'],
            statusChangedEvent.data,
          );
          previousStatus = Number(decoded[0]) as ProcessStatus;
        } catch (decodeError) {
          this.logger.warn(
            'Erro de parsing no evento ProcessStatusChanged:',
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
        processId: responseUpdateDto.processId,
        previousStatus: ProcessStatusConverter.enumToString(previousStatus),
        newStatus: ProcessStatusConverter.enumToString(
          responseUpdateDto.newStatus,
        ),
        channelName: responseUpdateDto.channelName,
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
        updateDto.processId,
        updateDto.channelName,
      );
    }
  }

  /**
   * Get ProcessRegistry contract with improved caching
   */
  private async getProcessRegistryContract(
    privateKey: string,
  ): Promise<ethers.Contract> {
    const network = await this.blockchainProvider.provider.getNetwork();
    const cacheKey = `process_registry_${network.chainId}`;
    const now = Date.now();

    let cached = this.contractAddressCache.get(cacheKey);
    const isExpired =
      !cached || now - cached.timestamp > ProcessRegistryService.CACHE_TTL;

    if (!cached || isExpired) {
      const addressDiscoveryContract = this.blockchainProvider.getContract(
        'AddressDiscovery',
        privateKey,
      );
      const contractAddress = await addressDiscoveryContract.getContractAddress(
        this.PROCESS_REGISTRY_BYTES32,
      );

      if (!contractAddress) {
        throw new Error('Erro ao obter endereço do ProcessRegistry');
      }

      const newCacheEntry = {
        address: contractAddress,
        timestamp: now,
        network: network.name,
      };

      this.contractAddressCache.set(cacheKey, newCacheEntry);

      if (
        this.contractAddressCache.size > ProcessRegistryService.MAX_CACHE_SIZE
      ) {
        this.clearOldestCacheEntry();
      }

      this.logger.debug(`Endereço ProcessRegistry cached: ${contractAddress}`);

      cached = newCacheEntry;
    }

    return this.blockchainProvider.getContract(
      'ProcessRegistry',
      privateKey,
      cached.address,
    );
  }

  /**
   * Parse process from contract response
   */
  private parseProcessFromContract(contractResult: any): ProcessDto {
    return {
      processId: this.blockchainProvider.bytes32ToString(
        contractResult.processId,
      ),
      natureId: this.blockchainProvider.bytes32ToString(
        contractResult.natureId,
      ),
      stageId: this.blockchainProvider.bytes32ToString(contractResult.stageId),
      schemas: contractResult.schemas.map((schema: any) => ({
        schemaId: this.blockchainProvider.bytes32ToString(schema.schemaId),
        version: Number(schema.version),
      })),
      action: ProcessActionConverter.enumToString(
        Number(contractResult.action),
      ),
      description: contractResult.description,
      owner: contractResult.owner,
      channelName: this.blockchainProvider.bytes32ToString(
        contractResult.channelName,
      ),
      status: ProcessStatusConverter.enumToString(
        Number(contractResult.status),
      ),
      createdAt: Number(contractResult.createdAt),
      lastUpdated: Number(contractResult.lastUpdated),
    };
  }

  // =============================================================
  //                    VALIDATION METHODS
  // =============================================================

  private validateCreateProcessInput(dto: CreateProcessDto): void {
    if (!dto.processId?.trim()) {
      throw new BadRequestException('Process ID é obrigatório');
    }
    if (!dto.natureId?.trim()) {
      throw new BadRequestException('Nature ID é obrigatório');
    }
    if (!dto.stageId?.trim()) {
      throw new BadRequestException('Stage ID é obrigatório');
    }
    if (!dto.channelName?.trim()) {
      throw new BadRequestException('Nome do canal é obrigatório');
    }
    if (dto.schemas.length > 10) {
      throw new BadRequestException(
        'Máximo de 10 schemas permitidos por processo',
      );
    }
  }

  private validateUpdateProcessStatusInput(dto: UpdateProcessStatusDto): void {
    if (!dto.processId?.trim()) {
      throw new BadRequestException('Process ID é obrigatório');
    }
    if (!dto.channelName?.trim()) {
      throw new BadRequestException('Nome do canal é obrigatório');
    }
    if (dto.newStatus === undefined || dto.newStatus === null) {
      throw new BadRequestException('Novo status é obrigatório');
    }
  }

  private validateInactivateProcessInput(dto: InactivateProcessDto): void {
    if (!dto.processId?.trim()) {
      throw new BadRequestException('Process ID é obrigatório');
    }
    if (!dto.channelName?.trim()) {
      throw new BadRequestException('Nome do canal é obrigatório');
    }
  }

  // =============================================================
  //                    ERROR HANDLING
  // =============================================================

  private handleContractError(
    error: any,
    operationName: string,
    processId: string,
    channelName: string,
  ): never {
    this.logger.error(
      `Erro ao executar ${operationName} para processo ${processId} no canal ${channelName}: ${error.message}`,
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

  private handleContractViewError(error: any, operationName: string): never {
    const customError = ContractErrorHandler.parseContractError(error);
    if (customError) {
      throw customError;
    }

    if (error.code === 'CALL_EXCEPTION') {
      throw new NotFoundException(
        `Erro na operação ${operationName}: Processo não encontrado ou parâmetros inválidos.`,
      );
    }

    throw error;
  }

  // =============================================================
  //                    CACHE MANAGEMENT
  // =============================================================

  private clearOldestCacheEntry(): void {
    const timestamps = [...this.cacheTimestamps.entries()];
    const oldestKey = timestamps.sort(([, a], [, b]) => a - b)[0]?.[0];

    if (oldestKey) {
      this.contractAddressCache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }
  }

  public clearAddressCache(): void {
    const beforeSize = this.contractAddressCache.size;
    this.contractAddressCache.clear();
    this.cacheTimestamps.clear();
    this.logger.log(`Cache limpo: ${beforeSize} entradas removidas`);
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
      maxSize: ProcessRegistryService.MAX_CACHE_SIZE,
      keys: Array.from(this.contractAddressCache.keys()),
      oldestEntry: sorted[0]?.[0],
      newestEntry: sorted[sorted.length - 1]?.[0],
    };
  }
}
