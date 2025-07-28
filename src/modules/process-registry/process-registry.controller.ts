import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProcessRegistryService } from './process-registry.service';
import {
  CreateProcessDto,
  CreateProcessResponseDto,
  UpdateProcessStatusDto,
  UpdateProcessStatusResponseDto,
  InactivateProcessDto,
  ProcessDto,
  GetProcessDto,
  ProcessValidationResponseDto,
  ProcessStatus,
} from './dto/process-registry.dto';
import { PrivateKey } from '@/common/decorators/wallet.decorator';
import {
  BlockchainTransaction,
  BlockchainQuery,
} from '@/common/decorators/blockchain-api.decorators';

function ProcessParams() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    ApiParam({
      name: 'channelName',
      description: 'Nome do canal',
      example: 'my-awesome-channel',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'processId',
      description: 'ID do processo',
      example: 'coffee-process',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'natureId',
      description: 'ID da natureza do processo',
      example: 'coffee-onboarding',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'stageId',
      description: 'ID do estágio do processo',
      example: 'coffee-verification',
    })(target, propertyKey, descriptor);
  };
}

function ProcessIdParams() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    ApiParam({
      name: 'channelName',
      description: 'Nome do canal',
      example: 'my-awesome-channel',
    })(target, propertyKey, descriptor);

    ApiParam({
      name: 'processId',
      description: 'ID do processo',
      example: 'coffee-process',
    })(target, propertyKey, descriptor);
  };
}

@ApiTags('process-registry')
@Controller('process-registry')
export class ProcessRegistryController {
  constructor(
    private readonly processRegistryService: ProcessRegistryService,
  ) {}

