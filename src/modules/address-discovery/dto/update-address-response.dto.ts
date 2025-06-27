import { ApiProperty } from '@nestjs/swagger';

export class UpdateAddressResponseDto {
  @ApiProperty({
    description: 'Se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Hash da transação',
    example: '0x...',
  })
  transactionHash: string;

  @ApiProperty({
    description: 'Nome do contrato atualizado',
    example: 'ACCESS_CHANNEL_MANAGER',
  })
  contractName: string;

  @ApiProperty({
    description: 'Endereço anterior do contrato',
    example: '0x...',
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
