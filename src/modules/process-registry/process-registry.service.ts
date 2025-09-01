import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateProcessDto,
  CreateProcessResponseDto,
  UpdateProcessStatusDto,
  UpdateProcessStatusResponseDto,
  InactivateProcessDto,
  ProcessDto,
  GetProcessDto,
  ProcessInputContract,
  ProcessStatus,
  ProcessAction,
  ProcessValidationResponseDto,
  ProcessEnrichedDto,
} from './dto/process-registry.dto';
import { BlockchainProvider } from '@/blockchain/providers/blockchain.provider';
import { ABIName } from '@/blockchain/abis';
import { BaseContractService } from '@/blockchain/services/base-contract.service';
import { ProcessEventParser } from './services/process-event-parser.service';
import { ProcessValidator } from './services/process-validator.service';
import { ethers } from 'ethers';

@Injectable()
export class ProcessRegistryService extends BaseContractService {
  private readonly PROCESS_REGISTRY_BYTES32: string;

  constructor(
    blockchainProvider: BlockchainProvider,
    private readonly prismaService: PrismaService,
    private readonly eventParser: ProcessEventParser,
    private readonly validator: ProcessValidator,
  ) {
    super(blockchainProvider);
    this.PROCESS_REGISTRY_BYTES32 = this.toBytes32('PROCESS_REGISTRY');
  }

  protected getContractNameBytes32(): string {
    return this.PROCESS_REGISTRY_BYTES32;
  }

  protected getContractABIName(): ABIName {
    return 'ProcessRegistry';
  }

