import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import {
  CHANNEL_NAME_REGEX,
  CHANNEL_NAME_ERROR_MESSAGE,
  CHANNEL_NAME_MIN_LENGTH,
  CHANNEL_NAME_MAX_LENGTH,
  ID_REGEX,
  ID_MIN_LENGTH,
  ID_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  DATA_HASH_REGEX,
  DATA_HASH_ERROR_MESSAGE,
  VERSION_MIN,
  HASH_TX,
  HASH_TX_MIN_LENGTH,
  HASH_TX_MAX_LENGTH,
  ETHEREUM_ADDRESS_REGEX,
  ETHEREUM_ADDRESS_MIN_LENGTH,
  ETHEREUM_ADDRESS_MAX_LENGTH,
} from '../constants/validation.constants';

// =============================================================
//                    COMMON VALIDATION DECORATORS
// =============================================================

export function ChannelNameValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Nome do canal',
      example: 'my-awesome-channel',
      minLength: CHANNEL_NAME_MIN_LENGTH,
      maxLength: CHANNEL_NAME_MAX_LENGTH,
      pattern: CHANNEL_NAME_REGEX.source,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(CHANNEL_NAME_MIN_LENGTH, CHANNEL_NAME_MAX_LENGTH)(
      target,
      propertyKey,
    );
    Matches(CHANNEL_NAME_REGEX, { message: CHANNEL_NAME_ERROR_MESSAGE })(
      target,
      propertyKey,
    );
  };
}

export function IdValidation(fieldName: string, example: string) {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: `Identificador único ${fieldName}`,
      example,
      minLength: ID_MIN_LENGTH,
      maxLength: ID_MAX_LENGTH,
      pattern: ID_REGEX.source,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(ID_MIN_LENGTH, ID_MAX_LENGTH)(target, propertyKey);
    Matches(ID_REGEX, {
      message: `${fieldName} deve conter apenas letras, números, underscore e hífen`,
    })(target, propertyKey);
  };
}

export function NameValidation(fieldName: string = 'nome') {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: `Nome ${fieldName}`,
      example: `Example ${fieldName}`,
      minLength: NAME_MIN_LENGTH,
      maxLength: NAME_MAX_LENGTH,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Length(NAME_MIN_LENGTH, NAME_MAX_LENGTH)(target, propertyKey);
  };
}

export function DataHashValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Hash dos dados (keccak256 do JSON)',
      example:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      pattern: DATA_HASH_REGEX.source,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Matches(DATA_HASH_REGEX, { message: DATA_HASH_ERROR_MESSAGE })(
      target,
      propertyKey,
    );
  };
}

export function DescriptionValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Descrição',
      example: 'Descrição detalhada do item',
      maxLength: DESCRIPTION_MAX_LENGTH,
      required: false,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsOptional()(target, propertyKey);
    Length(0, DESCRIPTION_MAX_LENGTH)(target, propertyKey);
  };
}

export function VersionValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Versão',
      example: 1,
      minimum: VERSION_MIN,
      type: 'integer',
    })(target, propertyKey);

    IsNumber()(target, propertyKey);
    Min(VERSION_MIN)(target, propertyKey);
  };
}

export function HashValidation(fieldName: string = 'hash') {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: `Hash ${fieldName} (keccak256)`,
      example:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      pattern: HASH_TX.source,
      minLength: HASH_TX_MIN_LENGTH,
      maxLength: HASH_TX_MAX_LENGTH,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Matches(HASH_TX, {
      message: `${fieldName} deve ser um hash válido (0x + 64 caracteres hexadecimais)`,
    })(target, propertyKey);
  };
}

export function EthereumAddressValidation(fieldName: string = 'endereço') {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: `${fieldName} Ethereum`,
      example: '0x742d35Cc7cDBe532D0f9d7bcd67b9a42B4f3e56E',
      pattern: ETHEREUM_ADDRESS_REGEX.source,
      minLength: ETHEREUM_ADDRESS_MIN_LENGTH,
      maxLength: ETHEREUM_ADDRESS_MAX_LENGTH,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Matches(/^0x[a-fA-F0-9]{40}$/i, {
      message: `${fieldName} deve ser um endereço Ethereum válido (0x + 40 caracteres hexadecimais)`,
    })(target, propertyKey);
  };
}

export function TransactionHashValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Hash da transação blockchain',
      example:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      pattern: HASH_TX.source,
      minLength: HASH_TX_MIN_LENGTH,
      maxLength: HASH_TX_MAX_LENGTH,
    })(target, propertyKey);

    IsString()(target, propertyKey);
    IsNotEmpty()(target, propertyKey);
    Matches(HASH_TX, {
      message:
        'Hash da transação deve ser válido (0x + 64 caracteres hexadecimais)',
    })(target, propertyKey);
  };
}

export function TimestampValidation(fieldName: string = 'timestamp') {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: `${fieldName} Unix (segundos desde 1970)`,
      example: 1640995200,
      minimum: 0,
      type: 'integer',
    })(target, propertyKey);

    IsNumber()(target, propertyKey);
    Min(0)(target, propertyKey);
  };
}

export function BlockNumberValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Número do bloco blockchain',
      example: 18500000,
      minimum: 0,
      type: 'integer',
    })(target, propertyKey);

    IsNumber()(target, propertyKey);
    Min(0)(target, propertyKey);
  };
}

export function GasUsedValidation() {
  return function (target: any, propertyKey: string) {
    ApiProperty({
      description: 'Gas usado na transação',
      example: '21000',
      pattern: '^[0-9]+$',
    })(target, propertyKey);

    IsString()(target, propertyKey);
    Matches(/^[0-9]+$/, {
      message: 'Gas usado deve ser um número válido em formato string',
    })(target, propertyKey);
  };
}
