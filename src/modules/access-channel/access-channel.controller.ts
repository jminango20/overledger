import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Query,
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
  ChannelMembersDto,
  ChannelMembersResponseDto,
  CheckMemberDto,
  MembershipCheckResponseDto,
  ChannelsResponseDto,
  PaginationDto,
  GetMembersDto,
  MembersResponseDto,
  CheckMultipleMembersDto,
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
   * Add multiple members to a channel
   */
  @Post('channels/addMembers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adicionar múltiplos membros a um canal',
    description:
      'Adiciona uma lista de membros a um canal de acesso na blockchain (máximo 100 por operação).',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Membros adicionados com sucesso',
    type: ChannelMembersResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
  })
  async addChannelMembers(
    @Body() addMembersDto: ChannelMembersDto,
    @PrivateKey() privateKey: string,
  ): Promise<ChannelMembersResponseDto> {
    return await this.accessChannelService.addChannelMembers(
      addMembersDto,
      privateKey,
    );
  }

  /**
   * Remove multiple members from a channel
   */
  @Post('channels/removeMembers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover múltiplos membros de um canal',
    description:
      'Remove uma lista de membros de um canal de acesso na blockchain.',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Membros removidos com sucesso',
    type: ChannelMembersResponseDto,
  })
  async removeChannelMembers(
    @Body() removeMembersDto: ChannelMembersDto,
    @PrivateKey() privateKey: string,
  ): Promise<ChannelMembersResponseDto> {
    return await this.accessChannelService.removeChannelMembers(
      removeMembersDto,
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
   * Check if address is channel member
   */
  @Post('channels/checkMember')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar se endereço é membro de um canal',
    description: 'Verifica se um endereço específico é membro de um canal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificação realizada com sucesso',
    type: MembershipCheckResponseDto,
  })
  async checkChannelMember(
    @Body() checkMemberDto: CheckMemberDto,
  ): Promise<MembershipCheckResponseDto> {
    return await this.accessChannelService.isChannelMember(checkMemberDto);
  }

  /**
   * Get all channels with pagination
   */
  @Get('channels')
  @ApiOperation({
    summary: 'Obter todos os canais com paginação',
    description: 'Retorna lista paginada de todos os canais.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de canais retornada com sucesso',
    type: ChannelsResponseDto,
  })
  async getAllChannels(
    @Query() paginationDto: PaginationDto,
  ): Promise<ChannelsResponseDto> {
    return await this.accessChannelService.getAllChannelsPaginated(
      paginationDto,
    );
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

  /**
   * Check multiple addresses membership in a channel
   */
  @Post('channels/:channelName/checkMembers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar múltiplos endereços',
    description: 'Verifica se múltiplos endereços são membros de um canal.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificação realizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        channelName: { type: 'string', example: 'my-awesome-channel' },
        memberAddresses: {
          type: 'array',
          items: { type: 'string' },
          example: ['0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E'],
        },
        results: {
          type: 'array',
          items: { type: 'boolean' },
          example: [true, false, true],
        },
      },
    },
  })
  async checkMultipleMembers(
    @Param('channelName') channelName: string,
    @Body() checkMultipleMembersDto: CheckMultipleMembersDto,
  ): Promise<{
    channelName: string;
    memberAddresses: string[];
    results: boolean[];
  }> {
    const results = await this.accessChannelService.areChannelMembers(
      channelName,
      checkMultipleMembersDto.memberAddresses,
    );

    return {
      channelName,
      memberAddresses: checkMultipleMembersDto.memberAddresses,
      results,
    };
  }

  /**
   * Get channel members with pagination
   */
  @Get('channels/:channelName/members')
  @ApiOperation({
    summary: 'Obter membros do canal com paginação',
    description: 'Retorna lista paginada de membros de um canal específico.',
  })
  @ApiParam({
    name: 'channelName',
    description: 'Nome do canal',
    example: 'my-awesome-channel',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de membros retornada com sucesso',
    type: MembersResponseDto,
  })
  async getChannelMembers(
    @Param('channelName') channelName: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<MembersResponseDto> {
    const getMembersDto: GetMembersDto = {
      channelName,
      ...paginationDto,
    };
    return await this.accessChannelService.getChannelMembersPaginated(
      getMembersDto,
    );
  }
}
