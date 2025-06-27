import { ContractTransactionResponse } from 'ethers';

export interface IAddressDiscovery {
  /**
   * Atualiza o endereço de um contrato
   * @param smartContract Nome do contrato em bytes32
   * @param newAddress Novo endereço do contrato
   * @returns Promise com a transação
   */
  updateAddress(
    smartContract: string,
    newAddress: string,
  ): Promise<ContractTransactionResponse>;

  /**
   * Obtém o endereço de um contrato
   * @param smartContract Nome do contrato em bytes32
   * @returns Promise com o endereço do contrato
   */
  getContractAddress(smartContract: string): Promise<string>;

  /**
   * Verifica se um contrato está registrado
   * @param smartContract Nome do contrato em bytes32
   * @returns Promise com boolean indicando se está registrado
   */
  isRegistered(smartContract: string): Promise<boolean>;
}

// DTOs para as requisições da API
export interface UpdateAddressDto {
  contractName: string; // Nome do contrato
  newAddress: string; // Novo endereço
}

export interface GetContractAddressDto {
  contractName: string; // Nome do contrato
}

// Responses da API
export interface ContractAddressResponse {
  contractName: string;
  address: string;
  isRegistered: boolean;
  lastUpdated?: Date;
  updatedBy?: string;
}

export interface UpdateAddressResponse {
  success: boolean;
  transactionHash: string;
  contractName: string;
  oldAddress?: string;
  newAddress: string;
  blockNumber?: number;
  gasUsed?: string;
}

// Tipos de eventos do contrato
export interface AddressUpdatedEvent {
  smartContract: string; // bytes32
  oldAddress: string; // address
  newAddress: string; // address
  updatedBy: string; // address
}

// Erros customizados do contrato
export class InvalidAddressError extends Error {
  constructor(address: string) {
    super(`Invalid address: ${address}`);
    this.name = 'InvalidAddressError';
  }
}

export class ContractNotRegisteredError extends Error {
  constructor(contractName: string) {
    super(`Contract not registered: ${contractName}`);
    this.name = 'ContractNotRegisteredError';
  }
}
