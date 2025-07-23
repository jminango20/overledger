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
    })(target, propertyKey);

    IsNumber()(target, propertyKey);
    Min(VERSION_MIN)(target, propertyKey);
  };
}
