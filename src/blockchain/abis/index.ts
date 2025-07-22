import AddressDiscoveryABI from './IAddressDiscovery.json';
import AccessChannelManagerABI from './IAccessChannelManager.json';
import SchemaRegistryABI from './ISchemaRegistry.json';
import ProcessRegistryABI from './IProcessRegistry.json';

export const ABIs = {
  AddressDiscovery: AddressDiscoveryABI,
  AccessChannelManager: AccessChannelManagerABI,
  SchemaRegistry: SchemaRegistryABI,
  ProcessRegistry: ProcessRegistryABI,
} as const;

export type ABIName = keyof typeof ABIs;
export type ContractABI = (typeof ABIs)[ABIName];

// Utilitário para buscar ABI por nome
export function getABI(contractName: ABIName): ContractABI {
  const abi = ABIs[contractName];
  if (!abi) {
    throw new Error(`ABI não encontrado para o contrato: ${contractName}`);
  }
  return abi;
}

// Lista de nomes dos contratos
export const CONTRACT_NAMES = Object.keys(ABIs) as ABIName[];
