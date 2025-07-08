import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ACCESS_CHANNEL_SELECTORS,
  ADDRESS_DISCOVERY_SELECTORS,
  ACCESS_CONTROL_SELECTORS,
} from './error-selectors.utils';

/**
 * Handler centralized for contract errors
 */
export class ContractErrorHandler {
  private static logger = new Logger('ContractErrorHandler');

  /**
   * Error parser for AccessChannelManager
   */
  static parseAccessChannelError(error: any): Error | null {
    try {
      const errorData = error.data;

      if (!errorData || typeof errorData !== 'string') {
        return null;
      }

      // Channel Management Errors
      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['ChannelAlreadyExists(bytes32)'],
        )
      ) {
        return new ConflictException('Canal já existe');
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['ChannelDoesNotExist(bytes32)'],
        )
      ) {
        return new BadRequestException('Canal não existe');
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['ChannelAlreadyActive(bytes32)'],
        )
      ) {
        return new ConflictException('Canal já está ativo');
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['ChannelAlreadyDeactivated(bytes32)'],
        )
      ) {
        return new ConflictException('Canal já está desativado');
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['ChannelNotActive(bytes32)'],
        )
      ) {
        return new BadRequestException('Canal não está ativo');
      }

      // Member Management Errors
      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['CreatorCannotBeMember(bytes32,address)'],
        )
      ) {
        return new BadRequestException(
          'Criador do canal não pode ser adicionado como membro',
        );
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['MemberAlreadyInChannel(bytes32,address)'],
        )
      ) {
        return new ConflictException('Membro já existe no canal');
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['InvalidMemberAddress(address)'],
        )
      ) {
        return new BadRequestException('Endereço de membro inválido');
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['MemberNotInChannel(bytes32,address)'],
        )
      ) {
        return new BadRequestException('Membro não pertence ao canal');
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS[
            'ChannelMemberLimitExceeded(bytes32,uint256)'
          ],
        )
      ) {
        return new BadRequestException('Limite de membros do canal excedido');
      }

      // Array/Batch Errors
      if (
        errorData.startsWith(ACCESS_CHANNEL_SELECTORS['EmptyMemberArray()'])
      ) {
        return new BadRequestException('Array de membros não pode estar vazio');
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['BatchSizeExceeded(uint256,uint256)'],
        )
      ) {
        return new BadRequestException(
          'Tamanho do lote excedido (máximo 100 membros)',
        );
      }

      // Pagination Errors
      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['InvalidPageNumber(uint256)'],
        )
      ) {
        return new BadRequestException(
          'Número de página inválido (deve ser >= 1)',
        );
      }

      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['InvalidPageSize(uint256)'],
        )
      ) {
        return new BadRequestException(
          'Tamanho de página inválido (deve ser entre 1 e 200)',
        );
      }

      // General Errors
      if (
        errorData.startsWith(
          ACCESS_CHANNEL_SELECTORS['InvalidAddress(address)'],
        )
      ) {
        return new BadRequestException('Endereço inválido');
      }

      return null;
    } catch (parseError) {
      this.logger.warn(
        `Erro ao parsear AccessChannel error: ${parseError.message}`,
      );
      return null;
    }
  }

  /**
   * Error parser for AddressDiscovery
   */
  static parseAddressDiscoveryError(error: any): Error | null {
    try {
      const errorData = error.data;

      if (!errorData || typeof errorData !== 'string') {
        return null;
      }

      if (
        errorData.startsWith(
          ADDRESS_DISCOVERY_SELECTORS['InvalidAddress(address)'],
        )
      ) {
        return new BadRequestException('Endereço inválido');
      }

      if (
        errorData.startsWith(
          ADDRESS_DISCOVERY_SELECTORS['ContractNotRegistered(bytes32)'],
        )
      ) {
        return new NotFoundException('Contrato não está registrado');
      }

      return null;
    } catch (parseError) {
      this.logger.warn(
        `Erro ao parsear AddressDiscovery error: ${parseError.message}`,
      );
      return null;
    }
  }

  static parseAccessControlError(error: any): Error | null {
    try {
      const errorData = error.data;

      if (!errorData || typeof errorData !== 'string') {
        return null;
      }

      if (
        errorData.startsWith(
          ACCESS_CONTROL_SELECTORS[
            'AccessControlUnauthorizedAccount(address,bytes32)'
          ],
        )
      ) {
        return new UnauthorizedException('Conta não autorizada');
      }

      if (
        errorData.startsWith(
          ACCESS_CONTROL_SELECTORS['AccessControlBadConfirmation()'],
        )
      ) {
        return new UnauthorizedException('Confirmação de acesso inválida');
      }

      return null;
    } catch (parseError) {
      this.logger.warn(
        `Erro ao parsear AccessControl error: ${parseError.message}`,
      );
      return null;
    }
  }

  /**
   * Generic Handler
   */
  static parseContractError(error: any): Error | null {
    const accessControlError = this.parseAccessControlError(error);
    if (accessControlError) return accessControlError;

    const accessChannelError = this.parseAccessChannelError(error);
    if (accessChannelError) return accessChannelError;

    const addressDiscoveryError = this.parseAddressDiscoveryError(error);
    if (addressDiscoveryError) return addressDiscoveryError;

    return null;
  }
}
