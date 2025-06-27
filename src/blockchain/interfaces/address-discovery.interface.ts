import { ContractTransactionResponse } from 'ethers';

export interface IAddressDiscovery {
  /**
   * Atualiza o endereço de um contrato
   * @param smartContract Nome do contrato em bytes32
   * @param newAddress Novo endereço do contrato
   */
  updateAddress(
    smartContract: string,
    newAddress: string,
  ): Promise<ContractTransactionResponse>;

  /**
   * Obtém o endereço de um contrato
   * @param smartContract Nome do contrato em bytes32
   */
  getContractAddress(smartContract: string): Promise<string>;

  /**
   * Verifica se um contrato está registrado
   * @param smartContract Nome do contrato em bytes32
   */
  isRegistered(smartContract: string): Promise<boolean>;
}
