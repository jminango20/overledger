import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { ProcessStatus, ProcessAction } from '../dto/process-registry.dto';

@Injectable()
export class ProcessEventParser {
  private readonly logger = new Logger(ProcessEventParser.name);

  /**
   * Parse process ID from ProcessCreated event
   */
  parseProcessID(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): string | null {
    if (!receipt?.logs) return null;

    // ProcessCreated(bytes32 indexed processId, bytes32 indexed natureId, bytes32 indexed stageId, address owner, bytes32 channelName, uint8 action, uint256 timestamp)
    const eventHash = ethers.id(
      `${eventName}(bytes32,bytes32,bytes32,address,bytes32,uint8,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.topics?.[1]) {
      try {
        return ethers.decodeBytes32String(event.topics[1]);
      } catch (error) {
        this.logger.warn(
          `Error parsing ${eventName} process ID:`,
          error.message,
        );
      }
    }
    return null;
  }

  /**
   * Parse nature ID from ProcessCreated event
   */
  parseNatureId(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): string | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,bytes32,bytes32,address,bytes32,uint8,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.topics?.[2]) {
      try {
        return ethers.decodeBytes32String(event.topics[2]);
      } catch (error) {
        this.logger.warn(`Error parsing ${eventName} natureId:`, error.message);
      }
    }
    return null;
  }

  /**
   * Parse stage ID from ProcessCreated event
   */
  parseStageId(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): string | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,bytes32,bytes32,address,bytes32,uint8,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.topics?.[3]) {
      try {
        // Third indexed parameter é o stageId
        return ethers.decodeBytes32String(event.topics[3]);
      } catch (error) {
        this.logger.warn(`Error parsing ${eventName} stageId:`, error.message);
      }
    }
    return null;
  }

  /**
   * Parse action from ProcessCreated event
   */
  parseAction(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): ProcessAction | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,bytes32,bytes32,address,bytes32,uint8,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        // Decode: owner, channelName, action, timestamp
        const decoded = abiCoder.decode(
          ['address', 'bytes32', 'uint8', 'uint256'],
          event.data,
        );
        return Number(decoded[2]) as ProcessAction;
      } catch (error) {
        this.logger.warn(`Error parsing ${eventName} action:`, error.message);
      }
    }
    return null;
  }

  /**
   * Parse owner from ProcessCreated event
   */
  parseOwner(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): string | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,bytes32,bytes32,address,bytes32,uint8,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const decoded = abiCoder.decode(
          ['address', 'bytes32', 'uint8', 'uint256'],
          event.data,
        );
        return decoded[0] as string;
      } catch (error) {
        this.logger.warn(`Error parsing ${eventName} owner:`, error.message);
      }
    }
    return null;
  }

  /**
   * Parse timestamp from any process event
   */
  parseTimestamp(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): number | null {
    if (!receipt?.logs) return null;

    let eventHash: string;

    // Different event signatures
    if (eventName === 'ProcessCreated') {
      eventHash = ethers.id(
        `${eventName}(bytes32,bytes32,bytes32,address,bytes32,uint8,uint256)`,
      );
    } else if (eventName === 'ProcessStatusChanged') {
      eventHash = ethers.id(
        `${eventName}(bytes32,bytes32,uint8,uint8,address,uint256)`,
      );
    } else {
      return null;
    }

    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();

        if (eventName === 'ProcessCreated') {
          const decoded = abiCoder.decode(
            ['address', 'bytes32', 'uint8', 'uint256'],
            event.data,
          );
          return Number(decoded[3]);
        } else if (eventName === 'ProcessStatusChanged') {
          const decoded = abiCoder.decode(
            ['uint8', 'uint8', 'address', 'uint256'],
            event.data,
          );
          return Number(decoded[3]);
        }
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
   * Parse previous status from ProcessStatusChanged event
   */
  parsePreviousStatus(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): ProcessStatus | null {
    if (!receipt?.logs) return null;

    // ProcessStatusChanged(bytes32 indexed processId, bytes32 indexed channelName, uint8 oldStatus, uint8 newStatus, address updatedBy, uint256 timestamp)
    const eventHash = ethers.id(
      `${eventName}(bytes32,bytes32,uint8,uint8,address,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        // Decode: oldStatus, newStatus, updatedBy, timestamp
        const decoded = abiCoder.decode(
          ['uint8', 'uint8', 'address', 'uint256'],
          event.data,
        );
        return Number(decoded[0]) as ProcessStatus;
      } catch (error) {
        this.logger.warn(
          `Error parsing ${eventName} previous status:`,
          error.message,
        );
      }
    }
    return null;
  }

