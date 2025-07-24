import {
  ChannelNameValidation,
  IdValidation,
  VersionValidation,
  EthereumAddressValidation,
} from '../decorators/validation.decorators';

/**
 * Base DTO for operations that require channel
 */
export abstract class BaseChannelOperationDto {
  @ChannelNameValidation()
  channelName: string;
}

// Base class for channel name input
export abstract class BaseChannelMemberDto extends BaseChannelOperationDto {
  @EthereumAddressValidation()
  addressMember: string;
}

/**
 * Base DTO for schema operations (channelName + schemaId)
 */
export abstract class BaseSchemaOperationDto extends BaseChannelOperationDto {
  @IdValidation('do schema', 'user-profile-schema')
  schemaId: string;
}

/**
 * Base DTO for schema version operations (channelName + schemaId + version)
 */
export abstract class BaseSchemaVersionOperationDto extends BaseSchemaOperationDto {
  @VersionValidation()
  version: number;
}

/**
 * Base DTO for process operations (channelName + processId + natureId + stageId)
 */
export abstract class BaseProcessOperationDto extends BaseChannelOperationDto {
  @IdValidation('do processo', 'coffee-process')
  processId: string;

  @IdValidation('da natureza', 'coffee-onboarding')
  natureId: string;

  @IdValidation('do estágio', 'coffee-verification')
  stageId: string;
}

export abstract class BaseChannelDto {
  @ChannelNameValidation()
  channelName: string;
}
