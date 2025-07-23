import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ChannelNameValidation,
  IdValidation,
  DescriptionValidation,
} from '../../../common/decorators/validation.decorators';
import { MAX_SCHEMAS_PER_PROCESS } from '../../../common/constants/validation.constants';
import { BaseEnumConverter } from '../../../common/utils/enum-converter.base';
import { BaseTransactionResponseDto } from '../../../common/dto/base-response.dto';

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
  @IdValidation('do processo', 'coffee-process')
  processId: string;

  @IdValidation('da natureza', 'coffee-onboarding')
  natureId: string;

  @IdValidation('do estágio', 'coffee-verification')
  stageId: string;

  @ApiProperty({
    description: 'Schemas requeridos para este processo',
    type: [SchemaReferenceDto],
    maxItems: MAX_SCHEMAS_PER_PROCESS,
  })
  @IsArray()
  @ArrayMaxSize(MAX_SCHEMAS_PER_PROCESS)
  @ValidateNested({ each: true })
  @Type(() => SchemaReferenceDto)
  schemas: SchemaReferenceDto[];

  @ProcessActionValidation()
  action: ProcessAction;

  @DescriptionValidation()
  description?: string;

  @ChannelNameValidation()
  channelName: string;
}

export class UpdateProcessStatusDto {
  @IdValidation('do processo', 'coffee-process')
  processId: string;

  @IdValidation('da natureza', 'coffee-onboarding')
  natureId: string;

  @IdValidation('do estágio', 'coffee-verification')
  stageId: string;

  @ChannelNameValidation()
  channelName: string;

  @ProcessStatusValidation()
  newStatus: ProcessStatus;
}

export class InactivateProcessDto {
  @IdValidation('do processo', 'coffee-process')
  processId: string;

  @IdValidation('da natureza', 'coffee-onboarding')
  natureId: string;

  @IdValidation('do estágio', 'coffee-verification')
  stageId: string;

  @ChannelNameValidation()
  channelName: string;
}

export class GetProcessDto {
  @IdValidation('do processo', 'coffee-process')
  processId: string;

  @IdValidation('da natureza', 'coffee-onboarding')
  natureId: string;

  @IdValidation('do estágio', 'coffee-verification')
  stageId: string;

  @ChannelNameValidation()
  channelName: string;
}

// =============================================================
//                        RESPONSE DTOs
// =============================================================

export class CreateProcessResponseDto extends BaseTransactionResponseDto {
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

export class UpdateProcessStatusResponseDto extends BaseTransactionResponseDto {
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

export class ProcessStatusConverter extends BaseEnumConverter<
  typeof ProcessStatus
> {
  constructor() {
    super(ProcessStatus, 'process status');
  }
}

export class ProcessActionConverter extends BaseEnumConverter<
  typeof ProcessAction
> {
  constructor() {
    super(ProcessAction, 'process action');
  }
}
