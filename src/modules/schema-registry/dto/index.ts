export {
  // Enums
  SchemaStatus,
  SCHEMA_STATUS_STRINGS,
  SchemaStatusString,

  // Input DTOs
  CreateSchemaDto,
  UpdateSchemaDto,
  DeprecateSchemaDto,
  InactivateSchemaDto,
  SetSchemaStatusDto,

  // Query DTOs
  GetSchemaDto,
  GetSchemaByVersionDto,

  // Response DTOs
  CreateSchemaResponseDto,
  UpdateSchemaResponseDto,
  DeprecateSchemaResponseDto,
  InactivateSchemaResponseDto,
  SetSchemaStatusResponseDto,
  SchemaDto,
  SchemaInfoResponseDto,
  GetLatestSchemaResponseDto,
  GetSchemaVersionsResponseDto,

  // Interfaces
  SchemaInputContract,
  SchemaUpdateInputContract,
  SchemaCreatedEventDto,
  SchemaUpdatedEventDto,
  SchemaStatusChangedEventDto,

  // Utility Converters (sem mudanças)
  SchemaStatusConverter,
} from './schema-registry.dto';
