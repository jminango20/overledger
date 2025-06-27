import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

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
