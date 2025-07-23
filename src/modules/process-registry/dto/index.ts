export {
  // Enums
  ProcessStatus,
  ProcessAction,
  PROCESS_STATUS_STRINGS,
  PROCESS_ACTION_STRINGS,

  // Input DTOs
  CreateProcessDto,
  UpdateProcessStatusDto,
  InactivateProcessDto,
  GetProcessDto,
  SchemaReferenceDto,

  // Response DTOs
  CreateProcessResponseDto,
  UpdateProcessStatusResponseDto,
  ProcessDto,
  ProcessValidationResponseDto,

  // Contract Interfaces
  ProcessInputContract,
  SchemaReferenceContract,

  // Utility Converters
  ProcessStatusConverter,
  ProcessActionConverter,

  // Type definitions
  ProcessStatusString,
  ProcessActionString,
} from './process-registry.dto';
