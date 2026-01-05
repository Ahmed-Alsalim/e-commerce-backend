const { scrypt, randomBytes, timingSafeEqual } = require('node:crypto');

async function hash(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex');

    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

async function verify(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, hashKey] = hash.split(':');
    const hashKeyBuff = Buffer.from(hashKey, 'hex');

    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(timingSafeEqual(hashKeyBuff, derivedKey));
    });
  });
}

module.exports = { hash, verify };
