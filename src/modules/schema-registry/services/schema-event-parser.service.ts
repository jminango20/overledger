import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { SchemaStatus } from '../dto/schema-registry.dto';

@Injectable()
export class SchemaEventParser {
  private readonly logger = new Logger(SchemaEventParser.name);

  /**
   * Parse version from any schema event
   */
  parseVersion(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,string,uint256,address,bytes32,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const decoded = abiCoder.decode(
          ['uint256', 'address', 'bytes32', 'uint256'],
          event.data,
        );
        return Number(decoded[0]);
      } catch (error) {
        this.logger.warn(`Error parsing ${eventName} version:`, error.message);
      }
    }
    return null;
  }

  /**
   * Parse previous version from update events
   */
  parsePreviousVersion(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,uint256,uint256,address,bytes32,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.topics?.[2]) {
      try {
        return Number(event.topics[2]);
      } catch (error) {
        this.logger.warn(
          `Error parsing ${eventName} previous version:`,
          error.message,
        );
      }
    }
    return null;
  }

  /**
   * Parse new version from update events
   */
  parseNewVersion(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,uint256,uint256,address,bytes32,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.topics?.[3]) {
      try {
        return Number(event.topics[3]);
      } catch (error) {
        this.logger.warn(
          `Error parsing ${eventName} new version:`,
          error.message,
        );
      }
    }
    return null;
  }

  /**
   * Parse previous status from status change events
   */
  parsePreviousStatus(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): SchemaStatus | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,uint256,bytes32,uint8,uint8,address,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const decoded = abiCoder.decode(
          ['uint8', 'uint8', 'address', 'uint256'],
          event.data,
        );
        return Number(decoded[0]) as SchemaStatus;
      } catch (error) {
        this.logger.warn(
          `Error parsing ${eventName} previous status:`,
          error.message,
        );
      }
    }
    return null;
  }
}