  /**
   * Create a new process
   */
  async createProcess(
    createDto: CreateProcessDto,
    privateKey: string,
  ): Promise<CreateProcessResponseDto> {
    this.validator.validateProcessInput(createDto, [
      'processId',
      'natureId',
      'stageId',
      'channelName',
      'action',
    ]);

    this.validator.validateSchemas(createDto.schemas, createDto.action);

    return this.executeTransactionOperation(
      'createProcess',
      createDto.processId,
      createDto.channelName,
      privateKey,
      async (contract, walletAddress) => {
        const processInput: ProcessInputContract = {
          processId: this.toBytes32(createDto.processId),
          natureId: this.toBytes32(createDto.natureId),
          stageId: this.toBytes32(createDto.stageId),
          schemas: createDto.schemas.map((schema) => ({
            schemaId: this.toBytes32(schema.schemaId),
            version: schema.version,
          })),
          action: createDto.action,
          description: createDto.description || '',
          channelName: this.toBytes32(createDto.channelName),
        };

        this.logger.debug(`Chamando createProcess com:`, {
          processId: createDto.processId,
          natureId: createDto.natureId,
          stageId: createDto.stageId,
          channelName: createDto.channelName,
          action: ProcessAction[createDto.action],
          schemasCount: createDto.schemas.length,
        });

        const tx = await contract.createProcess(processInput);
        return {
          tx,
          additionalData: {
            dto: createDto,
            processIdBytes32: processInput.processId,
            natureIdBytes32: processInput.natureId,
            stageIdBytes32: processInput.stageId,
            channelNameBytes32: processInput.channelName,
            walletAddress,
            contract,
          },
        };
      },
      (tx, receipt, walletAddress, additionalData) => {
        const eventData = this.parseContractEvent<{
          processId: string;
          natureId: string;
          stageId: string;
          owner: string;
          channelName: string;
          action: bigint;
          timestamp: bigint;
        }>(receipt, 'ProcessCreated', additionalData.contract);

        const responseData = {
          processIdBytes32: eventData
            ? this.fromBytes32(eventData.processId)
            : additionalData.processIdBytes32,
          natureIdBytes32: eventData
            ? this.fromBytes32(eventData.natureId)
            : additionalData.natureIdBytes32,
          stageIdBytes32: eventData
            ? this.fromBytes32(eventData.stageId)
            : additionalData.stageIdBytes32,
          channelNameBytes32: eventData
            ? this.fromBytes32(eventData.channelName)
            : additionalData.channelNameBytes32,
          owner: eventData?.owner || walletAddress,
          action: eventData
            ? Number(eventData.action)
            : additionalData.dto.action,
        };

        // Salvar metadados no banco com dados do evento
        this.saveProcessMetadata({
          processId: additionalData.dto.processId,
          processIdBytes32: responseData.processIdBytes32,
          natureId: additionalData.dto.natureId,
          natureIdBytes32: responseData.natureIdBytes32,
          stageId: additionalData.dto.stageId,
          stageIdBytes32: responseData.stageIdBytes32,
          channelName: additionalData.dto.channelName,
          channelNameBytes32: responseData.channelNameBytes32,
          transactionHash: tx.hash,
          walletAddress: responseData.owner,
        });

        return {
          ...this.buildTransactionResponse(tx, receipt),
          processId: additionalData.dto.processId,
          natureId: additionalData.dto.natureId,
          stageId: additionalData.dto.stageId,
          channelName: additionalData.dto.channelName,
          owner: responseData.owner,
          action: ProcessAction[responseData.action],
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
    this.validator.validateProcessInput(updateDto, [
      'processId',
      'natureId',
      'stageId',
      'channelName',
    ]);

    return this.executeTransactionOperation(
      'setProcessStatus',
      updateDto.processId,
      updateDto.channelName,
      privateKey,
      async (contract, walletAddress) => {
        this.logger.debug(`Chamando setProcessStatus com:`, {
          processId: updateDto.processId,
          natureId: updateDto.natureId,
          stageId: updateDto.stageId,
          channelName: updateDto.channelName,
          newStatus: ProcessStatus[updateDto.newStatus],
        });

        const procesUpdate = {
          channelName: this.toBytes32(updateDto.channelName),
          processId: this.toBytes32(updateDto.processId),
          natureId: this.toBytes32(updateDto.natureId),
          stageId: this.toBytes32(updateDto.stageId),
        };

        const tx = await contract.setProcessStatus(
          procesUpdate.channelName,
          procesUpdate.processId,
          procesUpdate.natureId,
          procesUpdate.stageId,
          updateDto.newStatus,
        );

        return {
          tx,
          additionalData: { dto: updateDto, walletAddress },
        };
      },
      (tx, receipt, walletAddress, additionalData) => {
        const previousStatusEnum = this.eventParser.parsePreviousStatus(
          receipt,
          'ProcessStatusChanged',
        );
        const previousStatusString =
          previousStatusEnum !== null
            ? ProcessStatus[previousStatusEnum]
            : 'ACTIVE';

        return {
          ...this.buildTransactionResponse(tx, receipt),
          processId: additionalData.dto.processId,
          previousStatus: previousStatusString,
          newStatus: ProcessStatus[additionalData.dto.newStatus],
          channelName: additionalData.dto.channelName,
          owner: walletAddress,
        };
      },
    );
  }

  /**
   * Inactivate process
   */
  async inactivateProcess(
    inactivateDto: InactivateProcessDto,
    privateKey: string,
  ): Promise<UpdateProcessStatusResponseDto> {
    const updateDto: UpdateProcessStatusDto = {
      ...inactivateDto,
      newStatus: ProcessStatus.INACTIVE,
    };

    return this.updateProcessStatus(updateDto, privateKey);
  }

  /**
   * Get process details
   */
  async getProcess(getProcessDto: GetProcessDto): Promise<ProcessDto> {
    this.logger.log(
      `Buscando processo ${getProcessDto.processId}-${getProcessDto.natureId}-${getProcessDto.stageId} do canal ${getProcessDto.channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract = await this.getContractInstance(tempPrivateKey);

      const getProcessData = {
        channelName: this.toBytes32(getProcessDto.channelName),
        processId: this.toBytes32(getProcessDto.processId),
        natureId: this.toBytes32(getProcessDto.natureId),
        stageId: this.toBytes32(getProcessDto.stageId),
      };

      const result = await contract.getProcess(
        getProcessData.channelName,
        getProcessData.processId,
        getProcessData.natureId,
        getProcessData.stageId,
      );

      return this.parseProcessFromContract(
        result,
        getProcessDto.processId,
        getProcessDto.natureId,
        getProcessDto.stageId,
        getProcessDto.channelName,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao buscar processo: ${error.message}`,
        error.stack,
      );
      return this.handleContractViewError(error, 'getProcess');
    }
  }

  /**
   * Get process with readable schema names
   */
  async getProcessEnriched(
    getProcessDto: GetProcessDto,
  ): Promise<ProcessEnrichedDto> {
    this.logger.log(
      `Buscando processo ${getProcessDto.processId}-${getProcessDto.natureId}-${getProcessDto.stageId} do canal ${getProcessDto.channelName}`,
    );

    try {
      const tempPrivateKey = ethers.Wallet.createRandom().privateKey;
      const contract = await this.getContractInstance(tempPrivateKey);

      const result = await contract.getProcess(
        this.toBytes32(getProcessDto.channelName),
        this.toBytes32(getProcessDto.processId),
        this.toBytes32(getProcessDto.natureId),
        this.toBytes32(getProcessDto.stageId),
      );

      const baseProcess = this.parseProcessFromContract(
        result,
        getProcessDto.processId,
        getProcessDto.natureId,
        getProcessDto.stageId,
        getProcessDto.channelName,
      );

      // Schemas com nomes legíveis do banco
      const enrichedSchemas = await Promise.all(
        baseProcess.schemas.map(async (schema) => {
          const metadata = await this.prismaService.schemaMetadata.findFirst({
            where: { schemaIdBytes32: schema.schemaId },
          });

          return {
            schemaId: metadata?.schemaId || schema.schemaId, // Nome legível ou bytes32
            schemaIdBytes32: schema.schemaId, // Manter bytes32 original
            schemaName: metadata?.schemaName || 'Unknown Schema', // Nome descritivo
            version: schema.version,
          };
        }),
      );

      return {
        ...baseProcess,
        schemas: enrichedSchemas,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar processo: ${error.message}`,
        error.stack,
      );
      return this.handleContractViewError(error, 'getProcessEnriched');
    }
  }

  /**
   * Validate process for submission
   */
  async validateProcessForSubmission(
    getProcessDto: GetProcessDto,
  ): Promise<ProcessValidationResponseDto> {
    return this.executeViewOperation(
      'validateProcessForSubmission',
      getProcessDto.processId,
      getProcessDto.channelName,
      async (contract) => {
        const processData = {
          channelName: this.toBytes32(getProcessDto.channelName),
          processId: this.toBytes32(getProcessDto.processId),
          natureId: this.toBytes32(getProcessDto.natureId),
          stageId: this.toBytes32(getProcessDto.stageId),
        };

        const result = await contract.validateProcessForSubmission(
          processData.channelName,
          processData.processId,
          processData.natureId,
          processData.stageId,
        );

        return {
          isValid: result.isValid,
          reason: result.reason || undefined,
        };
      },
    );
  }

  private parseProcessFromContract(
    contractResult: any,
    processId?: string,
    natureId?: string,
    stageId?: string,
    channelName?: string,
    additionalData?: any,
  ): ProcessDto {
    const statusNumber = Number(contractResult.status) as ProcessStatus;
    const actionNumber = Number(contractResult.action) as ProcessAction;

    return {
      processId: processId ?? additionalData.processId,
      natureId: natureId ?? additionalData.natureId,
      stageId: stageId ?? additionalData.stageId,
      schemas: contractResult.schemas.map((schema: any) => ({
        schemaId: schema.schemaId,
        version: Number(schema.version),
      })),
      action: ProcessAction[actionNumber],
      description: contractResult.description,
      owner: contractResult.owner,
      channelName: channelName ?? additionalData.channelName,
      status: ProcessStatus[statusNumber],
      createdAt: Number(contractResult.createdAt),
      lastUpdated: Number(contractResult.lastUpdated),
    };
  }

  /**
   * Parse genérico de eventos usando interface do contrato
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

  /**
   * Save process metadata to database after blockchain confirmation
   */
  private async saveProcessMetadata(data: {
    processId: string;
    processIdBytes32: string;
    natureId: string;
    natureIdBytes32: string;
    stageId: string;
    stageIdBytes32: string;
    channelName: string;
    channelNameBytes32: string;
    transactionHash: string;
    walletAddress: string;
  }): Promise<void> {
    try {
      await this.prismaService.processMetadata.create({
        data: {
          processId: data.processId,
          processIdBytes32: data.processIdBytes32,
          natureId: data.natureId,
          natureIdBytes32: data.natureIdBytes32,
          stageId: data.stageId,
          stageIdBytes32: data.stageIdBytes32,
          channelName: data.channelName,
          channelNameBytes32: data.channelNameBytes32,
          transactionHash: data.transactionHash,
          walletAddress: data.walletAddress,
        },
      });

      this.logger.log(
        `Metadados salvos: processo ${data.processId}-${data.natureId}-${data.stageId} no canal ${data.channelName}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao salvar metadados do processo: ${error.message}`,
        error.stack,
      );
      // Não falhar a operação por causa do banco
      // A blockchain é a fonte de verdade
    }
  }
}
