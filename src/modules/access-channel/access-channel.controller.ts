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
  NumberResponseDto,
  NumberMembersInChannelResponseDto,
  ChannelMemberDto,
  ChannelMemberResponseDto,
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
   * Add a member to a channel
   */
  @Post('channels/addMember')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adicionar membro a um canal',
    description: 'Adiciona um membro a um canal de acesso na blockchain.',
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
    description: 'Membro adicionado com sucesso',
    type: ChannelMemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    example: {
      statusCode: 400,
      message: 'Nome do canal inválido ou endereço inválido',
      error: 'Bad Request',
    },
  })
  async addChannelMember(
    @Body() addMemberDto: ChannelMemberDto,
    @PrivateKey() privateKey: string,
  ): Promise<ChannelMemberResponseDto> {
    return await this.accessChannelService.addChannelMember(
      addMemberDto,
      privateKey,
    );
  }

  /**
   * Remove a member to a channel
   */
  @Post('channels/removeMember')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover membro a um canal',
    description: 'Remove um membro a um canal de acesso na blockchain.',
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
    description: 'Membro removido com sucesso',
    type: ChannelMemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    example: {
      statusCode: 400,
      message: 'Nome do canal inválido ou endereço inválido',
      error: 'Bad Request',
    },
  })
  async removeChannelMember(
    @Body() removeMemberDto: ChannelMemberDto,
    @PrivateKey() privateKey: string,
  ): Promise<ChannelMemberResponseDto> {
    return await this.accessChannelService.removeChannelMember(
      removeMemberDto,
      privateKey,
    );
  }

  /**
   * Get the number of channels
   */
  @Get('channels/count')
  @ApiOperation({
    summary: 'Obter número de canais',
    description: 'Retorna o número total de canais na blockchain',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações do número de canais retornadas com sucesso',
    type: NumberResponseDto,
  })
  async getChannelCount(): Promise<NumberResponseDto> {
    return await this.accessChannelService.getChannelCount();
  }

  /**
   * Get channel info
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

  /**
   * Get the number of members in a channel
   */
  @Get('channels/:channelName/members/count')
  @ApiOperation({
    summary: 'Obter número de membros de um canal',
    description:
      'Retorna informações detalhadas sobre o número de membros de um canal específico',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações do canal retornadas com sucesso',
    type: NumberMembersInChannelResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Nome do canal inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Canal não encontrado',
  })
  async getChannelMemberCount(
    @Param('channelName') channelName: string,
  ): Promise<NumberMembersInChannelResponseDto> {
    const channelNameDto: ChannelNameDto = { channelName };
    return await this.accessChannelService.getChannelMemberCount(
      channelNameDto,
    );
  }
}
