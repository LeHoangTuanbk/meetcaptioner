import type { TranscriptMessage } from './types';

/**
 * Decode protobuf transcript message from Google Meet DataChannel
 * Google Meet uses a custom protobuf format for transcript messages
 */

// Protobuf wire types
const WIRE_TYPE_VARINT = 0;
const WIRE_TYPE_FIXED64 = 1;
const WIRE_TYPE_LENGTH_DELIMITED = 2;
const WIRE_TYPE_FIXED32 = 5;

class ProtobufReader {
  private data: Uint8Array;
  private pos: number = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  get position(): number {
    return this.pos;
  }

  get remaining(): number {
    return this.data.length - this.pos;
  }

  readVarint(): number {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      if (this.pos >= this.data.length) {
        throw new Error('Unexpected end of data');
      }
      byte = this.data[this.pos++];
      result |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);

    return result >>> 0;
  }

  readVarintSigned(): number {
    const value = this.readVarint();
    return value >>> 1 ^ -(value & 1);
  }

  readFixed32(): number {
    if (this.pos + 4 > this.data.length) {
      throw new Error('Unexpected end of data');
    }
    const value =
      this.data[this.pos] |
      (this.data[this.pos + 1] << 8) |
      (this.data[this.pos + 2] << 16) |
      (this.data[this.pos + 3] << 24);
    this.pos += 4;
    return value >>> 0;
  }

  readFixed64(): bigint {
    const low = this.readFixed32();
    const high = this.readFixed32();
    return BigInt(low) | (BigInt(high) << 32n);
  }

  readBytes(length: number): Uint8Array {
    if (this.pos + length > this.data.length) {
      throw new Error('Unexpected end of data');
    }
    const result = this.data.slice(this.pos, this.pos + length);
    this.pos += length;
    return result;
  }

  readString(length: number): string {
    const bytes = this.readBytes(length);
    return new TextDecoder().decode(bytes);
  }

  readLengthDelimited(): Uint8Array {
    const length = this.readVarint();
    return this.readBytes(length);
  }

  readStringField(): string {
    const length = this.readVarint();
    return this.readString(length);
  }

  skip(wireType: number): void {
    switch (wireType) {
      case WIRE_TYPE_VARINT:
        this.readVarint();
        break;
      case WIRE_TYPE_FIXED64:
        this.pos += 8;
        break;
      case WIRE_TYPE_LENGTH_DELIMITED:
        const length = this.readVarint();
        this.pos += length;
        break;
      case WIRE_TYPE_FIXED32:
        this.pos += 4;
        break;
      default:
        throw new Error(`Unknown wire type: ${wireType}`);
    }
  }

  hasMore(): boolean {
    return this.pos < this.data.length;
  }
}

/**
 * Parse the transcript wrapper message
 * Structure based on reverse-engineered Google Meet protobuf
 */
function parseTranscriptWrapper(data: Uint8Array): TranscriptMessage | null {
  try {
    const reader = new ProtobufReader(data);
    let innerMessage: Uint8Array | null = null;

    while (reader.hasMore()) {
      const tag = reader.readVarint();
      const fieldNumber = tag >>> 3;
      const wireType = tag & 0x7;

      if (fieldNumber === 1 && wireType === WIRE_TYPE_LENGTH_DELIMITED) {
        innerMessage = reader.readLengthDelimited();
      } else {
        reader.skip(wireType);
      }
    }

    if (innerMessage) {
      return parseTranscriptMessage(innerMessage);
    }
  } catch (e) {
    console.debug('[MeetCaptioner] Error parsing wrapper:', e);
  }

  return null;
}

/**
 * Parse the inner transcript message
 * Fields based on Google Meet's BTranscriptMessage structure
 */
