import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

// Constants for better maintainability
const CHANNEL_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const CHANNEL_NAME_ERROR_MESSAGE =
  'channelName deve conter apenas letras, números, underscore e hífen';
const CHANNEL_NAME_MIN_LENGTH = 1;
const CHANNEL_NAME_MAX_LENGTH = 50;

const SCHEMA_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const SCHEMA_ID_ERROR_MESSAGE =
  'schemaId deve conter apenas letras, números, underscore e hífen';
const SCHEMA_ID_MIN_LENGTH = 1;
const SCHEMA_ID_MAX_LENGTH = 50;

const SCHEMA_NAME_MIN_LENGTH = 1;
const SCHEMA_NAME_MAX_LENGTH = 100;

const DESCRIPTION_MAX_LENGTH = 255;

const DATA_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const DATA_HASH_ERROR_MESSAGE =
  'dataHash deve ser um hash válido (0x + 64 caracteres hexadecimais)';

// Validation decorators
function ChannelNameValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Nome do canal',
      example: 'my-awesome-channel',
      minLength: CHANNEL_NAME_MIN_LENGTH,
      maxLength: CHANNEL_NAME_MAX_LENGTH,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(CHANNEL_NAME_MIN_LENGTH, CHANNEL_NAME_MAX_LENGTH)(
      target,
      propertyKey,
    );
    Matches(CHANNEL_NAME_REGEX, { message: CHANNEL_NAME_ERROR_MESSAGE })(
      target,
      propertyKey,
    );
  };
}

function SchemaIdValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Identificador único do schema',
      example: 'user-profile-schema',
      minLength: SCHEMA_ID_MIN_LENGTH,
      maxLength: SCHEMA_ID_MAX_LENGTH,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(SCHEMA_ID_MIN_LENGTH, SCHEMA_ID_MAX_LENGTH)(target, propertyKey);
    Matches(SCHEMA_ID_REGEX, { message: SCHEMA_ID_ERROR_MESSAGE })(
      target,
      propertyKey,
    );
  };
}

function SchemaNameValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Nome do schema',
      example: 'User Profile Schema',
      minLength: SCHEMA_NAME_MIN_LENGTH,
      maxLength: SCHEMA_NAME_MAX_LENGTH,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(SCHEMA_NAME_MIN_LENGTH, SCHEMA_NAME_MAX_LENGTH)(target, propertyKey);
  };
}

function DataHashValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Hash dos dados do schema (keccak256 do JSON schema)',
      example:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Matches(DATA_HASH_REGEX, { message: DATA_HASH_ERROR_MESSAGE })(
      target,
      propertyKey,
    );
  };
}

function DescriptionValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Descrição do schema',
      example: 'Schema para validação de perfis de usuário',
      maxLength: DESCRIPTION_MAX_LENGTH,
      required: false,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsOptional()(target, propertyKey);
    Length(0, DESCRIPTION_MAX_LENGTH)(target, propertyKey);
  };
}

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

// =============================================================
//                    INPUT DTOs
// =============================================================

export class CreateSchemaDto {
  @SchemaIdValidation()
  schemaId: string;

  @SchemaNameValidation()
  name: string;

  @DataHashValidation()
  dataHash: string;

  @ChannelNameValidation()
  channelName: string;

  @DescriptionValidation()
  description?: string;
}

export class UpdateSchemaDto {
  @SchemaIdValidation()
  schemaId: string;

  @DataHashValidation()
  newDataHash: string;

  @ChannelNameValidation()
  channelName: string;

  @DescriptionValidation()
  description?: string;
}

export class DeprecateSchemaDto {
  @SchemaIdValidation()
  schemaId: string;

  @ChannelNameValidation()
  channelName: string;
}

export class InactiveSchemaDto {
  @SchemaIdValidation()
  schemaId: string;

  @VersionValidation()
  version: number;

  @ChannelNameValidation()
  channelName: string;
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

export class InactiveSchemaResponseDto extends BaseSchemaResponseDto {
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
    enum: SchemaStatus,
    example: SchemaStatus.ACTIVE,
  })
  status: SchemaStatus;

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
  @SchemaIdValidation()
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
