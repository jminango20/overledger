import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { AccessChannelService } from './access-channel.service';
import {
  CreateChannelDto,
  CreateChannelResponseDto,
  ActivateChannelDto,
  ActivateChannelResponseDto,
  DeactivateChannelDto,
  DeactivateChannelResponseDto,
  ChannelNameDto,
  ChannelInfoResponseDto,
} from './dto';
import { PrivateKey } from '../../common/decorators/wallet.decorator';

@ApiTags('access-channel-manager')
@Controller('access-channel-manager')
export class AccessChannelController {
  constructor(private readonly accessChannelService: AccessChannelService) {}

  /**
   * Create a new channel
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

  /**
   * Activate a channel
   */
  @Post('channels/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ativa um canal',
    description: 'Ativa um canal de acesso na blockchain.',
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
    description: 'Canal ativado com sucesso',
    type: ActivateChannelResponseDto,
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
  async activateChannel(
    @Body() activateChannelDto: ActivateChannelDto,
    @PrivateKey() privateKey: string,
  ): Promise<CreateChannelResponseDto> {
    return await this.accessChannelService.activateChannel(
      activateChannelDto,
      privateKey,
    );
  }

  /**
   * Deactivate a channel
   */
  @Post('channels/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desativa um canal',
    description: 'Desativa um canal de acesso na blockchain.',
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
    description: 'Canal desativado com sucesso',
    type: ActivateChannelResponseDto,
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
  async deactivateChannel(
    @Body() deactivateChannelDto: DeactivateChannelDto,
    @PrivateKey() privateKey: string,
  ): Promise<DeactivateChannelResponseDto> {
    return await this.accessChannelService.deactivateChannel(
      deactivateChannelDto,
      privateKey,
    );
  }

  /**
   * Obter informações de um canal
   */
  @Get('channels/:channelName')
  @ApiOperation({
    summary: 'Obter informações de um canal',
    description: 'Retorna informações detalhadas sobre um canal específico',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações do canal retornadas com sucesso',
    type: ChannelInfoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Nome do canal inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Canal não encontrado',
  })
  async getChannelInfo(
    @Param('channelName') channelName: string,
  ): Promise<ChannelInfoResponseDto> {
    const channelNameDto: ChannelNameDto = { channelName };
    return await this.accessChannelService.getChannelInfo(channelNameDto);
  }
}
