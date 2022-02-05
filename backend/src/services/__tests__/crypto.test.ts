import crypto from 'crypto';
import { decrypt, encrypt } from '../crypto';

const key = crypto.randomBytes(32).toString('base64');

describe('crypto', () => {
  it('round trips', () => {
    for (const content of ['', 'hello', { secret: 123, token: 'ab1' }]) {
      expect(
        JSON.parse(decrypt(encrypt(JSON.stringify(content), key), key))
      ).toEqual(content);
    }
  });

  it('round trips with specified iv', () => {
    const tempIV = crypto.randomBytes(16).toString('hex');

    for (const content of ['', 'hello', { secret: 123, token: 'ab1' }]) {
      const payload = encrypt(JSON.stringify(content), key, tempIV);
      expect(JSON.parse(decrypt(payload, key))).toEqual(content);
      expect(payload.iv).toEqual(tempIV);
    }
  });

  it('fails with wrong iv', () => {
    const content = 'hello';
    expect(
      decrypt(
        {
          ...encrypt(JSON.stringify(content), key),
          iv: crypto.randomBytes(16).toString('hex'),
        },
        key
      )
    ).not.toEqual(content);
  });

  it('fails with wrong key', () => {
    const content = 'hello';
    expect(
      decrypt(
        {
          ...encrypt(JSON.stringify(content), key),
          iv: crypto.randomBytes(16).toString('hex'),
        },
        crypto.randomBytes(32).toString('base64')
      )
    ).not.toEqual(content);
  });
});
