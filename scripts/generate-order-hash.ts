#!/usr/bin/env ts-node

// These are helper scripts to make development a little bit easier.
// DO NOT USE REAL SEED PHRASES OR PRIVATE KEYS.

import {
  bufferCV,
  contractPrincipalCV,
  serializeCV,
  standardPrincipalCV,
  tupleCV,
  TupleCV,
  uintCV,
} from '@stacks/transactions';
import { createHash } from 'crypto';

if (process.argv.length !== 3) {
  console.log(`Usage: ts-node generate-order-hash <Order JSON>`);
  process.exit(0);
}

function principalCV(input: string) {
  const dot = input.indexOf('.');
  return dot === -1
    ? standardPrincipalCV(input)
    : contractPrincipalCV(input.substring(0, dot), input.substring(dot + 1));
}

function toBuffer(input: string) {
  return Buffer.from(
    input.length >= 2 && input[1] === 'x' ? input.substr(2) : input,
    'hex',
  );
}

function orderToTupleCV(order: { [key: string]: any }) {
  const expected_struct = {
    sender: uintCV,
    'sender-fee': uintCV,
    maker: uintCV,
    'maker-asset': uintCV,
    'taker-asset': uintCV,
    'maker-asset-data': (input: string) => bufferCV(toBuffer(input)),
    'taker-asset-data': (input: string) => bufferCV(toBuffer(input)),
    'maximum-fill': uintCV,
    'expiration-height': uintCV,
    'extra-data': (input: string) => bufferCV(toBuffer(input)),
    salt: uintCV,
  };
  const orderTuple: { [key: string]: any } = {};
  for (const [key, func] of Object.entries(expected_struct))
    if (key in order) orderTuple[key] = func(order[key]);
    else throw new Error(`Order object missing '${key}' field`);

  return tupleCV(orderTuple);
}

const hashOrder = (order: TupleCV) =>
  createHash('sha256').update(serializeCV(order)).digest();

let order;
try {
  order = JSON.parse(process.argv[2]);
} catch (error) {
  console.log('Invalid JSON');
  process.exit(1);
}

const orderTuple = orderToTupleCV(order);
const hash = hashOrder(orderTuple) as Buffer;
console.log('0x' + hash.toString('hex'));
