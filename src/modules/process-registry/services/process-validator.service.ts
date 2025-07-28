import { Injectable, BadRequestException } from '@nestjs/common';
import {
  ProcessAction,
  ProcessStatus,
  SchemaReferenceDto,
  PROCESS_ACTION_STRINGS,
  PROCESS_STATUS_STRINGS,
} from '../dto/process-registry.dto';
import { MAX_SCHEMAS_PER_PROCESS } from '../../../common/constants/validation.constants';

@Injectable()
export class ProcessValidator {
  validateProcessInput(dto: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      const value = dto[field];

      if (value === undefined || value === null) {
        throw new BadRequestException(`${field} é obrigatório`);
      }

      if (typeof value === 'string' && !value.trim()) {
        throw new BadRequestException(`${field} é obrigatório`);
      }

      if (field === 'action' && (typeof value !== 'number' || value < 0)) {
        throw new BadRequestException(`${field} deve ser um número válido`);
      }
    }
  }

  /**
   * Validate schemas array
   */
  validateSchemas(schemas: SchemaReferenceDto[], action?: ProcessAction): void {
    if (!schemas || !Array.isArray(schemas)) {
      throw new BadRequestException('Schemas deve ser um array válido');
    }

    if (action !== undefined) {
      const actionsRequiringSchemas = [
        ProcessAction.CREATE_ASSET,
        ProcessAction.CREATE_DOCUMENT,
        ProcessAction.UPDATE_ASSET,
      ];

      if (actionsRequiringSchemas.includes(action) && schemas.length === 0) {
        throw new BadRequestException(
          `A ação ${ProcessAction[action]} requer pelo menos um schema`,
        );
      }
    }

    if (schemas.length > MAX_SCHEMAS_PER_PROCESS) {
      throw new BadRequestException(
        `Máximo ${MAX_SCHEMAS_PER_PROCESS} schemas permitidos por processo`,
      );
    }

    // Validate each schema
    schemas.forEach((schema, index) => {
      this.validateSchemaReference(schema, index);
    });

    // Check for duplicates
    this.validateNoDuplicateSchemas(schemas);
  }

  /**
   * Validate individual schema reference
   */
  private validateSchemaReference(
    schema: SchemaReferenceDto,
    index: number,
  ): void {
    if (!schema.schemaId?.trim()) {
      throw new BadRequestException(
        `Schema na posição ${index}: schemaId é obrigatório`,
      );
    }

    if (!schema.version || schema.version < 1) {
      throw new BadRequestException(
        `Schema na posição ${index}: versão deve ser maior que 0`,
      );
    }

    // Validate schemaId format
    if (!/^[a-zA-Z0-9_-]+$/.test(schema.schemaId)) {
      throw new BadRequestException(
        `Schema na posição ${index}: schemaId deve conter apenas letras, números, underscore e hífen`,
      );
    }

    if (schema.schemaId.length > 50) {
      throw new BadRequestException(
        `Schema na posição ${index}: schemaId deve ter no máximo 50 caracteres`,
      );
    }
  }

  /**
   * Check for duplicate schemas in the array
   */
  private validateNoDuplicateSchemas(schemas: SchemaReferenceDto[]): void {
    const seenSchemas = new Set<string>();

    schemas.forEach((schema, index) => {
      const schemaKey = `${schema.schemaId}:${schema.version}`;

      if (seenSchemas.has(schemaKey)) {
        throw new BadRequestException(
          `Schema duplicado encontrado na posição ${index}: ${schema.schemaId} v${schema.version}`,
        );
      }

      seenSchemas.add(schemaKey);
    });
  }

  /**
   * Validate process action
   */
  validateProcessAction(action: ProcessAction | string): void {
    if (typeof action === 'string') {
      if (!PROCESS_ACTION_STRINGS.includes(action as any)) {
        throw new BadRequestException(
          `Ação inválida. Deve ser uma das: ${PROCESS_ACTION_STRINGS.join(', ')}`,
        );
      }
    } else if (typeof action === 'number') {
      if (!Object.values(ProcessAction).includes(action)) {
        throw new BadRequestException(
          `Ação inválida. Deve ser um dos valores enum: ${Object.values(ProcessAction).join(', ')}`,
        );
      }
    } else {
      throw new BadRequestException(
        'Ação deve ser uma string ou número válido',
      );
    }
  }

  /**
   * Validate process status
   */
  validateProcessStatus(status: ProcessStatus | string): void {
    if (typeof status === 'string') {
      if (!PROCESS_STATUS_STRINGS.includes(status as any)) {
        throw new BadRequestException(
          `Status inválido. Deve ser um dos: ${PROCESS_STATUS_STRINGS.join(', ')}`,
        );
      }
    } else if (typeof status === 'number') {
      if (!Object.values(ProcessStatus).includes(status)) {
        throw new BadRequestException(
          `Status inválido. Deve ser um dos valores enum: ${Object.values(ProcessStatus).join(', ')}`,
        );
      }
    } else {
      throw new BadRequestException(
        'Status deve ser uma string ou número válido',
      );
    }
  }

  /**
   * Validate process ID format
   */
  validateProcessId(processId: string): void {
    if (!processId || typeof processId !== 'string') {
      throw new BadRequestException(
        'ProcessId é obrigatório e deve ser uma string',
      );
    }

    if (!processId.trim()) {
      throw new BadRequestException('ProcessId não pode estar vazio');
    }

    if (processId.length < 3) {
      throw new BadRequestException(
        'ProcessId deve ter pelo menos 3 caracteres',
      );
    }

    if (processId.length > 50) {
      throw new BadRequestException(
        'ProcessId deve ter no máximo 50 caracteres',
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(processId)) {
      throw new BadRequestException(
        'ProcessId deve conter apenas letras, números, underscore e hífen',
      );
    }
  }

  /**
   * Validate nature ID format
   */
  validateNatureId(natureId: string): void {
    if (!natureId || typeof natureId !== 'string') {
      throw new BadRequestException(
        'NatureId é obrigatório e deve ser uma string',
      );
    }

    if (!natureId.trim()) {
      throw new BadRequestException('NatureId não pode estar vazio');
    }

    if (natureId.length < 3) {
      throw new BadRequestException(
        'NatureId deve ter pelo menos 3 caracteres',
      );
    }

    if (natureId.length > 50) {
      throw new BadRequestException(
        'NatureId deve ter no máximo 50 caracteres',
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(natureId)) {
      throw new BadRequestException(
        'NatureId deve conter apenas letras, números, underscore e hífen',
      );
    }
  }

  /**
   * Validate stage ID format
   */
  validateStageId(stageId: string): void {
    if (!stageId || typeof stageId !== 'string') {
      throw new BadRequestException(
        'StageId é obrigatório e deve ser uma string',
      );
    }

    if (!stageId.trim()) {
      throw new BadRequestException('StageId não pode estar vazio');
    }

    if (stageId.length < 3) {
      throw new BadRequestException('StageId deve ter pelo menos 3 caracteres');
    }

    if (stageId.length > 50) {
      throw new BadRequestException('StageId deve ter no máximo 50 caracteres');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(stageId)) {
      throw new BadRequestException(
        'StageId deve conter apenas letras, números, underscore e hífen',
      );
    }
  }

  /**
   * Validate channel name format
   * Reutiliza a mesma lógica dos outros validators
   */
  validateChannelName(channelName: string): void {
    if (!channelName || typeof channelName !== 'string') {
      throw new BadRequestException(
        'ChannelName é obrigatório e deve ser uma string',
      );
    }

    if (!channelName.trim()) {
      throw new BadRequestException('ChannelName não pode estar vazio');
    }

    if (channelName.length < 1 || channelName.length > 50) {
      throw new BadRequestException(
        'ChannelName deve ter entre 1 e 50 caracteres',
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(channelName)) {
      throw new BadRequestException(
        'ChannelName deve conter apenas letras, números, underscore e hífen',
      );
    }
  }

  /**
   * Validate description length
   */
  validateDescription(description?: string): void {
    if (description && description.length > 255) {
      throw new BadRequestException(
        'Descrição deve ter no máximo 255 caracteres',
      );
    }
  }

  /**
   * Comprehensive process validation
   */
  validateCompleteProcess(processData: {
    processId: string;
    natureId: string;
    stageId: string;
    channelName: string;
    action: ProcessAction;
    schemas: SchemaReferenceDto[];
    description?: string;
  }): void {
    this.validateProcessId(processData.processId);
    this.validateNatureId(processData.natureId);
    this.validateStageId(processData.stageId);
    this.validateChannelName(processData.channelName);
    this.validateProcessAction(processData.action);
    this.validateSchemas(processData.schemas);

    if (processData.description) {
      this.validateDescription(processData.description);
    }
  }

  /**
   * Validate that action requires schemas
   */
  validateActionRequiresSchemas(
    action: ProcessAction,
    schemas: SchemaReferenceDto[],
  ): void {
    const actionsRequiringSchemas = [
      ProcessAction.CREATE_ASSET,
      ProcessAction.UPDATE_ASSET,
      ProcessAction.CREATE_DOCUMENT,
      ProcessAction.TRANSFER_ASSET,
      ProcessAction.TRANSFORM_ASSET,
    ];

    if (actionsRequiringSchemas.includes(action) && schemas.length === 0) {
      throw new BadRequestException(
        `A ação ${ProcessAction[action]} requer pelo menos um schema`,
      );
    }
  }
}
