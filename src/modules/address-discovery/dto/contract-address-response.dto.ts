import { ApiProperty } from '@nestjs/swagger';

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
