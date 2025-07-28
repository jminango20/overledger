import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { SchemaStatus } from '../dto/schema-registry.dto';

@Injectable()
export class SchemaEventParser {
  private readonly logger = new Logger(SchemaEventParser.name);

  /**
   * Parse version from SchemaCreated event
   */
  parseVersion(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    if (eventName === 'SchemaCreated') {
      const eventHash = ethers.id(
        'SchemaCreated(bytes32,string,uint256,address,bytes32,uint256)',
      );
      const event = receipt.logs.find((log) => log.topics[0] === eventHash);

      if (event?.data) {
        try {
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          // Data structure: [version, channelName, timestamp]
          const decoded = abiCoder.decode(
            ['uint256', 'bytes32', 'uint256'],
            event.data,
          );
          return Number(decoded[0]); // version
        } catch (error) {
          this.logger.warn(
            `Error parsing ${eventName} version:`,
            error.message,
          );
        }
      }
    }

    return null;
  }

  /**
   * Parse previous version from SchemaUpdated event
   */
  parsePreviousVersion(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    if (eventName === 'SchemaUpdated') {
      const eventHash = ethers.id(
        'SchemaUpdated(bytes32,uint256,uint256,address,bytes32,uint256)',
      );
      const event = receipt.logs.find((log) => log.topics[0] === eventHash);

      if (event?.topics?.[2]) {
        try {
          // topics[2] = previousVersion (indexed)
          return Number(event.topics[2]);
        } catch (error) {
          this.logger.warn(
            `Error parsing ${eventName} previous version:`,
            error.message,
          );
        }
      }
    }

    return null;
  }

  /**
   * Parse new version from SchemaUpdated event
   */
  parseNewVersion(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    if (eventName === 'SchemaUpdated') {
      const eventHash = ethers.id(
        'SchemaUpdated(bytes32,uint256,uint256,address,bytes32,uint256)',
      );
      const event = receipt.logs.find((log) => log.topics[0] === eventHash);

      if (event?.topics?.[3]) {
        try {
          // topics[3] = newVersion (indexed)
          return Number(event.topics[3]);
        } catch (error) {
          this.logger.warn(
            `Error parsing ${eventName} new version:`,
            error.message,
          );
        }
      }
    }

    return null;
  }

  /**
   * Parse previous status from SchemaStatusChanged event
   */
  parsePreviousStatus(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): SchemaStatus | null {
    if (!receipt?.logs) return null;

    if (eventName === 'SchemaStatusChanged') {
      const eventHash = ethers.id(
        'SchemaStatusChanged(bytes32,uint256,bytes32,uint8,uint8,address,uint256)',
      );
      const event = receipt.logs.find((log) => log.topics[0] === eventHash);

      if (event?.data) {
        try {
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          // Data structure: [oldStatus, newStatus, updatedBy, timestamp]
          const decoded = abiCoder.decode(
            ['uint8', 'uint8', 'address', 'uint256'],
            event.data,
          );
          return Number(decoded[0]) as SchemaStatus; // oldStatus
        } catch (error) {
          this.logger.warn(
            `Error parsing ${eventName} previous status:`,
            error.message,
          );
        }
      }
    }

    return null;
  }

  /**
   * Parse new status from SchemaStatusChanged event
   */
  parseNewStatus(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): SchemaStatus | null {
    if (!receipt?.logs) return null;

    if (eventName === 'SchemaStatusChanged') {
      const eventHash = ethers.id(
        'SchemaStatusChanged(bytes32,uint256,bytes32,uint8,uint8,address,uint256)',
      );
      const event = receipt.logs.find((log) => log.topics[0] === eventHash);

      if (event?.data) {
        try {
          const abiCoder = ethers.AbiCoder.defaultAbiCoder();
          // Data structure: [oldStatus, newStatus, updatedBy, timestamp]
          const decoded = abiCoder.decode(
            ['uint8', 'uint8', 'address', 'uint256'],
            event.data,
          );
          return Number(decoded[1]) as SchemaStatus; // newStatus
        } catch (error) {
          this.logger.warn(
            `Error parsing ${eventName} new status:`,
            error.message,
          );
        }
      }
    }

    return null;
  }

