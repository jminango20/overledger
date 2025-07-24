// =============================================================
//                    COMMON VALIDATION CONSTANTS
// =============================================================

// Channel validations
export const CHANNEL_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
export const CHANNEL_NAME_ERROR_MESSAGE =
  'O nome do canal deve conter apenas letras, números, underscore e hífen';
export const CHANNEL_NAME_MIN_LENGTH = 1;
export const CHANNEL_NAME_MAX_LENGTH = 50;

// General ID validations (usado para processId, schemaId, natureId, stageId)
export const ID_REGEX = /^[a-zA-Z0-9_-]+$/;
export const ID_MIN_LENGTH = 1;
export const ID_MAX_LENGTH = 50;

// Name validations
export const NAME_MIN_LENGTH = 1;
export const NAME_MAX_LENGTH = 100;

// Description validations
export const DESCRIPTION_MAX_LENGTH = 255;

// Hash validations
export const DATA_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
export const DATA_HASH_ERROR_MESSAGE =
  'O dataHash deve ser um hash válido (0x + 64 caracteres hexadecimais)';
export const HASH_TX = /^0x[a-fA-F0-9]{64}$/;
export const HASH_TX_MIN_LENGTH = 66;
export const HASH_TX_MAX_LENGTH = 66;

// Ethereum address validations
export const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const ETHEREUM_ADDRESS_MIN_LENGTH = 42;
export const ETHEREUM_ADDRESS_MAX_LENGTH = 42;

// Version validations
export const VERSION_MIN = 1;

// Array limits
export const MAX_SCHEMAS_PER_PROCESS = 10;
