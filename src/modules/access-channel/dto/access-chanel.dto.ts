import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({
    description: 'Nome do canal a ser criado',
    example: 'my-awesome-channel',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'channelName deve conter apenas letras, números, underscore e hífen',
  })
  channelName: string;
}

export class CreateChannelResponseDto {
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
    description: 'Nome do canal criado',
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