  /**
   * Parse owner from SchemaCreated event
   */
  parseOwner(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): string | null {
    if (!receipt?.logs) return null;

    if (eventName === 'SchemaCreated') {
      const eventHash = ethers.id(
        'SchemaCreated(bytes32,string,uint256,address,bytes32,uint256)',
      );
      const event = receipt.logs.find((log) => log.topics[0] === eventHash);

      if (event?.topics?.[3]) {
        try {
          // topics[3] = owner (indexed address)
          return event.topics[3];
        } catch (error) {
          this.logger.warn(`Error parsing ${eventName} owner:`, error.message);
        }
      }
    }

    return null;
  }

  /**
   * Parse schema name from SchemaCreated event
   */
  parseSchemaName(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): string | null {
    if (!receipt?.logs) return null;

    if (eventName === 'SchemaCreated') {
      const eventHash = ethers.id(
        'SchemaCreated(bytes32,string,uint256,address,bytes32,uint256)',
      );
      const event = receipt.logs.find((log) => log.topics[0] === eventHash);

      if (event?.topics?.[2]) {
        try {
          // topics[2] = name (indexed string) - but it's hashed!
          // Para string indexed, não podemos recuperar o valor original
          // Vamos retornar null e usar o DTO
          this.logger.debug(
            'String indexed cannot be decoded, using DTO value',
          );
          return null;
        } catch (error) {
          this.logger.warn(`Error parsing ${eventName} name:`, error.message);
        }
      }
    }

    return null;
  }

  /**
   * Parse timestamp from any schema event
   */
  parseTimestamp(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    let eventHash: string;
    let dataDecodeTypes: string[];

    if (eventName === 'SchemaCreated') {
      eventHash = ethers.id(
        'SchemaCreated(bytes32,string,uint256,address,bytes32,uint256)',
      );
      dataDecodeTypes = ['uint256', 'bytes32', 'uint256']; // [version, channelName, timestamp]
    } else if (eventName === 'SchemaUpdated') {
      eventHash = ethers.id(
        'SchemaUpdated(bytes32,uint256,uint256,address,bytes32,uint256)',
      );
      dataDecodeTypes = ['address', 'bytes32', 'uint256']; // [owner, channelName, timestamp]
    } else if (eventName === 'SchemaStatusChanged') {
      eventHash = ethers.id(
        'SchemaStatusChanged(bytes32,uint256,bytes32,uint8,uint8,address,uint256)',
      );
      dataDecodeTypes = ['uint8', 'uint8', 'address', 'uint256']; // [oldStatus, newStatus, updatedBy, timestamp]
    } else {
      return null;
    }

    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const decoded = abiCoder.decode(dataDecodeTypes, event.data);

        // Timestamp is always the last element
        return Number(decoded[decoded.length - 1]);
      } catch (error) {
        this.logger.warn(
          `Error parsing ${eventName} timestamp:`,
          error.message,
        );
      }
    }

    return null;
  }

  /**
   * Parse all schema creation data at once
   */
  parseSchemaCreatedEvent(receipt: ethers.TransactionReceipt | null): {
    schemaId: string | null;
    version: number | null;
    owner: string | null;
    timestamp: number | null;
  } | null {
    if (!receipt?.logs) return null;

    const eventName = 'SchemaCreated';

    return {
      schemaId: this.parseSchemaId(receipt, eventName),
      version: this.parseVersion(receipt, eventName),
      owner: this.parseOwner(receipt, eventName),
      timestamp: this.parseTimestamp(receipt, eventName),
    };
  }

  /**
   * Parse schema ID from any schema event
   */
  parseSchemaId(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): string | null {
    if (!receipt?.logs) return null;

    let eventHash: string;

    if (eventName === 'SchemaCreated') {
      eventHash = ethers.id(
        'SchemaCreated(bytes32,string,uint256,address,bytes32,uint256)',
      );
    } else if (eventName === 'SchemaUpdated') {
      eventHash = ethers.id(
        'SchemaUpdated(bytes32,uint256,uint256,address,bytes32,uint256)',
      );
    } else if (eventName === 'SchemaStatusChanged') {
      eventHash = ethers.id(
        'SchemaStatusChanged(bytes32,uint256,bytes32,uint8,uint8,address,uint256)',
      );
    } else {
      return null;
    }

    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.topics?.[1]) {
      try {
        // topics[1] = schemaId (indexed bytes32)
        return ethers.decodeBytes32String(event.topics[1]);
      } catch (error) {
        this.logger.warn(`Error parsing ${eventName} schemaId:`, error.message);
      }
    }

    return null;
  }
}
