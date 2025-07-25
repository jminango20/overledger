import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiResponse, ApiParam } from '@nestjs/swagger';

export function RequirePrivateKey() {
  return applyDecorators(
    ApiHeader({
      name: 'x-private-key',
      description: 'Chave privada da wallet (64 caracteres hexadecimais)',
      required: true,
      example:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    }),
  );
}

export function BlockchainResponses() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Dados inválidos ou erro na transação',
      examples: {
        'invalid-input': {
          summary: 'Dados inválidos',
          value: {
            statusCode: 400,
            message: 'Dados de entrada inválidos',
            error: 'Bad Request',
          },
        },
        'channel-not-member': {
          summary: 'Usuário não é membro do canal',
          value: {
            statusCode: 401,
            message: 'Usuário não é membro do canal especificado',
            error: 'Unauthorized',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Não autorizado',
      example: {
        statusCode: 401,
        message: 'Apenas o proprietário pode realizar esta operação',
        error: 'Unauthorized',
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Recurso não encontrado',
      example: {
        statusCode: 404,
        message: 'Recurso não encontrado no canal especificado',
        error: 'Not Found',
      },
    }),
  );
}

export function SchemaParams() {
  return applyDecorators(
    ApiParam({
      name: 'channelName',
      description: 'Nome do canal',
      example: 'my-awesome-channel',
    }),
    ApiParam({
      name: 'schemaId',
      description: 'ID do schema',
      example: 'user-profile-schema',
    }),
  );
}

export function SchemaVersionParams() {
  return applyDecorators(
    SchemaParams(),
    ApiParam({
      name: 'version',
      description: 'Número da versão do schema',
      example: '1',
      type: 'string',
    }),
  );
}

export function BlockchainTransaction() {
  return applyDecorators(RequirePrivateKey(), BlockchainResponses());
}

export function BlockchainQuery() {
  return applyDecorators(
    ApiResponse({
      status: 404,
      description: 'Recurso não encontrado',
      example: {
        statusCode: 404,
        message: 'Recurso não encontrado no canal especificado',
        error: 'Not Found',
      },
    }),
  );
}
