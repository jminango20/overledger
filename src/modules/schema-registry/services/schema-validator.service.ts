import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class SchemaValidator {
  validateSchemaInput(dto: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!dto[field]?.trim?.() && dto[field] !== 0) {
        throw new BadRequestException(`${field} é obrigatório`);
      }
    }
  }

  validateVersion(version: number): void {
    if (!version || version < 1) {
      throw new BadRequestException('Versão deve ser maior que 0');
    }
  }

  validateDataHash(dataHash: string): void {
    if (!dataHash) {
      throw new BadRequestException('DataHash é obrigatório');
    }

    const cleanHash = dataHash.replace(/^0x/, '');
    if (!/^[a-fA-F0-9]{64}$/.test(cleanHash)) {
      throw new BadRequestException(
        'DataHash deve ser um hash hexadecimal válido de 64 caracteres',
      );
    }
  }

  validateSchemaName(name: string): void {
    if (!name || name.length < 3) {
      throw new BadRequestException(
        'Nome do schema deve ter pelo menos 3 caracteres',
      );
    }
  }
}
