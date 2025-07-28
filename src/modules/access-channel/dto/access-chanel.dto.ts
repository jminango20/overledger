import { ApiProperty } from '@nestjs/swagger';
import {
  IsEthereumAddress,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  BaseChannelMemberDto,
  BaseChannelOperationDto,
  BaseChannelResponseDto,
  BaseChannelDto,
  ChannelNameValidation,
} from '@/common/dto';

// Base class for channel name input

// Specific DTOs extending base classes
export class CreateChannelDto extends BaseChannelDto {}

export class ActivateChannelDto extends BaseChannelDto {}

export class DeactivateChannelDto extends BaseChannelDto {}

export class ChannelNameDto extends BaseChannelDto {}

export class NumberResponseDto {
  @ApiProperty({
    description: 'Número de canais',
    example: 10,
  })
  number: number;
}

export class ChannelMemberDto extends BaseChannelMemberDto {}

export class ChannelMembersDto extends BaseChannelOperationDto {
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
  @IsEthereumAddress({
    each: true,
    message: 'Os endereços deve ser endereços Ethereum válidos',
  })
  memberAddresses: string[];
}

export class CheckMemberDto extends BaseChannelMemberDto {}

export class CheckMultipleMembersDto {
  @ApiProperty({
    description: 'Array de endereços dos membros a serem verificados',
    example: [
      '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
      '0x8ba1f109551bD432803012645Hac136c0c8454A',
      '0x1234567890abcdef1234567890abcdef12345678',
    ],
    type: [String],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsEthereumAddress({
    each: true,
    message: 'Os endereços deve ser endereços Ethereum válidos',
  })
  memberAddresses: string[];
}

// =============================================================
//                    RESPONSES
// =============================================================

export class ChannelInfoResponseDto extends BaseChannelDto {
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
}

export class DeactivateChannelResponseDto extends BaseChannelResponseDto {
  @ApiProperty({
    description: 'Canal desativado',
    example: 'my-awesome-channel',
  })
  declare channelName: string;
}
export class ActivateChannelResponseDto extends BaseChannelResponseDto {}
export class CreateChannelResponseDto extends BaseChannelResponseDto {}
export class NumberMembersInChannelResponseDto extends BaseChannelResponseDto {
  @ApiProperty({
    description: 'Número de membros no canal',
    example: 10,
  })
  memberCount: number;
}
export class ChannelMemberResponseDto extends BaseChannelResponseDto {
  @ApiProperty({
    description: 'Endereço do novo membro',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
    type: String,
  })
  addressMember: string;
}

export class ChannelMembersResponseDto extends BaseChannelResponseDto {
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
    description: 'Número de endereços processados na transação',
    example: 2,
  })
  addressCount: number;
}

export class MembersResponseDto extends BaseChannelResponseDto {
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

export class MembershipCheckResponseDto extends BaseChannelResponseDto {
  @ApiProperty({
    description: 'Se o endereço é membro do canal',
    example: true,
  })
  isMember: boolean;

  @ApiProperty({
    description: 'Endereço verificado',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
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
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 1;
    }
    const num = Number(value);
    return isNaN(num) ? 1 : num;
  })
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: 'Número de itens por página',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 200,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 50;
    }
    const num = Number(value);
    return isNaN(num) ? 50 : num;
  })
  @IsNumber()
  @Min(1)
  @Max(200)
  pageSize: number = 50;
}

export class GetMembersDto extends PaginationDto {
  @ApiProperty({
    description: 'Nome do canal',
    example: 'channel-1',
  })
  @ChannelNameValidation()
  channelName: string;
}
