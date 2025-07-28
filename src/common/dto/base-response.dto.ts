import { ApiProperty } from '@nestjs/swagger';
import {
  TransactionHashValidation,
  BlockNumberValidation,
  GasUsedValidation,
  TimestampValidation,
} from '../decorators/validation.decorators';

export abstract class BaseTransactionResponseDto {
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
  @TransactionHashValidation()
  transactionHash: string;

  @ApiProperty({
    description: 'Número do bloco onde a transação foi minerada',
    example: 18500000,
    required: false,
  })
  @BlockNumberValidation()
  blockNumber?: number;

  @ApiProperty({
    description: 'Gas usado na transação',
    example: '21000',
    required: false,
  })
  @GasUsedValidation()
  gasUsed?: string;

  @ApiProperty({
    description: 'Timestamp quando a transação foi processada',
    example: 1640995200,
    required: false,
    type: 'integer',
  })
  @TimestampValidation('processedAt')
  processedAt?: number;

  @ApiProperty({
    description: 'Network onde a transação foi executada',
    example: 'localhost',
    required: false,
  })
  network?: string;
}

export abstract class BaseQueryResponseDto {
  @ApiProperty({
    description: 'Se a consulta foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Timestamp da consulta',
    example: 1640995200,
    type: 'integer',
  })
  @TimestampValidation('queriedAt')
  queriedAt: number;

  @ApiProperty({
    description: 'Network consultada',
    example: 'localhost',
    required: false,
  })
  network?: string;
}

export abstract class BaseBatchResponseDto extends BaseTransactionResponseDto {
  @ApiProperty({
    description: 'Total de itens processados com sucesso',
    example: 5,
    type: 'integer',
  })
  successCount: number;

  @ApiProperty({
    description: 'Total de itens que falharam',
    example: 0,
    type: 'integer',
  })
  failureCount: number;

  @ApiProperty({
    description: 'Lista de erros (se houver)',
    example: [],
    required: false,
    type: [String],
  })
  errors?: string[];
}

export abstract class SchemaBaseResponseDto extends BaseTransactionResponseDto {
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

export abstract class ProcessBaseResponseDto extends BaseTransactionResponseDto {
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
}

export abstract class BaseChannelResponseDto extends BaseTransactionResponseDto {
  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;
}
