import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

/**
 * Decorator para extrair chave privada do header
 * Uso: @PrivateKey() privateKey: string
 */
export const PrivateKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Tentar diferentes formatos de header
    const privateKey =
      request.headers['x-private-key'] ||
      request.headers['private-key'] ||
      (request.headers['authorization'] as string)?.replace('Bearer ', '') ||
      request.headers['wallet-key'];

    if (!privateKey) {
      throw new BadRequestException(
        'Chave privada é obrigatória. Use header: x-private-key, private-key, Authorization (Bearer), ou wallet-key',
      );
    }

    // Validação básica
    if (typeof privateKey !== 'string') {
      throw new BadRequestException('Chave privada deve ser uma string');
    }

    // Verificar se parece com chave privada
    const cleanKey = privateKey.trim();

    let keyToValidate = cleanKey;
    if (cleanKey.startsWith('0x')) {
      keyToValidate = cleanKey.slice(2);
    }

    if (!/^[a-fA-F0-9]{64}$/.test(keyToValidate)) {
      throw new BadRequestException(
        `Formato de chave privada inválido. Deve ter 64 caracteres hexadecimais. Recebido: ${keyToValidate.length} caracteres`,
      );
    }

    return cleanKey.startsWith('0x') ? cleanKey : `0x${cleanKey}`;
  },
);
