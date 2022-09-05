import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
export { assertEquals } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
export { Clarinet, Tx, Chain, types };
export type { Account };
export { contractNames };
export { uintCV, principalCV, noneCV, someCV, tupleCV };

const contractNames = {
  exchange: 'stxdx-exchange-zero',
  registry: 'stxdx-registry',
  sender_proxy: 'stxdx-sender-proxy',
  wallet: 'stxdx-wallet-zero',
};

const uintCV = types.uint;
const principalCV = types.principal;
const noneCV = types.none;
const someCV = types.some;
const bufferCV = types.buff;
const tupleCV = types.tuple;
const boolCV = types.bool;

const buff = (input: string | ArrayBuffer) =>
  typeof input === 'string'
    ? input.length >= 2 && input[1] === 'x'
      ? input
      : `0x${input}`
    : bufferCV(input);

export function orderToTupleCV(order: { [key: string]: any }) {
  const expected_struct: { [key: string]: Function } = {
    sender: uintCV,
    'sender-fee': uintCV,
    maker: uintCV,
    'maker-asset': uintCV,
    'taker-asset': uintCV,
    'maker-asset-data': uintCV,
    'taker-asset-data': uintCV,
    'maximum-fill': uintCV,
    'expiration-height': uintCV,
    salt: uintCV,
    risk: boolCV,
    stop: uintCV,
    timestamp: uintCV,
    type: uintCV,
  };
  const orderTuple: { [key: string]: any } = {};
  for (const [key, func] of Object.entries(expected_struct))
    if (key in order) orderTuple[key] = func(order[key]);
    else throw new Error(`Order object missing ${key} field`);

  return tupleCV(orderTuple);
}

