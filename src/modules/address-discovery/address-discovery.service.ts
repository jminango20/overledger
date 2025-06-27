// src/modules/address-discovery/address-discovery.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ethers } from 'ethers';
import {
  UpdateAddressDto,
  GetContractAddressDto,
  ContractAddressResponseDto,
  UpdateAddressResponseDto,
} from './dto';
import { BlockchainProvider } from '../../blockchain/providers/blockchain.provider';

@Injectable()
export class AddressDiscoveryService {
  private readonly logger = new Logger(AddressDiscoveryService.name);

  constructor(
    private readonly blockchainProvider: BlockchainProvider,
    private readonly prismaService: PrismaService,
  ) {}

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

      // Obter endereço da wallet que fez a transação
      const signerAddress =
        await this.blockchainProvider.getWalletAddress(privateKey);

      // Salvar no banco de dados
      await this.saveToDatabase(
        updateDto.contractName,
        contractNameBytes32,
        oldAddress,
        updateDto.newAddress,
        tx.hash,
        receipt?.blockNumber || 0,
        receipt?.blockNumber ? new Date() : new Date(),
        signerAddress,
      );

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
   * Busca o endereço de um contrato (blockchain + banco como cache)
   */
  async getContractAddress(
    getDto: GetContractAddressDto,
    privateKey?: string,
  ): Promise<ContractAddressResponseDto> {
    this.logger.log(`Buscando endereço do contrato: ${getDto.contractName}`);

    try {
      // Primeiro tentar buscar no banco (cache)
      const dbRecord = await this.prismaService.contractAddress.findUnique({
        where: { contractName: getDto.contractName },
        include: {
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

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
        if (dbRecord) {
          this.logger.warn(
            `Inconsistência detectada: ${getDto.contractName} existe no banco mas não na blockchain`,
          );
        }
        throw new NotFoundException(
          `Contrato ${getDto.contractName} não está registrado`,
        );
      }

      // Buscar endereço atual da blockchain
      const blockchainAddress =
        await contract.getContractAddress(contractNameBytes32);

      // Verificar se há inconsistência entre banco e blockchain
      if (dbRecord && dbRecord.address !== blockchainAddress) {
        this.logger.warn(
          `Inconsistência detectada: endereço no banco (${dbRecord.address}) diferente da blockchain (${blockchainAddress})`,
        );

        // Atualizar banco com o endereço da blockchain
        await this.prismaService.contractAddress.update({
          where: { id: dbRecord.id },
          data: { address: blockchainAddress },
        });
      }

      return {
        contractName: getDto.contractName,
        address: blockchainAddress,
        isRegistered: true,
        lastUpdated: dbRecord?.updatedAt,
        updatedBy: dbRecord?.updates[0]?.updatedBy,
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

  /**
   * Lista todos os contratos registrados (do banco de dados)
   */
  async getAllContracts(): Promise<ContractAddressResponseDto[]> {
    const contracts = await this.prismaService.contractAddress.findMany({
      where: { isActive: true },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { contractName: 'asc' },
    });

    return contracts.map((contract) => ({
      contractName: contract.contractName,
      address: contract.address,
      isRegistered: true,
      lastUpdated: contract.updatedAt,
      updatedBy: contract.updates[0]?.updatedBy,
    }));
  }

  /**
   * Salva/atualiza informações no banco de dados
   */
  private async saveToDatabase(
    contractName: string,
    contractHash: string,
    oldAddress: string | undefined,
    newAddress: string,
    transactionHash: string,
    blockNumber: number,
    blockTimestamp: Date,
    updatedBy: string,
  ): Promise<void> {
    await this.prismaService.$transaction(async (prisma) => {
      // Upsert do contrato
      const contract = await prisma.contractAddress.upsert({
        where: { contractName },
        update: {
          address: newAddress,
          updatedAt: new Date(),
        },
        create: {
          contractName,
          contractHash,
          address: newAddress,
          isActive: true,
        },
      });

      // Criar registro de atualização
      await prisma.contractAddressUpdate.create({
        data: {
          contractId: contract.id,
          oldAddress,
          newAddress,
          updatedBy,
          transactionHash,
          blockNumber: BigInt(blockNumber),
          blockTimestamp,
        },
      });
    });

    this.logger.log(`Dados salvos no banco para o contrato: ${contractName}`);
  }
}
