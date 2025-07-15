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
  GetSchemaByVersionDto,
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
      message:
        'Schema já existe no canal. Use updateSchema para criar uma nova versão',
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
   * Get schema by version
   */
  @Get('schemas/:channelName/:schemaId/:version')
  @ApiOperation({
    summary: 'Obter schema por versão',
    description: 'Retorna o schema de uma versão específica.',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
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
    status: 401,
    description: 'Usuário não é membro do canal',
    example: {
      statusCode: 401,
      message: 'Usuário não é membro do canal especificado',
      error: 'Unauthorized',
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
    @PrivateKey() privateKey: string,
  ): Promise<SchemaDto> {
    const getSchemaByVersionDto: GetSchemaByVersionDto = {
      channelName,
      schemaId,
      version: parseInt(version),
    };
    return await this.schemaRegistryService.getSchemaByVersion(
      getSchemaByVersionDto,
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
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
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
    status: 401,
    description: 'Usuário não é membro do canal',
    example: {
      statusCode: 401,
      message: 'Usuário não é membro do canal especificado',
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
  async getActiveSchema(
    @Param('channelName') channelName: string,
    @Param('schemaId') schemaId: string,
    @PrivateKey() privateKey: string,
  ): Promise<SchemaDto> {
    const getSchemaDto: GetSchemaDto = { channelName, schemaId };
    return await this.schemaRegistryService.getActiveSchema(
      getSchemaDto,
      privateKey,
    );
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
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
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
    status: 401,
    description: 'Usuário não é membro do canal',
    example: {
      statusCode: 401,
      message: 'Usuário não é membro do canal especificado',
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
  async getSchemaInfo(
    @Param('channelName') channelName: string,
    @Param('schemaId') schemaId: string,
    @PrivateKey() privateKey: string,
  ): Promise<SchemaInfoResponseDto> {
    const getSchemaDto: GetSchemaDto = { channelName, schemaId };
    return await this.schemaRegistryService.getSchemaInfo(
      getSchemaDto,
      privateKey,
    );
  }
}
