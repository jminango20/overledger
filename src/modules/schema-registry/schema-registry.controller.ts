import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  SetSchemaStatusDto,
  SetSchemaStatusResponseDto,
} from './dto/schema-registry.dto';
import { PrivateKey } from '@/common/decorators/wallet.decorator';
import {
  BlockchainTransaction,
  BlockchainQuery,
  SchemaParams,
  SchemaVersionParams,
} from '@/common/decorators/blockchain-api.decorators';

@ApiTags('schema-registry')
@Controller('schema-registry')
export class SchemaRegistryController {
  constructor(private readonly schemaRegistryService: SchemaRegistryService) {}

  /**
   * Create a new schema
   */
  @Post('schemas')
  @HttpCode(HttpStatus.CREATED)
  @BlockchainTransaction()
  @ApiOperation({
    summary: 'Criar um novo schema',
    description:
      'Cria um novo schema de dados na blockchain. O schema sempre é criado na versão 1 e status ACTIVE.',
  })
  @ApiResponse({
    status: 201,
    description: 'Schema criado com sucesso',
    type: CreateSchemaResponseDto,
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
  @BlockchainTransaction()
  @ApiOperation({
    summary: 'Depreciar um schema',
    description:
      'Deprecia um schema ativo, tornando-o indisponível para uso futuro mas mantendo dados existentes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema depreciado com sucesso',
    type: DeprecateSchemaResponseDto,
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
  @BlockchainTransaction()
  @ApiOperation({
    summary: 'Atualizar um schema',
    description:
      'Atualiza um schema existente, criando uma nova versão ativa e depreciando a versão anterior.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema atualizado com sucesso',
    type: UpdateSchemaResponseDto,
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
  @BlockchainTransaction()
  @ApiOperation({
    summary: 'Inativar uma versão específica do schema',
    description:
      'Inativa uma versão específica de um schema, tornando-a indisponível para uso.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema inativado com sucesso',
    type: InactivateSchemaResponseDto,
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
  @BlockchainTransaction()
  @ApiOperation({
    summary: 'Atualizar status do schema',
    description:
      'Define o status de um schema existente baseado em sua versão.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema atualizado seu status com sucesso',
    type: SetSchemaStatusResponseDto,
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
  @SchemaParams()
  @BlockchainQuery()
  @ApiOperation({
    summary: 'Obter schema ativo',
    description: 'Retorna a versão ativa de um schema específico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Schema ativo retornado com sucesso',
    type: SchemaDto,
  })
  async getActiveSchema(
    @Param('channelName') channelName: string,
    @Param('schemaId') schemaId: string,
  ): Promise<SchemaDto> {
    const getSchemaDto: GetSchemaDto = { channelName, schemaId };
    return await this.schemaRegistryService.getActiveSchema(getSchemaDto);
  }

  /**
   * Get schema info
   */
  @Get('schemas/:channelName/:schemaId/info')
  @SchemaParams()
  @BlockchainQuery()
  @ApiOperation({
    summary: 'Obter informações do schema',
    description:
      'Retorna informações resumidas sobre um schema (versões, status, proprietário).',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações do schema retornadas com sucesso',
    type: SchemaInfoResponseDto,
  })
  async getSchemaInfo(
    @Param('channelName') channelName: string,
    @Param('schemaId') schemaId: string,
  ): Promise<SchemaInfoResponseDto> {
    const getSchemaDto: GetSchemaDto = { channelName, schemaId };
    return await this.schemaRegistryService.getSchemaInfo(getSchemaDto);
  }

  /**
   * Get schema by version
   */
  @Get('schemas/:channelName/:schemaId/:version')
  @SchemaVersionParams()
  @BlockchainQuery()
  @ApiOperation({
    summary: 'Obter schema por versão',
    description: 'Retorna o schema de uma versão específica.',
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
