import {
  Controller,
  Post,
  Get,
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
import { SchemaRegistryService } from './schema-registry.service';
import {
  CreateSchemaDto,
  CreateSchemaResponseDto,
  SchemaDto,
  SchemaInfoResponseDto,
  GetSchemaDto,
  DeprecateSchemaDto,
  DeprecateSchemaResponseDto,
  UpdateSchemaDto,
  UpdateSchemaResponseDto,
  InactivateSchemaDto,
  InactivateSchemaResponseDto,
  GetSchemaByVersionDto,
  GetLatestSchemaResponseDto,
  GetSchemaVersionsResponseDto,
  SetSchemaStatusDto,
  SetSchemaStatusResponseDto,
} from './dto/schema-registry.dto';
import { PrivateKey } from '../../common/decorators/wallet.decorator';

@ApiTags('schema-registry')
@Controller('schema-registry')
export class SchemaRegistryController {
  constructor(private readonly schemaRegistryService: SchemaRegistryService) {}

  /**
   * Create a new schema
   */
  @Post('schemas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar um novo schema',
    description:
      'Cria um novo schema de dados na blockchain. O schema sempre é criado na versão 1 e status ACTIVE.',
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
    description: 'Schema criado com sucesso',
    type: CreateSchemaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    examples: {
      'invalid-schema-id': {
        summary: 'Invalid schema ID',
        value: {
          statusCode: 400,
          message: 'ID do schema é obrigatório e deve ser válido',
          error: 'Bad Request',
        },
      },
      'invalid-data-hash': {
        summary: 'Invalid schema ID',
        value: {
          statusCode: 400,
          message: 'Hash dos dados é obrigatório e deve ser válido',
          error: 'Bad Request',
        },
      },
      'channel-not-member': {
        summary: 'Usuário não é membro do canal especificado',
        value: {
          statusCode: 401,
          message: 'Usuário não é membro do canal especificado',
          error: 'Unauthorized',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Schema já existe',
    example: {
      statusCode: 409,
      message: 'Schema já existe no canal',
      error: 'Conflict',
    },
  })
  async createSchema(
    @Body() createSchemaDto: CreateSchemaDto,
    @PrivateKey() privateKey: string,
  ): Promise<CreateSchemaResponseDto> {
    return await this.schemaRegistryService.createSchema(
      createSchemaDto,
      privateKey,
    );
  }

  /**
   * Deprecate a schema
   */
  @Post('schemas/deprecate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Depreciar um schema',
    description:
      'Deprecia um schema ativo, tornando-o indisponível para uso futuro mas mantendo dados existentes.',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema depreciado com sucesso',
    type: DeprecateSchemaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    examples: {
      'no-active-version': {
        summary: 'Schema nao possui versão ativa',
        value: {
          statusCode: 400,
          message: 'Schema não possui versão ativa',
          error: 'Bad Request',
        },
      },
      'schema-not-active': {
        summary: 'Schema não está ativo',
        value: {
          statusCode: 400,
          message: 'Schema não está ativo',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
    example: {
      statusCode: 401,
      message: 'Apenas o proprietário do schema pode realizar esta operação',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schema não encontrado',
    example: {
      statusCode: 404,
      message: 'Schema não encontrado no canal especificado',
      error: 'Not Found',
    },
  })
  async deprecateSchema(
    @Body() deprecateSchemaDto: DeprecateSchemaDto,
    @PrivateKey() privateKey: string,
  ): Promise<DeprecateSchemaResponseDto> {
    return await this.schemaRegistryService.deprecateSchema(
      deprecateSchemaDto,
      privateKey,
    );
  }

  /**
   * Update a schema
   */
  @Post('schemas/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar um schema',
    description:
      'Atualiza um schema existente, criando uma nova versão ativa e depreciando a versão anterior.',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema atualizado com sucesso',
    type: UpdateSchemaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    examples: {
      'schema-not-active': {
        summary: 'Schema não está ativo',
        value: {
          statusCode: 400,
          message: 'Schema não está ativo',
          error: 'Bad Request',
        },
      },
      'no-active-version': {
        summary: 'Schema não possui versão ativa',
        value: {
          statusCode: 400,
          message: 'Schema não possui versão ativa',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
    example: {
      statusCode: 401,
      message: 'Apenas o proprietário do schema pode realizar esta operação',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schema não encontrado',
    example: {
      statusCode: 404,
      message: 'Schema não encontrado no canal especificado',
      error: 'Not Found',
    },
  })
  async updateSchema(
    @Body() updateSchemaDto: UpdateSchemaDto,
    @PrivateKey() privateKey: string,
  ): Promise<UpdateSchemaResponseDto> {
    return await this.schemaRegistryService.updateSchema(
      updateSchemaDto,
      privateKey,
    );
  }

  /**
   * Inactivate a specific version of a schema
   */
  @Post('schemas/inactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inativar uma versão específica do schema',
    description:
      'Inativa uma versão específica de um schema, tornando-a indisponível para uso.',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema inativado com sucesso',
    type: InactivateSchemaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    examples: {
      'schema-already-inactive': {
        summary: 'Schema já está inativo',
        value: {
          statusCode: 400,
          message: 'Schema já está inativo',
          error: 'Bad Request',
        },
      },
      'invalid-version': {
        summary: 'Versão inválida',
        value: {
          statusCode: 400,
          message: 'Versão deve ser maior que 0',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
    example: {
      statusCode: 401,
      message: 'Apenas o proprietário do schema pode realizar esta operação',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schema ou versão não encontrada',
    example: {
      statusCode: 404,
      message: 'Versão do schema não encontrada no canal',
      error: 'Not Found',
    },
  })
  async inactivateSchema(
    @Body() inactivateSchemaDto: InactivateSchemaDto,
    @PrivateKey() privateKey: string,
  ): Promise<InactivateSchemaResponseDto> {
    return await this.schemaRegistryService.inactivateSchema(
      inactivateSchemaDto,
      privateKey,
    );
  }

  /**
   * Set Schema Status
   */
  @Post('schemas/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar status do schema',
    description:
      'Define o status de um schema existente baseado em sua versão.',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema atualizado seu status com sucesso',
    type: SetSchemaStatusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    examples: {
      'schema-status-already-defined': {
        summary: 'Status já definido',
        value: {
          statusCode: 400,
          message: 'Status já definido',
          error: 'Bad Request',
        },
      },
      'invalid-version': {
        summary: 'Versão inválida',
        value: {
          statusCode: 400,
          message: 'Versão deve ser maior que 0',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
    example: {
      statusCode: 401,
      message: 'Apenas o proprietário do schema pode realizar esta operação',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schema ou versão não encontrada',
    example: {
      statusCode: 404,
      message: 'Versão do schema não encontrada no canal',
      error: 'Not Found',
    },
  })
  async setSchemaStatus(
    @Body() setSchemaStatusDto: SetSchemaStatusDto,
    @PrivateKey() privateKey: string,
  ): Promise<SetSchemaStatusResponseDto> {
    return await this.schemaRegistryService.setSchemaStatus(
      setSchemaStatusDto,
      privateKey,
    );
  }

  /**
   * Get active schema
   */
  @Get('schemas/:channelName/:schemaId/active')
  @ApiOperation({
    summary: 'Obter schema ativo',
    description: 'Retorna a versão ativa de um schema específico.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiParam({
    name: 'schemaId',
    description: 'ID do schema',
    example: 'user-profile-schema',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema ativo retornado com sucesso',
    type: SchemaDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Schema não possui versão ativa',
    example: {
      statusCode: 400,
      message: 'Schema não possui versão ativa',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schema não encontrado',
    example: {
      statusCode: 404,
      message: 'Schema não encontrado no canal especificado',
      error: 'Not Found',
    },
  })
  async getActiveSchema(
    @Param('channelName') channelName: string,
    @Param('schemaId') schemaId: string,
  ): Promise<SchemaDto> {
    const getSchemaDto: GetSchemaDto = { channelName, schemaId };
    return await this.schemaRegistryService.getActiveSchema(getSchemaDto);
  }

  /**
   * Get latest version schema
   */
  @Get('schemas/:channelName/:schemaId/latest')
  @ApiOperation({
    summary: 'Obter o schema mais recente',
    description:
      'Retorna a versão mais recente do schema (independente do status ativo/inativo).',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiParam({
    name: 'schemaId',
    description: 'ID do schema',
    example: 'user-profile-schema',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema mais recente retornado com sucesso',
    type: SchemaDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Schema não encontrado',
    example: {
      statusCode: 404,
      message: 'Schema não encontrado no canal especificado',
      error: 'Not Found',
    },
  })
  async getLatestSchema(
    @Param('channelName') channelName: string,
    @Param('schemaId') schemaId: string,
  ): Promise<GetLatestSchemaResponseDto> {
    const getSchemaDto: GetSchemaDto = {
      channelName,
      schemaId,
    };
    return await this.schemaRegistryService.getLatestSchema(getSchemaDto);
  }

  /**
   * Get schema info
   */
  @Get('schemas/:channelName/:schemaId/info')
  @ApiOperation({
    summary: 'Obter informações do schema',
    description:
      'Retorna informações resumidas sobre um schema (versões, status, proprietário).',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiParam({
    name: 'schemaId',
    description: 'ID do schema',
    example: 'user-profile-schema',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações do schema retornadas com sucesso',
    type: SchemaInfoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Schema não encontrado',
    example: {
      statusCode: 404,
      message: 'Schema não encontrado no canal especificado',
      error: 'Not Found',
    },
  })
  async getSchemaInfo(
    @Param('channelName') channelName: string,
    @Param('schemaId') schemaId: string,
  ): Promise<SchemaInfoResponseDto> {
    const getSchemaDto: GetSchemaDto = { channelName, schemaId };
    return await this.schemaRegistryService.getSchemaInfo(getSchemaDto);
  }

  /**
   * Get all versions of a schema
   */
  @Get('schemas/:channelName/:schemaId/versions')
  @ApiOperation({
    summary: 'Obter todas as versões do schema',
    description:
      'Retorna todas as versões existentes de um schema com informações detalhadas.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiParam({
    name: 'schemaId',
    description: 'ID do schema',
    example: 'user-profile-schema',
  })
  @ApiResponse({
    status: 200,
    description: 'Versões do schema retornadas com sucesso',
    type: GetSchemaVersionsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Schema não encontrado',
    example: {
      statusCode: 404,
      message: 'Schema não encontrado no canal especificado',
      error: 'Not Found',
    },
  })
  async getSchemaVersions(
    @Param('channelName') channelName: string,
    @Param('schemaId') schemaId: string,
  ): Promise<GetSchemaVersionsResponseDto> {
    const getSchemaDto: GetSchemaDto = { channelName, schemaId };
    return await this.schemaRegistryService.getSchemaVersions(getSchemaDto);
  }

  /**
   * Get schema by version
   */
  @Get('schemas/:channelName/:schemaId/:version')
  @ApiOperation({
    summary: 'Obter schema por versão',
    description: 'Retorna o schema de uma versão específica.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiParam({
    name: 'schemaId',
    description: 'ID do schema',
    example: 'user-profile-schema',
  })
  @ApiParam({
    name: 'version',
    description: 'Número da versão do schema',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema retornado com sucesso',
    type: SchemaDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos',
    example: {
      statusCode: 400,
      message: ['Versão deve ser um número maior que 0'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Schema ou versão não encontrado',
    example: {
      statusCode: 404,
      message: 'Schema ou versão não encontrado no canal especificado',
      error: 'Not Found',
    },
  })
  async getSchemaByVersion(
    @Param('channelName') channelName: string,
    @Param('schemaId') schemaId: string,
    @Param('version') version: string,
  ): Promise<SchemaDto> {
    const getSchemaByVersionDto: GetSchemaByVersionDto = {
      channelName,
      schemaId,
      version: parseInt(version),
    };
    return await this.schemaRegistryService.getSchemaByVersion(
      getSchemaByVersionDto,
    );
  }
}
