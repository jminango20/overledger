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