  /**
   * Parse new status from ProcessStatusChanged event
   */
  parseNewStatus(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): ProcessStatus | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,bytes32,uint8,uint8,address,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const decoded = abiCoder.decode(
          ['uint8', 'uint8', 'address', 'uint256'],
          event.data,
        );
        return Number(decoded[1]) as ProcessStatus;
      } catch (error) {
        this.logger.warn(
          `Error parsing ${eventName} new status:`,
          error.message,
        );
      }
    }
    return null;
  }

  /**
   * Parse updatedBy from ProcessStatusChanged event
   */
  parseUpdatedBy(
    receipt: ethers.TransactionReceipt | null,
    eventName: string,
  ): string | null {
    if (!receipt?.logs) return null;

    const eventHash = ethers.id(
      `${eventName}(bytes32,bytes32,uint8,uint8,address,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (event?.data) {
      try {
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const decoded = abiCoder.decode(
          ['uint8', 'uint8', 'address', 'uint256'],
          event.data,
        );
        return decoded[2] as string;
      } catch (error) {
        this.logger.warn(
          `Error parsing ${eventName} updatedBy:`,
          error.message,
        );
      }
    }
    return null;
  }

  /**
   * Parse all process creation data at once
   */
  parseProcessCreatedEvent(receipt: ethers.TransactionReceipt | null): {
    processId: string | null;
    natureId: string | null;
    stageId: string | null;
    action: ProcessAction | null;
    owner: string | null;
    timestamp: number | null;
  } | null {
    if (!receipt?.logs) return null;

    const eventName = 'ProcessCreated';

    return {
      processId: this.parseProcessID(receipt, eventName),
      natureId: this.parseNatureId(receipt, eventName),
      stageId: this.parseStageId(receipt, eventName),
      action: this.parseAction(receipt, eventName),
      owner: this.parseOwner(receipt, eventName),
      timestamp: this.parseTimestamp(receipt, eventName),
    };
  }

  /**
   * Parse all status change data at once
   */
  parseProcessStatusChangedEvent(receipt: ethers.TransactionReceipt | null): {
    processId: string | null;
    channelName: string | null;
    previousStatus: ProcessStatus | null;
    newStatus: ProcessStatus | null;
    updatedBy: string | null;
    timestamp: number | null;
  } | null {
    if (!receipt?.logs) return null;

    const eventName = 'ProcessStatusChanged';
    const eventHash = ethers.id(
      `${eventName}(bytes32,bytes32,uint8,uint8,address,uint256)`,
    );
    const event = receipt.logs.find((log) => log.topics[0] === eventHash);

    if (!event) return null;

    try {
      // Parse indexed parameters (processId, channelName)
      const processId = event.topics[1]
        ? ethers.decodeBytes32String(event.topics[1])
        : null;
      const channelName = event.topics[2]
        ? ethers.decodeBytes32String(event.topics[2])
        : null;

      return {
        processId,
        channelName,
        previousStatus: this.parsePreviousStatus(receipt, eventName),
        newStatus: this.parseNewStatus(receipt, eventName),
        updatedBy: this.parseUpdatedBy(receipt, eventName),
        timestamp: this.parseTimestamp(receipt, eventName),
      };
    } catch (error) {
      this.logger.warn(`Error parsing ${eventName} event:`, error.message);
      return null;
    }
  }
}
