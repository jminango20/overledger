import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsEthereumAddress,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

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

function AddressValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Endereço Ethereum',
      example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    IsEthereumAddress()(target, propertyKey);
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

// Base class for channel name input
abstract class BaseChannelMemberDto {
  @ChannelNameValidation()
  channelName: string;
  @AddressValidation()
  addressMember: string;
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

export class ChannelMemberDto extends BaseChannelMemberDto {}

export class ChannelMemberResponseDto extends BaseChannelResponseDto {
  @ApiProperty({
    description: 'Endereço do novo membro',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  addressMember: string;
}

export class AddMembersDto {
  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  channelName: string;

  @ApiProperty({
    description: 'Array de endereços dos membros a serem adicionados',
    example: [
      '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
      '0x8ba1f109551bD432803012645Hac136c0c8454A',
    ],
    type: [String],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsEthereumAddress({ each: true })
  memberAddresses: string[];
}

export class CheckMemberDto {
  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  channelName: string;

  @ApiProperty({
    description: 'Endereço do membro a ser verificado',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  @IsString()
  @IsNotEmpty()
  @IsEthereumAddress()
  memberAddress: string;
}

// =============================================================
//                    PAGINATION DTOs
// =============================================================

export class PaginationDto {
  @ApiProperty({
    description: 'Número da página (iniciando em 1)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Número de itens por página',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}

export class GetMembersDto extends PaginationDto {
  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  channelName: string;
}

// =============================================================
//                    RESPONSES
// =============================================================
export class AddChannelMembersResponseDto extends BaseChannelResponseDto {
  @ApiProperty({
    description: 'Lista de endereços dos novos membros',
    example: [
      '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
      '0x8ba1f109551bD432803012645Hac136c0c8454A',
    ],
    type: [String],
  })
  addressMembers: string[];

  @ApiProperty({
    description: 'Número de membros adicionados com sucesso',
    example: 2,
  })
  addedCount: number;
}

export class MembersResponseDto {
  @ApiProperty({
    description: 'Lista de endereços dos membros',
    example: [
      '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
      '0x8ba1f109551bD432803012645Hac136c0c8454A',
    ],
    type: [String],
  })
  members: string[];

  @ApiProperty({
    description: 'Total de membros no canal',
    example: 25,
  })
  totalMembers: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Se há próxima página',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Página atual',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  channelName: string;
}

export class ChannelsResponseDto {
  @ApiProperty({
    description: 'Lista de nomes dos canais',
    example: ['channel-1', 'channel-2', 'my-awesome-channel'],
    type: [String],
  })
  channels: string[];

  @ApiProperty({
    description: 'Total de canais',
    example: 10,
  })
  totalChannels: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 2,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Se há próxima página',
    example: false,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Página atual',
    example: 1,
  })
  currentPage: number;
}

export class MembershipCheckResponseDto {
  @ApiProperty({
    description: 'Se o endereço é membro do canal',
    example: true,
  })
  isMember: boolean;

  @ApiProperty({
    description: 'Nome do canal verificado',
    example: 'my-awesome-channel',
  })
  channelName: string;

  @ApiProperty({
    description: 'Endereço verificado',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  memberAddress: string;
}
