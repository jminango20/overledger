import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, IsIn } from 'class-validator';
import {
  ChannelNameValidation,
  IdValidation,
  NameValidation,
  DataHashValidation,
  DescriptionValidation,
  VersionValidation,
} from '@/common/decorators/validation.decorators';
import { BaseEnumConverter } from '@/common/utils/enum-converter.base';
import { BaseTransactionResponseDto } from '@/common/dto/base-response.dto';

// Schema Status Enum
export enum SchemaStatus {
  ACTIVE = 0,
  DEPRECATED = 1,
  INACTIVE = 2,
}

// String representations for API input
export const SCHEMA_STATUS_STRINGS = [
  'ACTIVE',
  'DEPRECATED',
  'INACTIVE',
] as const;
export type SchemaStatusString = (typeof SCHEMA_STATUS_STRINGS)[number];

function SchemaStatusValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Status do schema',
      enum: SCHEMA_STATUS_STRINGS,
      example: 'ACTIVE',
      type: 'string',
    })(target, propertyKey);

    // Validate that the input string is valid
    IsIn(SCHEMA_STATUS_STRINGS, {
      message: 'status deve ser um dos valores: ACTIVE, DEPRECATED, INACTIVE',
    })(target, propertyKey);
  };
}

// =============================================================
//                    INPUT DTOs
// =============================================================

export class CreateSchemaDto {
  @IdValidation('ID do schema', 'user-profile-schema')
  schemaId: string;

  @NameValidation('Nome do schema')
  name: string;

  @DataHashValidation()
  dataHash: string;

  @ChannelNameValidation()
  channelName: string;

  @DescriptionValidation()
  description?: string;
}

export class UpdateSchemaDto {
  @IdValidation('ID do schema', 'user-profile-schema')
  schemaId: string;

  @DataHashValidation()
  newDataHash: string;

  @ChannelNameValidation()
  channelName: string;

  @DescriptionValidation()
  description?: string;
}

export class DeprecateSchemaDto {
  @IdValidation('ID do schema', 'user-profile-schema')
  schemaId: string;

  @ChannelNameValidation()
  channelName: string;
}

export class InactivateSchemaDto {
  @IdValidation('ID do schema', 'user-profile-schema')
  schemaId: string;

  @VersionValidation()
  version: number;

  @ChannelNameValidation()
  channelName: string;
}

export class SetSchemaStatusDto {
  @IdValidation('ID do schema', 'user-profile-schema')
  schemaId: string;

  @VersionValidation()
  version: number;

  @ChannelNameValidation()
  channelName: string;

  @SchemaStatusValidation()
  status: SchemaStatus;
}

// =============================================================
//                    RESPONSE DTOs
// =============================================================

export class CreateSchemaResponseDto extends BaseTransactionResponseDto {
  @ApiProperty({
    description: 'ID do schema criado',
    example: 'user-profile-schema',
  })
  schemaId: string;

