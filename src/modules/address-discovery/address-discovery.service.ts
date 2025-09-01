// src/modules/address-discovery/address-discovery.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ethers } from 'ethers';
import {
  UpdateAddressDto,
  GetContractAddressDto,
  ContractAddressResponseDto,
  UpdateAddressResponseDto,
} from './dto';
import { BlockchainProvider } from '@/blockchain/providers/blockchain.provider';

@Injectable()
export class AddressDiscoveryService {
  private readonly logger = new Logger(AddressDiscoveryService.name);

  constructor(private readonly blockchainProvider: BlockchainProvider) {}

  /**
   * Atualiza o endereço de um contrato na blockchain e salva no banco
   */
  async updateContractAddress(
    updateDto: UpdateAddressDto,
    privateKey: string,
  ): Promise<UpdateAddressResponseDto> {
    this.logger.log(
      `Atualizando endereço do contrato: ${updateDto.contractName}`,
    );

    try {
      // Validar se o endereço é válido
      if (!ethers.isAddress(updateDto.newAddress)) {
        throw new BadRequestException('Endereço Ethereum inválido');
      }

      // Obter contrato com a chave privada do usuário
      const contract = this.blockchainProvider.getContract(
        'AddressDiscovery',
        privateKey,
      );

      // Converter nome do contrato para bytes32
      const contractNameBytes32 = this.blockchainProvider.stringToBytes32(
        updateDto.contractName,
      );

      // Buscar endereço atual (se existe)
      let oldAddress: string | undefined;
      try {
        oldAddress = await contract.getContractAddress(contractNameBytes32);
      } catch {
        this.logger.log(
          `Contrato ${updateDto.contractName} não existe ainda, será criado`,
        );
      }

      // Chamar o contrato na blockchain
      const tx = await contract.updateAddress(
        contractNameBytes32,
        updateDto.newAddress,
      );

      this.logger.log(`Transação enviada: ${tx.hash}`);

      // Aguardar confirmação
      const receipt = await tx.wait();
      this.logger.log(`Transação confirmada no bloco: ${receipt?.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
        contractName: updateDto.contractName,
        oldAddress,
        newAddress: updateDto.newAddress,
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar endereço: ${error.message}`,
        error.stack,
      );

      if (error.code === 'CALL_EXCEPTION') {
        throw new BadRequestException(
          'Erro na chamada do contrato. Verifique os parâmetros.',
        );
      }

      throw error;
    }
  }

  /**
   * Busca o endereço de um contrato  direto na blockchain
   */
  async getContractAddress(
    getDto: GetContractAddressDto,
    privateKey?: string,
  ): Promise<ContractAddressResponseDto> {
    this.logger.log(`Buscando endereço do contrato: ${getDto.contractName}`);

    try {
      // Para leitura, podemos usar qualquer chave ou criar uma temporária
      if (!privateKey) {
        privateKey = ethers.Wallet.createRandom().privateKey;
      }

      const contract = this.blockchainProvider.getContract(
        'AddressDiscovery',
        privateKey,
      );

      // Converter nome para bytes32
      const contractNameBytes32 = this.blockchainProvider.stringToBytes32(
        getDto.contractName,
      );

      // Verificar se está registrado na blockchain
      const isRegistered = await contract.isRegistered(contractNameBytes32);

      if (!isRegistered) {
        throw new NotFoundException(
          `Contrato ${getDto.contractName} não está registrado`,
        );
      }

      // Buscar endereço atual da blockchain
      const blockchainAddress =
        await contract.getContractAddress(contractNameBytes32);

      return {
        contractName: getDto.contractName,
        address: blockchainAddress,
        isRegistered: true,
      };
    } catch (error) {
      if (error.code === 'CALL_EXCEPTION') {
        throw new NotFoundException(
          `Contrato ${getDto.contractName} não encontrado`,
        );
      }

      this.logger.error(
        `Erro ao buscar endereço: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verifica se um contrato está registrado
   */
  async isContractRegistered(contractName: string): Promise<boolean> {
    try {
      // Usar chave temporária para leitura
      const privateKey = ethers.Wallet.createRandom().privateKey;
      const contract = this.blockchainProvider.getContract(
        'AddressDiscovery',
        privateKey,
      );

      const contractNameBytes32 =
        this.blockchainProvider.stringToBytes32(contractName);
      return await contract.isRegistered(contractNameBytes32);
    } catch (error) {
      this.logger.error(
        `Erro ao verificar registro: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Verifica status da blockchain
   */
  async getBlockchainStatus() {
    try {
      const provider = this.blockchainProvider.provider;
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();

      return {
        connected: true,
        network: network.name,
        chainId: Number(network.chainId),
        blockNumber,
      };
    } catch (error) {
      this.logger.error('Erro ao verificar status da blockchain', error);
      return {
        connected: false,
        error: error.message,
      };
    }
  }
}
