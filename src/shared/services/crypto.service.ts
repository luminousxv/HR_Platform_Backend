import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CryptoService {
  private readonly key: Buffer;
  private readonly iv: Buffer;
  private readonly algorithm = 'aes-256-cbc';

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('CRYPTO_KEY');
    const secretIv = this.configService.get<string>('CRYPTO_IV');

    if (!secretKey || !secretIv) {
      throw new Error(
        'CRYPTO_KEY and CRYPTO_IV must be defined in environment variables',
      );
    }

    this.key = Buffer.from(secretKey, 'hex');
    this.iv = Buffer.from(secretIv, 'hex');
  }

  encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
