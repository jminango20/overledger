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
import { AddressDiscoveryService } from './address-discovery.service';
import {
  UpdateAddressDto,
  UpdateAddressResponseDto,
  ContractAddressResponseDto,
} from './dto';
import { PrivateKey } from '../../common/decorators/wallet.decorator';

@ApiTags('address-discovery')
@Controller('address-discovery')
export class AddressDiscoveryController {
  constructor(
    private readonly addressDiscoveryService: AddressDiscoveryService,
  ) {}

  /**
   * Health check - não depende de contratos
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check da API',
    description: 'Verifica se a API está funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'API está funcionando',
    example: {
      status: 'ok',
      timestamp: '2024-06-27T20:20:57.000Z',
      service: 'address-discovery',
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'address-discovery',
    };
  }

  /**
   * Teste de conectividade blockchain
   */
  @Get('blockchain/status')
  @ApiOperation({
    summary: 'Status da conexão blockchain',
    description: 'Verifica conectividade com a rede blockchain',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da blockchain',
    example: {
      connected: true,
      network: 'besu',
      chainId: 11155111,
      blockNumber: 4123456,
    },
  })
  async getBlockchainStatus() {
    return await this.addressDiscoveryService.getBlockchainStatus();
  }

  /**
   * Endpoint para listar todos os contratos
   */
  @Get('contracts')
  @ApiOperation({
    summary: 'Listar todos os contratos registrados',
    description: 'Obtém lista de todos os contratos registrados no sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contratos retornada com sucesso',
    type: [ContractAddressResponseDto],
  })
  async getAllContracts(): Promise<ContractAddressResponseDto[]> {
    return await this.addressDiscoveryService.getAllContracts();
  }

  /**
   * Endpoint para atualizar endereço de contrato
   */
  @Post('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar endereço de um contrato',
    description: 'Atualiza o endereço de um contrato inteligente no registry',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Chave privada da wallet (64 caracteres hexadecimais)',
    required: true,
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço atualizado com sucesso',
    type: UpdateAddressResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro na transação',
    example: {
      statusCode: 400,
      message: 'Endereço Ethereum inválido',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Chave privada não fornecida ou inválida',
    example: {
      statusCode: 401,
      message: 'Chave privada é obrigatória. Use header: x-private-key',
      error: 'Unauthorized',
    },
  })
  async updateContractAddress(
    @Body() updateDto: UpdateAddressDto,
    @PrivateKey() privateKey: string,
  ): Promise<UpdateAddressResponseDto> {
    return await this.addressDiscoveryService.updateContractAddress(
      updateDto,
      privateKey,
    );
  }

  /**
   * Endpoint para verificar se contrato está registrado
   */
  @Get(':contractName/registered')
  @ApiOperation({
    summary: 'Verificar se contrato está registrado',
    description: 'Verifica se um contrato está registrado no sistema',
  })
  @ApiParam({
    name: 'contractName',
    description: 'Nome do contrato a ser verificado',
    example: 'SCHEMA_REGISTRY',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de registro verificado',
    example: {
      contractName: 'SCHEMA_REGISTRY',
      isRegistered: true,
    },
  })
  async isContractRegistered(
    @Param('contractName') contractName: string,
  ): Promise<{ contractName: string; isRegistered: boolean }> {
    const isRegistered =
      await this.addressDiscoveryService.isContractRegistered(contractName);

    return {
      contractName,
      isRegistered,
    };
  }

  /**
   * Endpoint para buscar endereço de contrato
   */
  @Get(':contractName')
  @ApiOperation({
    summary: 'Buscar endereço de um contrato',
    description: 'Obtém o endereço atual de um contrato registrado',
  })
  @ApiParam({
    name: 'contractName',
    description: 'Nome do contrato a ser consultado',
    example: 'ACCESS_CHANNEL_MANAGER',
  })
  @ApiResponse({
    status: 200,
    description: 'Endereço encontrado com sucesso',
    type: ContractAddressResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato não encontrado',
    example: {
      statusCode: 404,
      message: 'Contrato ACCESS_CHANNEL_MANAGER não está registrado',
      error: 'Not Found',
    },
  })
  async getContractAddress(
    @Param('contractName') contractName: string,
  ): Promise<ContractAddressResponseDto> {
    const getDto = { contractName };
    return await this.addressDiscoveryService.getContractAddress(getDto);
  }
}
