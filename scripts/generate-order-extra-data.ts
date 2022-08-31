#!/usr/bin/env ts-node

// These are helper scripts to make development a little bit easier.
// DO NOT USE REAL SEED PHRASES OR PRIVATE KEYS.

// extra-data is structured as below
// {
//    risk: bool, (used by stop limit order. see: https://github.com/alexgo-io/alex-v2-orderbook/blob/ef34bb58e04b6c606ed3f067b76dbf4b3399dafd/contracts/stxdx-exchange-zero.clar#L283-L289 )
//    stop: uint, (stop-price)
//    time: uint, (timestamp)
//    type: uint, (order type. see: https://github.com/alexgo-io/alex-v2-orderbook/blob/ef34bb58e04b6c606ed3f067b76dbf4b3399dafd/contracts/stxdx-exchange-zero.clar#L36-L38)
// }

if (process.argv.length !== 3) {
  console.log(`Usage: ts-node generate-order-extra-data <extra-data JSON>`);
  process.exit(0);
}

function toBuffer(input: string): Buffer {
  return Buffer.from(
    input.length >= 2 && input[1] === 'x' ? input.substr(2) : input,
    'hex',
  );
}

function serialise(input: any): Buffer {
  if (typeof input === 'boolean') {
    return toBuffer(input === true ? '0x03' : '0x00');
  } else if (typeof input === 'string') {
    return Buffer.concat([toBuffer('0x04'), Buffer.from(input, 'ascii')]);
  } else if (typeof input === 'number') {
    if (input < 0n) throw new Error('Input cannot be negative');
    const rs = Buffer.alloc(16);
    const v = new DataView(rs.buffer, rs.byteOffset, rs.byteLength);
    for (let i = 0; i < 16; i++) {
      const b = Number(input % 256);
      v.setInt8(i, b);
      input = input / 256;
    }
    return Buffer.concat([toBuffer('0x01'), rs]);
  }
  throw new Error('Input is Uunknown type');
}

function serialiseExtraData(extra_data: { [key: string]: any }) {
  const expected_struct = {
    risk: serialise,
    stop: serialise,
    time: serialise,
    type: serialise,
  };

  let _list: Buffer[] = [];

  for (const [key, func] of Object.entries(expected_struct))
    if (key in extra_data) {
      _list.push(serialise(key));
      _list.push(func(extra_data[key]));
    } else {
      throw new Error(`Extra data object missing '${key}' field`);
    }

  return Buffer.concat(_list);
}

let extra_data;
try {
  extra_data = JSON.parse(process.argv[2]);
} catch (error) {
  console.log('Invalid JSON');
  process.exit(1);
}

console.log('0x' + serialiseExtraData(extra_data).toString('hex'));
