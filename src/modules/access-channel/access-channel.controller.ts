import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AccessChannelService } from './access-channel.service';
import { CreateChannelDto, CreateChannelResponseDto } from './dto';
import { PrivateKey } from '../../common/decorators/wallet.decorator';

@ApiTags('access-channel-manager')
@Controller('access-channel-manager')
export class AccessChannelController {
  constructor(private readonly accessChannelService: AccessChannelService) {}

  /**
   * Criar um novo canal
   */
  @Post('channels')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar um novo canal',
    description: 'Cria um novo canal de acesso na blockchain',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 201,
    description: 'Canal criado com sucesso',
    type: CreateChannelResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    example: {
      statusCode: 400,
      message: 'Nome do canal inválido',
      error: 'Bad Request',
    },
  })
  async createChannel(
    @Body() createChannelDto: CreateChannelDto,
    @PrivateKey() privateKey: string,
  ): Promise<CreateChannelResponseDto> {
    return await this.accessChannelService.createChannel(
      createChannelDto,
      privateKey,
    );
  }
}