  /**
   * Create a new process
   */
  @Post('processes')
  @HttpCode(HttpStatus.CREATED)
  @BlockchainTransaction()
  @ApiOperation({
    summary: 'Criar um novo processo',
    description:
      'Cria um novo processo na blockchain com schemas associados e ação específica. O processo sempre é criado com status ACTIVE.',
  })
  @ApiResponse({
    status: 201,
    description: 'Processo criado com sucesso',
    type: CreateProcessResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Processo já existe',
    example: {
      statusCode: 409,
      message: 'Processo já existe no canal',
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Schemas inválidos ou duplicados',
    example: {
      statusCode: 400,
      message: 'Schema duplicado encontrado: user-profile v1',
      error: 'Bad Request',
    },
  })
  async createProcess(
    @Body() createProcessDto: CreateProcessDto,
    @PrivateKey() privateKey: string,
  ): Promise<CreateProcessResponseDto> {
    return await this.processRegistryService.createProcess(
      createProcessDto,
      privateKey,
    );
  }

  /**
   * Update process status
   */
  @Post('processes/status')
  @HttpCode(HttpStatus.OK)
  @BlockchainTransaction()
  @ApiOperation({
    summary: 'Atualizar status do processo',
    description:
      'Atualiza o status de um processo específico (ACTIVE ↔ INACTIVE). Apenas o proprietário pode alterar o status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do processo atualizado com sucesso',
    type: UpdateProcessStatusResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas o proprietário pode alterar o status',
    example: {
      statusCode: 403,
      message: 'Apenas o proprietário do processo pode realizar esta operação',
      error: 'Forbidden',
    },
  })
  async updateProcessStatus(
    @Body() updateProcessStatusDto: UpdateProcessStatusDto,
    @PrivateKey() privateKey: string,
  ): Promise<UpdateProcessStatusResponseDto> {
    return await this.processRegistryService.updateProcessStatus(
      updateProcessStatusDto,
      privateKey,
    );
  }

  /**
   * Inactivate process
   */
  @Post('processes/inactivate')
  @HttpCode(HttpStatus.OK)
  @BlockchainTransaction()
  @ApiOperation({
    summary: 'Inativar processo',
    description:
      'Inativa um processo específico (muda status para INACTIVE). Função de conveniência que chama updateProcessStatus.',
  })
  @ApiResponse({
    status: 200,
    description: 'Processo inativado com sucesso',
    type: UpdateProcessStatusResponseDto,
  })
  async inactivateProcess(
    @Body() inactivateProcessDto: InactivateProcessDto,
    @PrivateKey() privateKey: string,
  ): Promise<UpdateProcessStatusResponseDto> {
    return await this.processRegistryService.inactivateProcess(
      inactivateProcessDto,
      privateKey,
    );
  }

  /**
   * Get specific process details
   */
  @Get('processes/:channelName/:processId/:natureId/:stageId')
  @ProcessParams()
  @BlockchainQuery()
  @ApiOperation({
    summary: 'Obter detalhes do processo',
    description: 'Retorna informações completas de um processo específico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Processo retornado com sucesso',
    type: ProcessDto,
  })
  async getProcess(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
    @Param('natureId') natureId: string,
    @Param('stageId') stageId: string,
  ): Promise<ProcessDto> {
    const getProcessDto: GetProcessDto = {
      channelName,
      processId,
      natureId,
      stageId,
    };
    return await this.processRegistryService.getProcess(getProcessDto);
  }

  /**
   * Get all processes with same processId (different nature/stage combinations)
   */
  @Get('processes/:channelName/:processId')
  @ProcessIdParams()
  @BlockchainQuery()
  @ApiOperation({
    summary: 'Obter todos os processos por ID',
    description:
      'Retorna todos os processos que compartilham o mesmo processId mas têm diferentes combinações de natureId/stageId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Processos retornados com sucesso',
    type: [ProcessDto],
  })
  async getProcessesByProcessId(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
  ): Promise<ProcessDto[]> {
    return await this.processRegistryService.getProcessesByProcessId(
      processId,
      channelName,
    );
  }

  /**
   * Check if process is active
   */
  @Get('processes/:channelName/:processId/:natureId/:stageId/active')
  @ProcessParams()
  @BlockchainQuery()
  @ApiOperation({
    summary: 'Verificar se processo está ativo',
    description: 'Retorna true se o processo existe e está com status ACTIVE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Status verificado com sucesso',
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          example: true,
          description: 'Se o processo está ativo',
        },
      },
    },
  })
  async isProcessActive(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
    @Param('natureId') natureId: string,
    @Param('stageId') stageId: string,
  ): Promise<{ isActive: boolean }> {
    const getProcessDto: GetProcessDto = {
      channelName,
      processId,
      natureId,
      stageId,
    };
    const isActive =
      await this.processRegistryService.isProcessActive(getProcessDto);
    return { isActive };
  }

  /**
   * Validate process for submission
   */
  @Get('processes/:channelName/:processId/:natureId/:stageId/validate')
  @ProcessParams()
  @BlockchainQuery()
  @ApiOperation({
    summary: 'Validar processo para submissão',
    description:
      'Valida se o processo está pronto para ser usado em submissões. Verifica status, schemas ativos, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Validação realizada com sucesso',
    type: ProcessValidationResponseDto,
  })
  async validateProcessForSubmission(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
    @Param('natureId') natureId: string,
    @Param('stageId') stageId: string,
  ): Promise<ProcessValidationResponseDto> {
    const getProcessDto: GetProcessDto = {
      channelName,
      processId,
      natureId,
      stageId,
    };
    return await this.processRegistryService.validateProcessForSubmission(
      getProcessDto,
    );
  }

  /**
   * Get process status only
   */
  @Get('processes/:channelName/:processId/:natureId/:stageId/status')
  @ProcessParams()
  @BlockchainQuery()
  @ApiOperation({
    summary: 'Obter apenas o status do processo',
    description:
      'Retorna apenas o status atual do processo (ACTIVE/INACTIVE). Mais eficiente que buscar o processo completo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE'],
          example: 'ACTIVE',
          description: 'Status atual do processo',
        },
        statusCode: {
          type: 'number',
          example: 0,
          description: 'Código numérico do status (0=ACTIVE, 1=INACTIVE)',
        },
      },
    },
  })
  async getProcessStatus(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
    @Param('natureId') natureId: string,
    @Param('stageId') stageId: string,
  ): Promise<{ status: string; statusCode: number }> {
    const getProcessDto: GetProcessDto = {
      channelName,
      processId,
      natureId,
      stageId,
    };
    const statusCode =
      await this.processRegistryService.getProcessStatus(getProcessDto);
    return {
      status: ProcessStatus[statusCode],
      statusCode: statusCode,
    };
  }
}