export function prepareChainBasicTest(
  chain: Chain,
  accounts: Map<string, Account>,
) {
  const deployer = accounts.get('deployer')!;
  const wallet_1 = accounts.get('wallet_1')!; //sender
  const wallet_2 = accounts.get('wallet_2')!; //user 1
  const wallet_3 = accounts.get('wallet_3')!; //user 2

  const wallet_1_pubkey =
    '03cd2cfdbd2ad9332828a7a13ef62cb999e063421c708e863a7ffed71fb61c88c9';
  const wallet_2_pubkey =
    '021843d01fa0bb9a3495fd2caf92505a81055dbe1fd545880fd40c3a1c7fd9c40a';
  const wallet_3_pubkey =
    '02c4b5eacb71a27be633ed970dcbc41c00440364bc04ba38ae4683ac24e708bf33';

  return chain.mineBlock([
    Tx.contractCall(
      'token-xbtc',
      'mint-fixed',
      [types.uint(10000e8), types.principal(wallet_2.address)],
      deployer.address,
    ),
    Tx.contractCall(
      'token-xbtc',
      'mint-fixed',
      [types.uint(10000e8), types.principal(wallet_3.address)],
      deployer.address,
    ),
    Tx.contractCall(
      'token-xusd',
      'mint-fixed',
      [types.uint(10000e8), types.principal(wallet_2.address)],
      deployer.address,
    ),
    Tx.contractCall(
      'token-xusd',
      'mint-fixed',
      [types.uint(10000e8), types.principal(wallet_3.address)],
      deployer.address,
    ),
    Tx.contractCall(
      contractNames.exchange,
      'set-authorised-sender',
      [types.bool(true), '.stxdx-sender-proxy'],
      deployer.address,
    ),
    Tx.contractCall(
      contractNames.exchange,
      'set-authorised-sender',
      [types.bool(true), types.principal(wallet_1.address)],
      deployer.address,
    ),
    Tx.contractCall(
      contractNames.sender_proxy,
      'set-authorised-sender',
      [types.bool(true), types.principal(wallet_1.address)],
      deployer.address,
    ),
    Tx.contractCall(
      contractNames.wallet,
      'approve-exchange',
      ['.stxdx-exchange-zero', types.bool(true)],
      deployer.address,
    ),
    Tx.contractCall(
      contractNames.registry,
      'approve-exchange',
      ['.stxdx-exchange-zero', types.bool(true)],
      deployer.address,
    ),
    Tx.contractCall(
      contractNames.registry,
      'register-asset',
      ['.token-wxusd'],
      deployer.address,
    ),
    Tx.contractCall(
      contractNames.registry,
      'register-asset',
      ['.token-wbtc'],
      deployer.address,
    ),
    Tx.contractCall(
      contractNames.registry,
      'register-user',
      [buff(wallet_1_pubkey)],
      wallet_1.address,
    ),
    Tx.contractCall(
      contractNames.registry,
      'register-user',
      [buff(wallet_2_pubkey)],
      wallet_2.address,
    ),
    Tx.contractCall(
      contractNames.registry,
      'register-user',
      [buff(wallet_3_pubkey)],
      wallet_3.address,
    ),
    Tx.contractCall(
      contractNames.wallet,
      'transfer-in',
      [
        types.uint(10000e8),
        types.uint(2),
        types.uint(1),
        types.principal(deployer.address + '.token-wxusd'),
      ],
      wallet_2.address,
    ),
    Tx.contractCall(
      contractNames.wallet,
      'transfer-in',
      [
        types.uint(10000e8),
        types.uint(3),
        types.uint(1),
        types.principal(deployer.address + '.token-wxusd'),
      ],
      wallet_3.address,
    ),
    Tx.contractCall(
      contractNames.wallet,
      'transfer-in',
      [
        types.uint(10000e8),
        types.uint(2),
        types.uint(2),
        types.principal(deployer.address + '.token-wbtc'),
      ],
      wallet_2.address,
    ),
    Tx.contractCall(
      contractNames.wallet,
      'transfer-in',
      [
        types.uint(10000e8),
        types.uint(3),
        types.uint(2),
        types.principal(deployer.address + '.token-wbtc'),
      ],
      wallet_3.address,
    ),
    Tx.contractCall(
      contractNames.exchange,
      'set-trusted-oracle',
      [
        buff(
          'xyTvKiCST8bAT6sxrgkLh8UCX2N1eKvawODuxwq4qOHIdDAZFU_3N2m59rkZ0E7m77GsJuf1I8u0oEJEbxAdT7uD2JTwoYEHauXSxyJYvF0RCcZOhl5P1PJwImd44SJYa_9My7L84D5KXB9SKs8_VThe7ZyOb5HSGLNvMIK6A8IJ4Hr_tg9GYm65CRmtcu18S9mhun8vgw2wi7Gw6oR6mc4vU1I-hrU66Fi7YlXwFieP6YSy01JqoLPhU84EunPQzXPouVSbXjgRU5kFVxtdRy4GK2fzEBFYsQwCQgFrySCrFKHV8AInu9jerfof_DxNKiXkBzlB8nc22CrYnvvio_BWyh-gN0hQHZT0gwMR-A7sbXNCQJfReaIZzX_jP6XoB82PnpzmL_j1mJ2lnv2Rn001flBAx9AYxtGXd9s07pA-FggTbEG3Y2UnlWW6l3EJ93E0IfxL0PqGEUlp217mxUHvmTw9fkGDWa8rT9RPmsTyji-kMFSefclw80cBm_iOsIEutGP4S3LDbP-ZVJWDeJOBQQpSgwbisl8qbjl2sMQLQihoG2TQyNbmLwfyq-XSULkXjUi1_6BH36wnDBLWBKF-bS2bLKcGtn3Vjet72lNHxJJilcj8vpauwJG0078S_lO5uGt6oicdGR6eh_NSn6_8za_tXg0G_fohz4Yb1z8',
        ),
        types.bool(true),
      ],
      deployer.address,
    ),
    Tx.contractCall(
      contractNames.exchange,
      'set-oracle-symbol',
      [
        types.uint(2),
        buff(
          '0x42544300000000000000000000000000000000000000000000000000000000',
        ),
      ],
      deployer.address,
    ),
  ]);
}
