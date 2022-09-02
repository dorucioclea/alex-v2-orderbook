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

import {
  bufferCV,
  falseCV,
  serializeCV,
  trueCV,
  tupleCV,
  uintCV,
} from '@stacks/transactions';

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

function serialiseExtraData(extra_data: { [key: string]: any }) {
  const expected_struct = {
    risk: (input: boolean) => (input ? trueCV() : falseCV()),
    stop: uintCV,
    time: uintCV,
    type: uintCV,
  };
  const dataTuple: { [key: string]: any } = {};
  for (const [key, func] of Object.entries(expected_struct))
    if (key in extra_data) dataTuple[key] = func(extra_data[key]);
    else throw new Error(`Order object missing '${key}' field`);

  return serializeCV(tupleCV(dataTuple));
}

let extra_data: any;
try {
  extra_data = JSON.parse(process.argv[2]);
} catch (error) {
  console.log('Invalid JSON');
  process.exit(1);
}

console.log('0x' + serialiseExtraData(extra_data).toString('hex'));

function serialiseExtraData2(extra_data: { [key: string]: any }) {
  const expected_struct = {
    risk: (input: boolean) => (input ? trueCV() : falseCV()),
    stop: uintCV,
    time: uintCV,
    type: uintCV,
  };
  let _list: Buffer[] = [];
  _list.push(toBuffer('0x0c00000004'));
  for (const [key, func] of Object.entries(expected_struct))
    if (key in extra_data) {
      _list.push(serializeCV(bufferCV(Buffer.from(key, 'ascii'))));
      _list.push(serializeCV(func(extra_data[key])));
    } else {
      throw new Error(`Extra data object missing '${key}' field`);
    }

  return Buffer.concat(_list);
}

try {
  extra_data = JSON.parse(process.argv[2]);
} catch (error) {
  console.log('Invalid JSON');
  process.exit(1);
}

console.log('0x' + serialiseExtraData2(extra_data).toString('hex'));