function parseTranscriptMessage(data: Uint8Array): TranscriptMessage | null {
  try {
    const reader = new ProtobufReader(data);

    let messageId = '';
    let speakerId = '';
    let speakerName = '';
    let text = '';
    let timestamp = Date.now();
    let isFinal = false;
    let languageCode = '';
    let messageVersion = 0;

    while (reader.hasMore()) {
      const tag = reader.readVarint();
      const fieldNumber = tag >>> 3;
      const wireType = tag & 0x7;

      switch (fieldNumber) {
        case 1: // messageId
          if (wireType === WIRE_TYPE_LENGTH_DELIMITED) {
            messageId = reader.readStringField();
          } else {
            reader.skip(wireType);
          }
          break;
        case 2: // speakerId or nested speaker info
          if (wireType === WIRE_TYPE_LENGTH_DELIMITED) {
            const speakerData = reader.readLengthDelimited();
            const parsed = parseSpeakerInfo(speakerData);
            if (parsed) {
              speakerId = parsed.speakerId;
              speakerName = parsed.speakerName;
            }
          } else {
            reader.skip(wireType);
          }
          break;
        case 3: // text content
          if (wireType === WIRE_TYPE_LENGTH_DELIMITED) {
            text = reader.readStringField();
          } else {
            reader.skip(wireType);
          }
          break;
        case 4: // timestamp or other numeric field
          if (wireType === WIRE_TYPE_VARINT) {
            timestamp = reader.readVarint();
          } else if (wireType === WIRE_TYPE_FIXED64) {
            timestamp = Number(reader.readFixed64());
          } else {
            reader.skip(wireType);
          }
          break;
        case 5: // isFinal flag
          if (wireType === WIRE_TYPE_VARINT) {
            isFinal = reader.readVarint() !== 0;
          } else {
            reader.skip(wireType);
          }
          break;
        case 6: // language code
          if (wireType === WIRE_TYPE_LENGTH_DELIMITED) {
            languageCode = reader.readStringField();
          } else {
            reader.skip(wireType);
          }
          break;
        case 7: // message version
          if (wireType === WIRE_TYPE_VARINT) {
            messageVersion = reader.readVarint();
          } else {
            reader.skip(wireType);
          }
          break;
        default:
          reader.skip(wireType);
      }
    }

    // Only return if we have meaningful data
    if (text || speakerName) {
      return {
        messageId: messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        speakerId,
        speakerName: speakerName || 'Unknown',
        text,
        timestamp,
        isFinal,
        languageCode,
      };
    }
  } catch (e) {
    console.debug('[MeetCaptioner] Error parsing message:', e);
  }

  return null;
}

/**
 * Parse speaker information from nested message
 */
function parseSpeakerInfo(data: Uint8Array): { speakerId: string; speakerName: string } | null {
  try {
    const reader = new ProtobufReader(data);
    let speakerId = '';
    let speakerName = '';

    while (reader.hasMore()) {
      const tag = reader.readVarint();
      const fieldNumber = tag >>> 3;
      const wireType = tag & 0x7;

      if (wireType === WIRE_TYPE_LENGTH_DELIMITED) {
        const str = reader.readStringField();
        if (fieldNumber === 1) {
          speakerId = str;
        } else if (fieldNumber === 2) {
          speakerName = str;
        }
      } else {
        reader.skip(wireType);
      }
    }

    return { speakerId, speakerName };
  } catch {
    return null;
  }
}

/**
 * Main decode function - attempts to decode transcript from DataChannel message
 */
export function decodeTranscript(data: ArrayBuffer | Uint8Array): TranscriptMessage | null {
  const uint8Data = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

  // Try parsing as wrapper first
  let result = parseTranscriptWrapper(uint8Data);

  // If wrapper parsing failed, try direct message parsing
  if (!result) {
    result = parseTranscriptMessage(uint8Data);
  }

  return result;
}

/**
 * Decode device info from collections channel
 */
export function decodeDeviceInfo(data: ArrayBuffer | Uint8Array): { deviceId: string; displayName: string }[] {
  const uint8Data = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  const devices: { deviceId: string; displayName: string }[] = [];

  try {
    const reader = new ProtobufReader(uint8Data);

    while (reader.hasMore()) {
      const tag = reader.readVarint();
      const fieldNumber = tag >>> 3;
      const wireType = tag & 0x7;

      if (wireType === WIRE_TYPE_LENGTH_DELIMITED) {
        const nestedData = reader.readLengthDelimited();
        const deviceInfo = parseDeviceEntry(nestedData);
        if (deviceInfo) {
          devices.push(deviceInfo);
        }
      } else {
        reader.skip(wireType);
      }
    }
  } catch (e) {
    console.debug('[MeetCaptioner] Error decoding device info:', e);
  }

  return devices;
}

function parseDeviceEntry(data: Uint8Array): { deviceId: string; displayName: string } | null {
  try {
    const reader = new ProtobufReader(data);
    let deviceId = '';
    let displayName = '';

    while (reader.hasMore()) {
      const tag = reader.readVarint();
      const fieldNumber = tag >>> 3;
      const wireType = tag & 0x7;

      if (wireType === WIRE_TYPE_LENGTH_DELIMITED) {
        const str = reader.readStringField();
        if (fieldNumber === 1) {
          deviceId = str;
        } else if (fieldNumber === 2 || fieldNumber === 3) {
          displayName = str;
        }
      } else {
        reader.skip(wireType);
      }
    }

    if (deviceId && displayName) {
      return { deviceId, displayName };
    }
  } catch {
    // Ignore parsing errors for individual entries
  }

  return null;
}
