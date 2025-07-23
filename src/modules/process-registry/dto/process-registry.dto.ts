import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// =============================================================
//                        ENUMS
// =============================================================

export enum ProcessStatus {
  ACTIVE = 0,
  INACTIVE = 1,
}

export enum ProcessAction {
  CREATE_ASSET = 0,
  UPDATE_ASSET = 1,
  CREATE_DOCUMENT = 2,
  TRANSFER_ASSET = 3,
  TRANSFORM_ASSET = 4,
  SPLIT_ASSET = 5,
  GROUP_ASSET = 6,
  UNGROUP_ASSET = 7,
  INACTIVATE_ASSET = 8,
}

// String representations for API
export const PROCESS_STATUS_STRINGS = ['ACTIVE', 'INACTIVE'] as const;

export const PROCESS_ACTION_STRINGS = [
  'CREATE_ASSET',
  'UPDATE_ASSET',
  'CREATE_DOCUMENT',
  'TRANSFER_ASSET',
  'TRANSFORM_ASSET',
  'SPLIT_ASSET',
  'GROUP_ASSET',
  'UNGROUP_ASSET',
  'INACTIVATE_ASSET',
] as const;

export type ProcessStatusString = (typeof PROCESS_STATUS_STRINGS)[number];
export type ProcessActionString = (typeof PROCESS_ACTION_STRINGS)[number];

// Validation decorators
function ProcessIdValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Identificador único do processo',
      example: 'coffee-process',
      minLength: 1,
      maxLength: 50,
    })(target, propertyKey);
    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(1, 50)(target, propertyKey);
    Matches(/^[a-zA-Z0-9_-]+$/, {
      message:
        'processId deve conter apenas letras, números, underscore e hífen',
    })(target, propertyKey);
  };
}

function NatureIdValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Identificador da natureza do processo',
      example: 'coffee-onboarding',
      minLength: 1,
      maxLength: 50,
    })(target, propertyKey);
    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(1, 50)(target, propertyKey);
    Matches(/^[a-zA-Z0-9_-]+$/, {
      message:
        'natureId deve conter apenas letras, números, underscore e hífen',
    })(target, propertyKey);
  };
}

function StageIdValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Identificador do estágio do processo',
      example: 'coffee-verification',
      minLength: 1,
      maxLength: 50,
    })(target, propertyKey);
    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(1, 50)(target, propertyKey);
    Matches(/^[a-zA-Z0-9_-]+$/, {
      message: 'stageId deve conter apenas letras, números, underscore e hífen',
    })(target, propertyKey);
  };
}

function ChannelNameValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Nome do canal',
      example: 'my-awesome-channel',
      minLength: 1,
      maxLength: 50,
    })(target, propertyKey);
    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(1, 50)(target, propertyKey);
    Matches(/^[a-zA-Z0-9_-]+$/, {
      message:
        'channelName deve conter apenas letras, números, underscore e hífen',
    })(target, propertyKey);
  };
}

function ProcessActionValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Ação do processo',
      enum: PROCESS_ACTION_STRINGS,
      example: 'CREATE',
    })(target, propertyKey);
    IsEnum(ProcessAction, {
      message:
        'action deve ser um dos valores: CREATE_ASSET, UPDATE_ASSET, CREATE_DOCUMENT, TRANSFER_ASSET, TRANSFORM_ASSET, SPLIT_ASSET, GROUP_ASSET, UNGROUP_ASSET, INACTIVATE_ASSET',
    })(target, propertyKey);
  };
}

function ProcessStatusValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Status do processo',
      enum: PROCESS_STATUS_STRINGS,
      example: 'ACTIVE',
    })(target, propertyKey);
    IsEnum(ProcessStatus, {
      message: 'status deve ser um dos valores: ACTIVE, INACTIVE',
    })(target, propertyKey);
  };
}

// =============================================================
//                        NESTED DTOs
// =============================================================

