import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { ProcessRegistryService } from './process-registry.service';
import {
  CreateProcessDto,
  CreateProcessResponseDto,
  UpdateProcessStatusDto,
  UpdateProcessStatusResponseDto,
  InactivateProcessDto,
  ProcessDto,
  ProcessValidationResponseDto,
  GetProcessDto,
} from './dto/process-registry.dto';
import { PrivateKey } from '../../common/decorators/wallet.decorator';

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
  @ApiOperation({
    summary: 'Criar um novo processo',
    description:
      'Cria um novo processo de negócio na blockchain com schemas associados.',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 201,
    description: 'Processo criado com sucesso',
    type: CreateProcessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    examples: {
      'invalid-process-id': {
        summary: 'Process ID inválido',
        value: {
          statusCode: 400,
          message: 'Process ID é obrigatório e deve ser válido',
          error: 'Bad Request',
        },
      },
      'invalid-schemas': {
        summary: 'Schemas inválidos',
        value: {
          statusCode: 400,
          message: 'Máximo de 10 schemas permitidos por processo',
          error: 'Bad Request',
        },
      },
      'schema-not-active': {
        summary: 'Schema não está ativo no canal',
        value: {
          statusCode: 400,
          message: 'Schema não está ativo no canal especificado',
          error: 'Bad Request',
        },
      },
    },
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
  @Put('processes/:channelName/:processId/:natureId/:stageId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar status do processo',
    description: 'Atualiza o status de um processo específico.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiParam({
    name: 'processId',
    description: 'ID do processo',
    example: 'coffee-process',
  })
  @ApiParam({
    name: 'natureId',
    description: 'ID da natureza do processo',
    example: 'user-onboarding',
  })
  @ApiParam({
    name: 'stageId',
    description: 'ID do estágio do processo',
    example: 'coffee-verification',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Status do processo atualizado com sucesso',
    type: UpdateProcessStatusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Transição de status inválida',
    examples: {
      'invalid-transition': {
        summary: 'Transição inválida',
        value: {
          statusCode: 400,
          message: 'Transição de status inválida',
          error: 'Bad Request',
        },
      },
      'process-inactive': {
        summary: 'Processo já está inativo',
        value: {
          statusCode: 400,
          message: 'Processo já está inativo',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Não autorizado - apenas o proprietário pode atualizar',
    example: {
      statusCode: 403,
      message: 'Apenas o proprietário do processo pode realizar esta operação',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Processo não encontrado',
    example: {
      statusCode: 404,
      message: 'Processo não encontrado no canal especificado',
      error: 'Not Found',
    },
  })
  async updateProcessStatus(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
    @Param('natureId') natureId: string,
    @Param('stageId') stageId: string,
    @Body() updateStatusBody: { newStatus: string },
    @PrivateKey() privateKey: string,
  ): Promise<UpdateProcessStatusResponseDto> {
    const updateProcessStatusDto: UpdateProcessStatusDto = {
      channelName: channelName.trim(),
      processId: processId.trim(),
      natureId: natureId.trim(),
      stageId: stageId.trim(),
      newStatus: updateStatusBody.newStatus as any,
    };

    return await this.processRegistryService.updateProcessStatus(
      updateProcessStatusDto,
      privateKey,
    );
  }

  /**
   * Inactivate a process
   */
  @Put('processes/:channelName/:processId/:natureId/:stageId/inactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inativar um processo',
    description: 'Marca um processo como inativo.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awsome-channel',
  })
  @ApiParam({
    name: 'processId',
    description: 'ID do processo',
    example: 'coffee-process',
  })
  @ApiParam({
    name: 'natureId',
    description: 'ID da natureza',
    example: 'coffee-onboarding',
  })
  @ApiParam({
    name: 'stageId',
    description: 'ID do estágio',
    example: 'coffee-verification',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Processo inativado com sucesso',
    type: UpdateProcessStatusResponseDto,
  })
  async inactivateProcess(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
    @Param('natureId') natureId: string,
    @Param('stageId') stageId: string,
    @PrivateKey() privateKey: string,
  ): Promise<UpdateProcessStatusResponseDto> {
    const inactivateProcessDto: InactivateProcessDto = {
      channelName: channelName.trim(),
      processId: processId.trim(),
      natureId: natureId.trim(),
      stageId: stageId.trim(),
    };

    return await this.processRegistryService.inactivateProcess(
      inactivateProcessDto,
      privateKey,
    );
  }

  /**
   * Get process details
   */
  @Get('processes/:channelName/:processId/:natureId/:stageId')
  @ApiOperation({
    summary: 'Obter detalhes do processo',
    description: 'Retorna os detalhes completos de um processo específico.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awsome-channel',
  })
  @ApiParam({
    name: 'processId',
    description: 'ID do processo',
    example: 'coffee-process',
  })
  @ApiParam({
    name: 'natureId',
    description: 'ID da natureza',
    example: 'coffee-onboarding',
  })
  @ApiParam({
    name: 'stageId',
    description: 'ID do estágio',
    example: 'coffee-verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do processo retornados com sucesso',
    type: ProcessDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Processo não encontrado',
    example: {
      statusCode: 404,
      message: 'Processo não encontrado no canal especificado',
      error: 'Not Found',
    },
  })
  async getProcess(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
    @Param('natureId') natureId: string,
    @Param('stageId') stageId: string,
  ): Promise<ProcessDto> {
    const getProcessDto: GetProcessDto = {
      channelName: channelName.trim(),
      processId: processId.trim(),
      natureId: natureId.trim(),
      stageId: stageId.trim(),
    };

    return await this.processRegistryService.getProcess(getProcessDto);
  }

  /**
   * Get process status
   */
  @Get('processes/:channelName/:processId/:natureId/:stageId/status')
  @ApiOperation({
    summary: 'Obter status do processo',
    description: 'Retorna apenas o status atual de um processo.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awsome-channel',
  })
  @ApiParam({
    name: 'processId',
    description: 'ID do processo',
    example: 'coffee-process',
  })
  @ApiParam({
    name: 'natureId',
    description: 'ID da natureza',
    example: 'coffee-onboarding',
  })
  @ApiParam({
    name: 'stageId',
    description: 'ID do estágio',
    example: 'coffee-verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do processo retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE'],
          example: 'ACTIVE',
        },
      },
    },
  })
  async getProcessStatus(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
    @Param('natureId') natureId: string,
    @Param('stageId') stageId: string,
  ): Promise<{ status: string }> {
    const getProcessDto: GetProcessDto = {
      channelName: channelName.trim(),
      processId: processId.trim(),
      natureId: natureId.trim(),
      stageId: stageId.trim(),
    };

    return await this.processRegistryService.getProcessStatus(getProcessDto);
  }

  /**
   * Get processes by process ID
   */
  @Get('processes/:channelName/:processId')
  @ApiOperation({
    summary: 'Obter processos por ID',
    description:
      'Retorna todos os processos com o mesmo processId no canal (diferentes naturezas/estágios).',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awsome-channel',
  })
  @ApiParam({
    name: 'processId',
    description: 'ID do processo',
    example: 'coffee-process',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de processos retornada com sucesso',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/ProcessDto' },
    },
  })
  async getProcessesByProcessId(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
  ): Promise<ProcessDto[]> {
    return await this.processRegistryService.getProcessesByProcessId(
      processId.trim(),
      channelName.trim(),
    );
  }

  /**
   * Check if process is active
   */
  @Get('processes/:channelName/:processId/:natureId/:stageId/active')
  @ApiOperation({
    summary: 'Verificar se processo está ativo',
    description: 'Verifica se um processo específico está no status ativo.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awsome-channel',
  })
  @ApiParam({
    name: 'processId',
    description: 'ID do processo',
    example: 'coffee-process',
  })
  @ApiParam({
    name: 'natureId',
    description: 'ID da natureza',
    example: 'coffee-onboarding',
  })
  @ApiParam({
    name: 'stageId',
    description: 'ID do estágio',
    example: 'coffee-verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de ativação retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          example: true,
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
      channelName: channelName.trim(),
      processId: processId.trim(),
      natureId: natureId.trim(),
      stageId: stageId.trim(),
    };

    return await this.processRegistryService.isProcessActive(getProcessDto);
  }

  /**
   * Validate process for submission
   */
  @Get('processes/:channelName/:processId/:natureId/:stageId/validate')
  @ApiOperation({
    summary: 'Validar processo para submissão',
    description:
      'Valida se um processo está pronto para ser submetido (schemas ativos, status correto, etc.).',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiParam({
    name: 'processId',
    description: 'ID do processo',
    example: 'coffee-process',
  })
  @ApiParam({
    name: 'natureId',
    description: 'ID da natureza',
    example: 'coffee-onboarding',
  })
  @ApiParam({
    name: 'stageId',
    description: 'ID do estágio',
    example: 'coffee-verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado da validação retornado com sucesso',
    type: ProcessValidationResponseDto,
  })
  async validateProcessForSubmission(
    @Param('channelName') channelName: string,
    @Param('processId') processId: string,
    @Param('natureId') natureId: string,
    @Param('stageId') stageId: string,
  ): Promise<ProcessValidationResponseDto> {
    const getProcessDto: GetProcessDto = {
      channelName: channelName.trim(),
      processId: processId.trim(),
      natureId: natureId.trim(),
      stageId: stageId.trim(),
    };

    return await this.processRegistryService.validateProcessForSubmission(
      getProcessDto,
    );
  }
}
