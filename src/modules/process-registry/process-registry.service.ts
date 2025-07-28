import { Injectable } from '@nestjs/common';
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
} from './dto/process-registry.dto';
import { BlockchainProvider } from '@/blockchain/providers/blockchain.provider';
import { ABIName } from '@/blockchain/abis';
import { BaseContractService } from '@/blockchain/services/base-contract.service';
import { ProcessEventParser } from './services/process-event-parser.service';
import { ProcessValidator } from './services/process-validator.service';

@Injectable()
export class ProcessRegistryService extends BaseContractService {
  private readonly PROCESS_REGISTRY_BYTES32: string;

  constructor(
    blockchainProvider: BlockchainProvider,
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
          additionalData: { dto: createDto },
        };
      },
      (tx, receipt, walletAddress, additionalData) => ({
        ...this.buildTransactionResponse(tx, receipt),
        processId: additionalData.dto.processId,
        natureId: additionalData.dto.natureId,
        stageId: additionalData.dto.stageId,
        channelName: additionalData.dto.channelName,
        owner: walletAddress,
        action: ProcessAction[additionalData.dto.action],
      }),
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

        const tx = await contract.setProcessStatus(
          this.toBytes32(updateDto.channelName),
          this.toBytes32(updateDto.processId),
          this.toBytes32(updateDto.natureId),
          this.toBytes32(updateDto.stageId),
          updateDto.newStatus,
        );

        return {
          tx,
          additionalData: { dto: updateDto },
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
    return this.executeViewOperation(
      'getProcess',
      getProcessDto.processId,
      getProcessDto.channelName,
      async (contract) => {
        const result = await contract.getProcess(
          this.toBytes32(getProcessDto.channelName),
          this.toBytes32(getProcessDto.processId),
          this.toBytes32(getProcessDto.natureId),
          this.toBytes32(getProcessDto.stageId),
        );

        return this.parseProcessFromContract(
          result,
          getProcessDto.processId,
          getProcessDto.natureId,
          getProcessDto.stageId,
          getProcessDto.channelName,
        );
      },
    );
  }

  /**
   * Get processes by process ID (pode haver múltiplos com diferentes nature/stage)
   */
  async getProcessesByProcessId(
    processId: string,
    channelName: string,
  ): Promise<ProcessDto[]> {
    return this.executeViewOperation(
      'getProcessesByProcessId',
      processId,
      channelName,
      async (contract) => {
        const result = await contract.getProcessesByProcessId(
          this.toBytes32(processId),
          this.toBytes32(channelName),
        );

        if (!result || !Array.isArray(result)) {
          return []; // Retornar array vacío en lugar de error
        }

        return result.map((process: any) =>
          this.parseProcessFromContract(process),
        );
      },
    );
  }

  /**
   * Check if process is active
   */
  async isProcessActive(getProcessDto: GetProcessDto): Promise<boolean> {
    return this.executeViewOperation(
      'isProcessActive',
      getProcessDto.processId,
      getProcessDto.channelName,
      async (contract) => {
        return await contract.isProcessActive(
          this.toBytes32(getProcessDto.channelName),
          this.toBytes32(getProcessDto.processId),
          this.toBytes32(getProcessDto.natureId),
          this.toBytes32(getProcessDto.stageId),
        );
      },
    );
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
        const result = await contract.validateProcessForSubmission(
          this.toBytes32(getProcessDto.channelName),
          this.toBytes32(getProcessDto.processId),
          this.toBytes32(getProcessDto.natureId),
          this.toBytes32(getProcessDto.stageId),
        );

        return {
          isValid: result.isValid,
          reason: result.reason || undefined,
        };
      },
    );
  }

  /**
   * Get process status
   */
  async getProcessStatus(getProcessDto: GetProcessDto): Promise<ProcessStatus> {
    return this.executeViewOperation(
      'getProcessStatus',
      getProcessDto.processId,
      getProcessDto.channelName,
      async (contract) => {
        const statusNumber = await contract.getProcessStatus(
          this.toBytes32(getProcessDto.channelName),
          this.toBytes32(getProcessDto.processId),
          this.toBytes32(getProcessDto.natureId),
          this.toBytes32(getProcessDto.stageId),
        );

        return Number(statusNumber) as ProcessStatus;
      },
    );
  }

  private parseProcessFromContract(
    contractResult: any,
    processId?: string,
    natureId?: string,
    stageId?: string,
    channelName?: string,
  ): ProcessDto {
    const statusNumber = Number(contractResult.status) as ProcessStatus;
    const actionNumber = Number(contractResult.action) as ProcessAction;

    return {
      processId: processId ?? this.fromBytes32(contractResult.processId),
      natureId: natureId ?? this.fromBytes32(contractResult.natureId),
      stageId: stageId ?? this.fromBytes32(contractResult.stageId),
      schemas: contractResult.schemas.map((schema: any) => ({
        schemaId: this.fromBytes32(schema.schemaId),
        version: Number(schema.version),
      })),
      action: ProcessAction[actionNumber],
      description: contractResult.description,
      owner: contractResult.owner,
      channelName: channelName ?? this.fromBytes32(contractResult.channelName),
      status: ProcessStatus[statusNumber],
      createdAt: Number(contractResult.createdAt),
      lastUpdated: Number(contractResult.lastUpdated),
    };
  }
}
