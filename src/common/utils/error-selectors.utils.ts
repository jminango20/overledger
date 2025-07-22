import { ethers } from 'ethers';

/**
 * Computes the error selectors for a list of error signatures
 */
export function calculateErrorSelectors(
  errors: string[],
): Record<string, string> {
  const selectors: Record<string, string> = {};

  errors.forEach((errorSig) => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(errorSig));
    const selector = hash.slice(0, 10);
    selectors[errorSig] = selector;
  });

  return selectors;
}

/**
 * Customized errors for AccessChannelManager
 */
export const ACCESS_CHANNEL_ERRORS = [
  'ChannelAlreadyExists(bytes32)',
  'ChannelDoesNotExist(bytes32)',
  'ChannelAlreadyActive(bytes32)',
  'ChannelAlreadyDeactivated(bytes32)',
  'ChannelNotActive(bytes32)',
  'CreatorCannotBeMember(bytes32,address)',
  'MemberAlreadyInChannel(bytes32,address)',
  'InvalidMemberAddress(address)',
  'MemberNotInChannel(bytes32,address)',
  'ChannelMemberLimitExceeded(bytes32,uint256)',
  'EmptyMemberArray()',
  'BatchSizeExceeded(uint256,uint256)',
  'InvalidPageNumber(uint256)',
  'InvalidPageSize(uint256)',
  'InvalidAddress(address)',
  'AccessControlUnauthorizedAccount(address,bytes32)',
];

/**
 * Customized errors for AccessControl
 */
export const ACCESS_CONTROL_ERRORS = [
  'AccessControlUnauthorizedAccount(address,bytes32)',
  'AccessControlBadConfirmation()',
];

/**
 * Customized errors for AddressDiscovery
 */
export const ADDRESS_DISCOVERY_ERRORS = [
  'InvalidAddress(address)',
  'ContractNotRegistered(bytes32)',
];

/**
 * Customized errors for SchemaRegistry
 */
export const SCHEMA_REGISTRY_ERRORS = [
  'InvalidSchemaId()',
  'InvalidDataHash()',
  'InvalidSchemaName()',
  'InvalidVersion()',
  'DescriptionTooLong()',
  'SchemaAlreadyExistsCannotRecreate(bytes32,bytes32)',
  'SchemaNotFoundInChannel(bytes32,bytes32)',
  'SchemaVersionNotFoundInChannel(bytes32,bytes32,uint256)',
  'SchemaNotActive(bytes32,bytes32,uint8)',
  'SchemaAlreadyInactive(bytes32,bytes32,uint256)',
  'NoActiveSchemaVersion(bytes32,bytes32)',
  'NotSchemaOwner(bytes32,bytes32,address)',
  'InvalidStatusTransition(uint8,uint8)',
];

/**
 * Customized errors for BaseTraceContract
 */
export const BASE_TRACE_ERRORS = [
  'InvalidAddress(address)',
  'InvalidChannelName(bytes32)',
  'UnauthorizedChannelAccess(bytes32,address)',
  'InvalidPageNumber(uint256)',
  'InvalidPageSize(uint256)',
];

/**
 * Selectors pre-computed for AccessChannelManager
 */
export const ACCESS_CHANNEL_SELECTORS = calculateErrorSelectors(
  ACCESS_CHANNEL_ERRORS,
);

/**
 * Selectors pre-computed for AccessControl
 */
export const ACCESS_CONTROL_SELECTORS = calculateErrorSelectors(
  ACCESS_CONTROL_ERRORS,
);

/**
 * Selectors pre-computed for AddressDiscovery
 */
export const ADDRESS_DISCOVERY_SELECTORS = calculateErrorSelectors(
  ADDRESS_DISCOVERY_ERRORS,
);

/**
 * Selectors pre-computed for BaseTraceContract
 */
export const BASE_TRACE_SELECTORS = calculateErrorSelectors(BASE_TRACE_ERRORS);

/**
 * Selectors pre-computed for SchemaRegistry
 */
export const SCHEMA_REGISTRY_SELECTORS = calculateErrorSelectors(
  SCHEMA_REGISTRY_ERRORS,
);
