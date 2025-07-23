import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, IsIn } from 'class-validator';
import {
  ChannelNameValidation,
  IdValidation,
  NameValidation,
  DataHashValidation,
  DescriptionValidation,
} from '../../../common/decorators/validation.decorators';

function VersionValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Versão do schema',
      example: '1',
      minimum: 1,
      nullable: false,
      required: true,
      type: 'integer',
    })(target, propertyKey);

    IsNumber()(target, propertyKey);
    Min(1)(target, propertyKey);
  };
}

// Base response interface
interface BaseTransactionResponse {
  success: boolean;
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: string;
}

// Base response class
abstract class BaseSchemaResponseDto implements BaseTransactionResponse {
  @ApiProperty({
    description: 'Se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Hash da transação',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  transactionHash: string;

  @ApiProperty({
    description: 'Número do bloco onde a transação foi minerada',
    example: 18500000,
    required: false,
  })
  blockNumber?: number;

  @ApiProperty({
    description: 'Gas usado na transação',
    example: '21000',
    required: false,
  })
  gasUsed?: string;
}

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

// Utility class for status conversion
export class SchemaStatusConverter {
  static stringToEnum(statusString: string): SchemaStatus {
    const upperStatus = statusString.toUpperCase();
    switch (upperStatus) {
      case 'ACTIVE':
        return SchemaStatus.ACTIVE;
      case 'DEPRECATED':
        return SchemaStatus.DEPRECATED;
      case 'INACTIVE':
        return SchemaStatus.INACTIVE;
      default:
        throw new Error(`Invalid schema status: ${statusString}`);
    }
  }

  static enumToString(status: SchemaStatus): string {
    switch (status) {
      case SchemaStatus.ACTIVE:
        return 'ACTIVE';
      case SchemaStatus.DEPRECATED:
        return 'DEPRECATED';
      case SchemaStatus.INACTIVE:
        return 'INACTIVE';
      default:
        throw new Error(`Invalid schema status enum: ${status as string}`);
    }
  }

  static isValidStatusString(status: string): boolean {
    return SCHEMA_STATUS_STRINGS.includes(
      status.toUpperCase() as SchemaStatusString,
    );
  }
}

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
  @IdValidation('do schema', 'user-profile-schema')
  schemaId: string;

  @NameValidation('do schema')
  name: string;

  @DataHashValidation()
  dataHash: string;

  @ChannelNameValidation()
  channelName: string;

  @DescriptionValidation()
  description?: string;
}

export class UpdateSchemaDto {
  @IdValidation('do schema', 'user-profile-schema')
  schemaId: string;

  @DataHashValidation()
  newDataHash: string;

  @ChannelNameValidation()
  channelName: string;

  @DescriptionValidation()
  description?: string;
}

export class DeprecateSchemaDto {
  @IdValidation('do schema', 'user-profile-schema')
  schemaId: string;

  @ChannelNameValidation()
  channelName: string;
}

export class InactivateSchemaDto {
  @IdValidation('do schema', 'user-profile-schema')
  schemaId: string;

  @VersionValidation()
  version: number;

  @ChannelNameValidation()
  channelName: string;
}

export class SetSchemaStatusDto {
  @IdValidation('do schema', 'user-profile-schema')
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

export class CreateSchemaResponseDto extends BaseSchemaResponseDto {
  @ApiProperty({
    description: 'ID do schema criado',
    example: 'user-profile-schema',
  })
  schemaId: string;

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
    description: 'Endereço do proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class UpdateSchemaResponseDto extends BaseSchemaResponseDto {
  @ApiProperty({
    description: 'ID do schema atualizado',
    example: 'user-profile-schema',
  })
  schemaId: string;

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
    description: 'Endereço do proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class DeprecateSchemaResponseDto extends BaseSchemaResponseDto {
  @ApiProperty({
    description: 'ID do schema depreciado',
    example: 'user-profile-schema',
  })
  schemaId: string;

  @ApiProperty({
    description: 'Versão que foi depreciada',
    example: 2,
  })
  deprecatedVersion: number;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Endereço do proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class InactivateSchemaResponseDto extends BaseSchemaResponseDto {
  @ApiProperty({
    description: 'ID do schema inativo',
    example: 'user-profile-schema',
  })
  schemaId: string;

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
    description: 'Endereço do proprietário do schema',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class SetSchemaStatusResponseDto extends BaseSchemaResponseDto {
  @ApiProperty({
    description: 'ID do schema cambiado de status',
    example: 'user-profile-schema',
  })
  schemaId: string;

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
  id: string;

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
    description: 'Status do schema',
    example: SchemaStatus.ACTIVE,
    enum: ['ACTIVE', 'DEPRECATED', 'INACTIVE'],
  })
  statusName: string;

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
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

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

  @ApiProperty({
    description: 'Se existe uma versão ativa',
    example: true,
  })
  hasActiveVersion: boolean;

  @ApiProperty({
    description: 'Proprietário do schema (da versão mais recente)',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;

  @ApiProperty({
    description: 'Total de versões do schema',
    example: 3,
  })
  totalVersions: number;
}

// =============================================================
//                    QUERY DTOs
// =============================================================

export class GetSchemaDto {
  @IdValidation('do schema', 'user-profile-schema')
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
  name: string;
  dataHash: string; // Será convertido para bytes32
  channelName: string; // Será convertido para bytes32
  description: string;
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
