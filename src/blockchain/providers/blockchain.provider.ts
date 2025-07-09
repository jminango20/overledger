import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Provider, Signer, InterfaceAbi } from 'ethers';
import { ABIName, getABI } from '../abis';

@Injectable()
export class BlockchainProvider implements OnModuleInit {
  private readonly logger = new Logger(BlockchainProvider.name);

  public readonly provider: Provider;

  private readonly contractTemplateCache = new Map<
    string,
    { abi: InterfaceAbi; address: string }
  >();

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
    if (!rpcUrl) {
      throw new Error('BLOCKCHAIN_RPC_URL não configurado');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async onModuleInit() {
    try {
      const network = await this.provider.getNetwork();
      this.logger.log(`Conectado à rede: ${network.name} (${network.chainId})`);
    } catch (error) {
      this.logger.error('Erro ao conectar com a blockchain', error);
      throw error;
    }
  }

  /**
   * Cria signer dinamicamente com chave privada do usuário
   */
  createSigner(privateKey: string): Signer {
    if (!privateKey) {
      throw new Error('Chave privada é obrigatória');
    }

    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    try {
      return new ethers.Wallet(privateKey, this.provider);
    } catch (error) {
      throw new Error('Chave privada inválida', { cause: error });
    }
  }

  /**
   * Obtém contrato
   */
  getContract(
    contractName: ABIName,
    privateKey: string,
    address?: string,
  ): Contract {
    // Criar signer para este usuário
    const signer = this.createSigner(privateKey);

    // Usar endereço fornecido ou buscar no config
    const contractAddress = address || this.getContractAddress(contractName);

    const cacheKey = `${contractName}-${contractAddress}`;
    let contractTemplate = this.contractTemplateCache.get(cacheKey);

    if (!contractTemplate) {
      // Primeira vez, cachear ABI e endereço
      const abi = getABI(contractName);
      contractTemplate = { abi, address: contractAddress };
      this.contractTemplateCache.set(cacheKey, contractTemplate);
    }

    // Sempre criar nova instância com o signer específico
    const contract = new ethers.Contract(
      contractTemplate.address,
      contractTemplate.abi,
      signer,
    );

    this.logger.debug(`Contrato ${contractName} criado para nova transação`);
    return contract;
  }

  /**
   * Obtém endereço do contrato a partir da configuração
   */
  private getContractAddress(contractName: ABIName): string {
    const envKey = `${contractName.toUpperCase()}_ADDRESS`;
    const address = this.configService.get<string>(envKey);

    if (!address) {
      throw new Error(`Endereço do contrato não configurado: ${envKey}`);
    }

    if (!ethers.isAddress(address)) {
      throw new Error(`Endereço inválido para ${contractName}: ${!!address}`);
    }

    return address;
  }

  /**
   * Utilitários para conversão
   */
  stringToBytes32(str: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(str));
  }

  bytes32ToString(bytes32: string): string {
    try {
      return ethers.decodeBytes32String(bytes32);
    } catch {
      return bytes32;
    }
  }

  bytesToHex(bytes32: string): string {
    return bytes32;
  }

  /**
   * Obtém endereço da wallet
   */
  async getWalletAddress(privateKey: string): Promise<string> {
    const signer = this.createSigner(privateKey);
    return await signer.getAddress();
  }
}