  @ApiProperty({
    description: 'ID do schema criado em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  schemaIdBytes32: string;

  @ApiProperty({
    description: 'Nome do schema criado',
    example: 'User Profile Schema',
  })
  name: string;

  @ApiProperty({
    description: 'Versão do schema criado (sempre 1 para novos schemas)',
    example: 1,
  })
  version: number;

  @ApiProperty({
    description: 'Nome do canal onde o schema foi criado',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Nome do canal onde o schema foi criado em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  channelNameBytes32: string;

  @ApiProperty({
    description: 'Endereço do proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class UpdateSchemaResponseDto extends BaseTransactionResponseDto {
  @ApiProperty({
    description: 'ID do schema atualizado',
    example: 'user-profile-schema',
  })
  schemaId: string;

  @ApiProperty({
    description: 'ID do schema atualizado em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  schemaIdBytes32: string;

  @ApiProperty({
    description: 'Versão anterior (que foi depreciada)',
    example: 1,
  })
  previousVersion: number;

  @ApiProperty({
    description: 'Nova versão criada (agora ativa)',
    example: 2,
  })
  newVersion: number;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Nome do canal onde o schema foi atualizado em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  channelNameBytes32: string;

  @ApiProperty({
    description: 'Endereço do proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class DeprecateSchemaResponseDto extends BaseTransactionResponseDto {
  @ApiProperty({
    description: 'ID do schema depreciado',
    example: 'user-profile-schema',
  })
  schemaId: string;

  @ApiProperty({
    description: 'ID do schema depreciado em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  schemaIdBytes32: string;

  @ApiProperty({
    description: 'Versão que foi depreciada',
    example: 2,
  })
  deprecatedVersion: number;

  @ApiProperty({
    description: 'Nome do canal onde o schema foi depreciado',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Nome do canal onde o schema foi depreciado em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  channelNameBytes32: string;

  @ApiProperty({
    description: 'Endereço do proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class InactivateSchemaResponseDto extends BaseTransactionResponseDto {
  @ApiProperty({
    description: 'ID do schema inativo',
    example: 'user-profile-schema',
  })
  schemaId: string;

  @ApiProperty({
    description: 'ID do schema inativo em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  schemaIdBytes32: string;

  @ApiProperty({
    description: 'Versão que foi inativada',
    example: 2,
  })
  inactivatedVersion: number;

  @ApiProperty({
    description: 'Status anterior da versão',
    enum: SCHEMA_STATUS_STRINGS,
    example: 'ACTIVE',
  })
  previousStatus: string;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Nome do canal onde o schema foi inativado em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  channelNameBytes32: string;

  @ApiProperty({
    description: 'Endereço do proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class SetSchemaStatusResponseDto extends BaseTransactionResponseDto {
  @ApiProperty({
    description: 'ID do schema cambiado de status',
    example: 'user-profile-schema',
  })
  schemaId: string;

  @ApiProperty({
    description: 'ID do schema cambiado de status em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  schemaIdBytes32: string;

  @ApiProperty({
    description: 'Versão do schema cambiado de status',
    example: 2,
  })
  inactivatedVersion: number;

  @ApiProperty({
    description: 'Status anterior da versão',
    enum: SCHEMA_STATUS_STRINGS,
    example: 'ACTIVE',
  })
  previousStatus: string;

  @ApiProperty({
    description: 'Status atual da versão',
    enum: SchemaStatus,
    example: SchemaStatus.DEPRECATED,
  })
  currentStatus: SchemaStatus;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description:
      'Nome do canal onde o schema foi cambiado de status em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  channelNameBytes32: string;

  @ApiProperty({
    description: 'Endereço do proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class SchemaDto {
  @ApiProperty({
    description: 'ID do schema',
    example: 'user-profile-schema',
  })
  schemaId: string;

  @ApiProperty({
    description: 'ID do schema em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  schemaIdBytes32?: string;

  @ApiProperty({
    description: 'Nome do schema',
    example: 'User Profile Schema',
  })
  name: string;

  @ApiProperty({
    description: 'Versão do schema',
    example: 1,
  })
  version: number;

  @ApiProperty({
    description: 'Hash dos dados do schema',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  dataHash: string;

  @ApiProperty({
    description: 'Proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Nome do canal onde o schema encontrado em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  channelNameBytes32: string;

  @ApiProperty({
    description: 'Status do schema',
    example: SchemaStatus.ACTIVE,
    enum: ['ACTIVE', 'DEPRECATED', 'INACTIVE'],
  })
  status: string;

  @ApiProperty({
    description: 'Timestamp de criação (Unix timestamp)',
    example: 1640995200,
  })
  createdAt: number;

  @ApiProperty({
    description: 'Timestamp da última atualização (Unix timestamp)',
    example: 1640995200,
  })
  updatedAt: number;

  @ApiProperty({
    description: 'Descrição do schema',
    example: 'Schema para validação de perfis de usuário',
    required: false,
  })
  description?: string;
}

export class SchemaInfoResponseDto {
  @ApiProperty({
    description: 'ID do schema',
    example: 'user-profile-schema',
  })
  schemaId: string;

  @ApiProperty({
    description: 'ID do schema em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  schemaIdBytes32?: string;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Nome do canal onde o schema encontrado em bytes32',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  channelNameBytes32: string;

  @ApiProperty({
    description: 'Versão mais recente',
    example: 3,
  })
  latestVersion: number;

  @ApiProperty({
    description: 'Versão atualmente ativa (0 se nenhuma estiver ativa)',
    example: 2,
  })
  activeVersion: number;
}

// =============================================================
//                    QUERY DTOs
// =============================================================

export class GetSchemaDto {
  @IdValidation('ID do schema', 'user-profile-schema')
  schemaId: string;

  @ChannelNameValidation()
  channelName: string;
}

export class GetSchemaByVersionDto extends GetSchemaDto {
  @ApiProperty({
    description: 'Versão específica do schema',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  version: number;
}

export class GetLatestSchemaResponseDto {
  @ApiProperty({
    description: 'Schema completo (versão mais recente)',
    type: SchemaDto,
  })
  schema: SchemaDto;

  @ApiProperty({
    description: 'Se esta é também a versão ativa',
    example: true,
  })
  isActiveVersion: boolean;
}

export class GetSchemaVersionsResponseDto extends GetSchemaDto {
  @ApiProperty({
    description: 'Array com números das versões existentes',
    example: [1, 2, 3],
    type: [Number],
  })
  versions: number[];

  @ApiProperty({
    description: 'Array com os schemas completos de cada versão',
    type: [SchemaDto],
  })
  schemas: SchemaDto[];

  @ApiProperty({
    description: 'Versão atualmente ativa (0 se nenhuma)',
    example: 3,
  })
  activeVersion: number;

  @ApiProperty({
    description: 'Versão mais recente',
    example: 3,
  })
  latestVersion: number;

  @ApiProperty({
    description: 'Total de versões existentes',
    example: 3,
  })
  totalVersions: number;
}

// =============================================================
//                    INTERFACES
// =============================================================

export interface SchemaInputContract {
  id: string; // Será convertido para bytes32
  name?: string;
  dataHash?: string; // Será convertido para bytes32
  channelName: string; // Será convertido para bytes32
  description?: string;
}

export interface SchemaUpdateInputContract {
  id: string; // Será convertido para bytes32
  newDataHash: string; // Será convertido para bytes32
  channelName: string; // Será convertido para bytes32
  description: string;
}

export interface SchemaCreatedEventDto {
  id: string;
  name: string;
  version: number;
  owner: string;
  channelName: string;
  timestamp: number;
}

export interface SchemaUpdatedEventDto {
  id: string;
  previousVersion: number;
  newVersion: number;
  owner: string;
  channelName: string;
  timestamp: number;
}

export interface SchemaStatusChangedEventDto {
  id: string;
  version: number;
  channelName: string;
  oldStatus: SchemaStatus;
  newStatus: SchemaStatus;
  updatedBy: string;
  timestamp: number;
}

export class SchemaStatusConverter extends BaseEnumConverter<
  typeof SchemaStatus
> {
  private static _instance: SchemaStatusConverter;

  constructor() {
    super(SchemaStatus, 'schema status');
  }

  static getInstance(): SchemaStatusConverter {
    if (!this._instance) {
      this._instance = new SchemaStatusConverter();
    }
    return this._instance;
  }

  static stringToEnum(value: string): SchemaStatus {
    return this.getInstance().stringToEnum(value);
  }

  static enumToString(enumValue: SchemaStatus): string {
    return this.getInstance().enumToString(enumValue);
  }
}
