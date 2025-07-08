import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import { CreateChannelDto, CreateChannelResponseDto } from './dto';
import { BlockchainProvider } from '../../blockchain/providers/blockchain.provider';
import { ContractErrorHandler } from '../../common/utils/contract-error.handler';

@Injectable()
export class AccessChannelService {
  private readonly logger = new Logger(AccessChannelService.name);

  constructor(private readonly blockchainProvider: BlockchainProvider) {}

  /**
   * Cria um novo canal
   */
  async createChannel(
    createDto: CreateChannelDto,
    privateKey: string,
  ): Promise<CreateChannelResponseDto> {
    this.logger.log(`Criando canal: ${createDto.channelName}`);

    try {
      // Obter contrato com a chave privada do usuário
      const addressDiscoveryContract = this.blockchainProvider.getContract(
        'AddressDiscovery',
        privateKey,
      );

      const contractNameBytes32 = this.blockchainProvider.stringToBytes32(
        'ACCESS_CHANNEL_MANAGER',
      );

      const contractAddress =
        await addressDiscoveryContract.getContractAddress(contractNameBytes32);

      const contract = this.blockchainProvider.getContract(
        'AccessChannelManager',
        privateKey,
        contractAddress,
      );

      // Converter nome do canal para bytes32
      const channelNameBytes32 = this.blockchainProvider.stringToBytes32(
        createDto.channelName,
      );

      // Chamar o contrato na blockchain
      const tx = await contract.createChannel(channelNameBytes32);
      this.logger.log(`Transação enviada: ${tx.hash}`);

      // Aguardar confirmação
      const receipt = await tx.wait();
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
        channelName: createDto.channelName,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      };
    } catch (error) {
      this.logger.error(`Erro ao criar canal: ${error.message}`, error.stack);

      const customError = ContractErrorHandler.parseContractError(error);

      if (customError) {
        throw customError;
      }

      if (error.code === 'CALL_EXCEPTION') {
        throw new BadRequestException(
          'Erro na chamada do contrato. Verifique os parâmetros.',
        );
      }

      throw error;
    }
  }
}
