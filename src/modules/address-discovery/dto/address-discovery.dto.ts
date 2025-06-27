import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';

export class UpdateAddressDto {
  @ApiProperty({
    description: 'Nome do contrato a ser atualizado',
    example: 'ACCESS_CHANNEL_MANAGER',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  contractName: string;

  @ApiProperty({
    description: 'Novo endereço do contrato (formato Ethereum)',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'newAddress deve ser um endereço Ethereum válido',
  })
  newAddress: string;
}

export class GetContractAddressDto {
  @ApiProperty({
    description: 'Nome do contrato',
    example: 'ACCESS_CHANNEL_MANAGER',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  contractName: string;
}

export class ContractAddressResponseDto {
  @ApiProperty({
    description: 'Nome do contrato',
    example: 'ACCESS_CHANNEL_MANAGER',
  })
  contractName: string;

  @ApiProperty({
    description: 'Endereço atual do contrato',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  address: string;

  @ApiProperty({
    description: 'Se o contrato está registrado',
    example: true,
  })
  isRegistered: boolean;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  lastUpdated?: Date;

  @ApiProperty({
    description: 'Endereço de quem fez a última atualização',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
    required: false,
  })
  updatedBy?: string;
}

export class UpdateAddressResponseDto {
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
    description: 'Nome do contrato atualizado',
    example: 'ACCESS_CHANNEL_MANAGER',
  })
  contractName: string;

  @ApiProperty({
    description: 'Endereço anterior do contrato',
    example: '0x1111111111111111111111111111111111111111',
    required: false,
  })
  oldAddress?: string;

  @ApiProperty({
    description: 'Novo endereço do contrato',
    example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
  })
  newAddress: string;

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