export class SchemaReferenceDto {
  @ApiProperty({
    description: 'ID do schema referenciado',
    example: 'user-profile-schema',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  schemaId: string;

  @ApiProperty({
    description: 'Versão do schema',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  version: number;
}

// =============================================================
//                        INPUT DTOs
// =============================================================

export class CreateProcessDto {
  @ProcessIdValidation()
  processId: string;

  @NatureIdValidation()
  natureId: string;

  @StageIdValidation()
  stageId: string;

  @ApiProperty({
    description: 'Array de schemas requeridos para este processo',
    type: [SchemaReferenceDto],
    example: [
      { schemaId: 'user-profile-schema', version: 1 },
      { schemaId: 'document-schema', version: 2 },
    ],
  })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10) // Prevent abuse
  @ValidateNested({ each: true })
  @Type(() => SchemaReferenceDto)
  schemas: SchemaReferenceDto[];

  @ProcessActionValidation()
  action: ProcessAction;

  @ApiProperty({
    description: 'Descrição do processo',
    example: 'Processo de onboarding de novos usuários',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  description?: string;

  @ChannelNameValidation()
  channelName: string;
}

export class UpdateProcessStatusDto {
  @ProcessIdValidation()
  processId: string;

  @NatureIdValidation()
  natureId: string;

  @StageIdValidation()
  stageId: string;

  @ChannelNameValidation()
  channelName: string;

  @ProcessStatusValidation()
  newStatus: ProcessStatus;
}

export class InactivateProcessDto {
  @ProcessIdValidation()
  processId: string;

  @NatureIdValidation()
  natureId: string;

  @StageIdValidation()
  stageId: string;

  @ChannelNameValidation()
  channelName: string;
}

export class GetProcessDto {
  @ProcessIdValidation()
  processId: string;

  @NatureIdValidation()
  natureId: string;

  @StageIdValidation()
  stageId: string;

  @ChannelNameValidation()
  channelName: string;
}

// =============================================================
//                        RESPONSE DTOs
// =============================================================

abstract class BaseProcessResponseDto {
  @ApiProperty({
    description: 'Se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Hash da transação',
    example: '0x1234567890abcdef...',
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

export class CreateProcessResponseDto extends BaseProcessResponseDto {
  @ApiProperty({
    description: 'ID do processo criado',
    example: 'coffee-process',
  })
  processId: string;

  @ApiProperty({
    description: 'ID da natureza do processo',
    example: 'coffee-onboarding',
  })
  natureId: string;

  @ApiProperty({
    description: 'ID do estágio do processo',
    example: 'coffee-verification',
  })
  stageId: string;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Endereço do proprietário do processo',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;

  @ApiProperty({
    description: 'Ação do processo',
    enum: PROCESS_ACTION_STRINGS,
    example: 'CREATE',
  })
  action: string;
}

export class UpdateProcessStatusResponseDto extends BaseProcessResponseDto {
  @ApiProperty({
    description: 'ID do processo atualizado',
    example: 'coffe-process',
  })
  processId: string;

  @ApiProperty({
    description: 'Status anterior',
    enum: PROCESS_STATUS_STRINGS,
    example: 'ACTIVE',
  })
  previousStatus: string;

  @ApiProperty({
    description: 'Novo status',
    enum: PROCESS_STATUS_STRINGS,
    example: 'COMPLETED',
  })
  newStatus: string;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Endereço do proprietário',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;
}

export class ProcessDto {
  @ApiProperty({
    description: 'ID do processo',
    example: 'coffe-process',
  })
  processId: string;

  @ApiProperty({
    description: 'ID da natureza',
    example: 'coffee-onboarding',
  })
  natureId: string;

  @ApiProperty({
    description: 'ID do estágio',
    example: 'coffee-verification',
  })
  stageId: string;

  @ApiProperty({
    description: 'Schemas associados ao processo',
    type: [SchemaReferenceDto],
  })
  schemas: SchemaReferenceDto[];

  @ApiProperty({
    description: 'Ação do processo',
    enum: PROCESS_ACTION_STRINGS,
    example: 'CREATE',
  })
  action: string;

  @ApiProperty({
    description: 'Descrição do processo',
    example: 'Processo de onboarding',
  })
  description: string;

  @ApiProperty({
    description: 'Proprietário do processo',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  owner: string;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Status do processo',
    enum: PROCESS_STATUS_STRINGS,
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Timestamp de criação',
    example: 1640995200,
  })
  createdAt: number;

  @ApiProperty({
    description: 'Timestamp da última atualização',
    example: 1640995200,
  })
  lastUpdated: number;
}

export class ProcessValidationResponseDto {
  @ApiProperty({
    description: 'Se o processo é válido para submissão',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Razão da validação (se inválido)',
    example: 'Schema not active in channel',
    required: false,
  })
  reason?: string;
}

// =============================================================
//                        CONTRACT INTERFACES
// =============================================================

export interface SchemaReferenceContract {
  schemaId: string; // bytes32
  version: number;
}

export interface ProcessInputContract {
  processId: string; // bytes32
  natureId: string; // bytes32
  stageId: string; // bytes32
  schemas: SchemaReferenceContract[];
  action: ProcessAction;
  description: string;
  channelName: string; // bytes32
}

// =============================================================
//                        UTILITY CONVERTERS
// =============================================================

export class ProcessStatusConverter {
  static stringToEnum(statusString: string): ProcessStatus {
    const upperStatus = statusString.toUpperCase();
    switch (upperStatus) {
      case 'ACTIVE':
        return ProcessStatus.ACTIVE;
      case 'INACTIVE':
        return ProcessStatus.INACTIVE;
      default:
        throw new Error(`Invalid process status: ${statusString}`);
    }
  }

  static enumToString(status: ProcessStatus): string {
    switch (status) {
      case ProcessStatus.ACTIVE:
        return 'ACTIVE';
      case ProcessStatus.INACTIVE:
        return 'INACTIVE';
      default:
        throw new Error(`Invalid process status enum: ${status as string}`);
    }
  }
}

export class ProcessActionConverter {
  static stringToEnum(actionString: string): ProcessAction {
    const upperAction = actionString.toUpperCase();
    switch (upperAction) {
      case 'CREATE_ASSET':
        return ProcessAction.CREATE_ASSET;
      case 'UPDATE_ASSET':
        return ProcessAction.UPDATE_ASSET;
      case 'CREATE_DOCUMENT':
        return ProcessAction.CREATE_DOCUMENT;
      case 'TRANSFER_ASSET':
        return ProcessAction.TRANSFER_ASSET;
      case 'TRANSFORM_ASSET':
        return ProcessAction.TRANSFORM_ASSET;
      case 'SPLIT_ASSET':
        return ProcessAction.SPLIT_ASSET;
      case 'GROUP_ASSET':
        return ProcessAction.GROUP_ASSET;
      case 'UNGROUP_ASSET':
        return ProcessAction.UNGROUP_ASSET;
      case 'INACTIVATE_ASSET':
        return ProcessAction.INACTIVATE_ASSET;
      default:
        throw new Error(`Invalid process action: ${actionString}`);
    }
  }

  static enumToString(action: ProcessAction): string {
    switch (action) {
      case ProcessAction.CREATE_ASSET:
        return 'CREATE_ASSET';
      case ProcessAction.UPDATE_ASSET:
        return 'UPDATE_ASSET';
      case ProcessAction.CREATE_DOCUMENT:
        return 'CREATE_DOCUMENT';
      case ProcessAction.TRANSFER_ASSET:
        return 'TRANSFER_ASSET';
      case ProcessAction.TRANSFORM_ASSET:
        return 'TRANSFORM_ASSET';
      case ProcessAction.SPLIT_ASSET:
        return 'SPLIT_ASSET';
      case ProcessAction.GROUP_ASSET:
        return 'GROUP_ASSET';
      case ProcessAction.UNGROUP_ASSET:
        return 'UNGROUP_ASSET';
      case ProcessAction.INACTIVATE_ASSET:
        return 'INACTIVATE_ASSET';
      default:
        throw new Error(`Invalid process action enum: ${action as string}`);
    }
  }
}
