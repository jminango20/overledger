import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

// Constants for better maintainability and performance
const CHANNEL_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const CHANNEL_NAME_ERROR_MESSAGE =
  'channelName deve conter apenas letras, números, underscore e hífen';
const CHANNEL_NAME_MIN_LENGTH = 1;
const CHANNEL_NAME_MAX_LENGTH = 50;

// Base validation decorator factory to avoid repetition
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

// Base class for channel name input
abstract class BaseChannelDto {
  @ChannelNameValidation()
  channelName: string;
}

// Base response interface for transaction responses
interface BaseTransactionResponse {
  success: boolean;
  transactionHash: string;
  channelName: string;
  blockNumber?: number;
  gasUsed?: string;
}

// Base class for transaction responses to reduce duplication
abstract class BaseChannelResponseDto implements BaseTransactionResponse {
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
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;

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

// Specific DTOs extending base classes
export class CreateChannelDto extends BaseChannelDto {}

export class CreateChannelResponseDto extends BaseChannelResponseDto {
  @ApiProperty({
    description: 'Nome do canal criado',
    example: 'my-awesome-channel',
  })
  declare channelName: string;
}

export class ActivateChannelDto extends BaseChannelDto {}

export class ActivateChannelResponseDto extends BaseChannelResponseDto {
  @ApiProperty({
    description: 'Canal ativado',
    example: 'my-awesome-channel',
  })
  declare channelName: string;
}

export class DeactivateChannelDto extends BaseChannelDto {}

export class DeactivateChannelResponseDto extends BaseChannelResponseDto {
  @ApiProperty({
    description: 'Canal desativado',
    example: 'my-awesome-channel',
  })
  declare channelName: string;
}

export class ChannelNameDto extends BaseChannelDto {}

export class ChannelInfoResponseDto {
  @ApiProperty({
    description: 'Se o canal existe',
    example: true,
  })
  exists: boolean;

  @ApiProperty({
    description: 'Se o canal está ativo',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Endereço do criador do canal',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  creator: string;

  @ApiProperty({
    description: 'Número de membros no canal',
    example: 25,
  })
  memberCount: number;

  @ApiProperty({
    description: 'Timestamp de criação do canal (Unix timestamp)',
    example: 1640995200,
  })
  createdAt: number;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;
}

export class NumberResponseDto {
  @ApiProperty({
    description: 'Número de canais',
    example: 10,
  })
  number: number;
}

export class NumberMembersInChannelResponseDto {
  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;
  @ApiProperty({
    description: 'Número de membros no canal',
    example: 10,
  })
  memberCount: number;
}
