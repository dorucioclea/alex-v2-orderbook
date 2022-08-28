import {
  Account,
  assertEquals,
  Chain,
  Clarinet,
  contractNames,
  orderToTupleCV,
  prepareChainBasicTest,
  types,
} from './includes.ts';

Clarinet.test({
  name: 'Core: can hash orders',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet_1')!;
    const order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 2,
      'maker-asset': 1,
      'taker-asset': 2,
      'maker-asset-data': '0x004E7253000000000000000000000000', //14e8
      'taker-asset-data': '0x00E1F505000000000000000000000000', //1e8
      'maximum-fill': 1000,
      'expiration-height': 100,
      'extra-data': '0x',
      salt: 1,
      timestamp: 1,
    });
    const response = chain.callReadOnlyFn(
      contractNames.exchange,
      'hash-order',
      [order],
      sender.address,
    );

    // yarn run generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x004E7253000000000000000000000000\", \"taker-asset-data\": \"0x00E1F505000000000000000000000000\", \"maximum-fill\": 1000, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 1, \"timestamp\": 1 }"
    assertEquals(
      response.result,
      '0xa15703e992a15ba6dc4e488b7e92612e3d7db9719406b5ac5ef2a9badf9e8995',
    );
  },
});

Clarinet.test({
  name: 'Core: can validate matching orders (signatures)',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet_1')!;

    const results = prepareChainBasicTest(chain, accounts);
    results.receipts.forEach((e: any) => {
      e.result.expectOk();
    });

    const left_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 2,
      'maker-asset': 1,
      'taker-asset': 2,
      'maker-asset-data': '0x004E7253000000000000000000000000',
      'taker-asset-data': '0x00E1F505000000000000000000000000',
      'maximum-fill': 100,
      'expiration-height': 100,
      'extra-data': '0x',
      salt: 1,
      timestamp: 1,
    });
    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': '0x00E1F505000000000000000000000000',
      'taker-asset-data': '0x004E7253000000000000000000000000',
      'maximum-fill': 50,
      'expiration-height': 100,
      'extra-data': '0x',
      salt: 2,
      timestamp: 1,
    });
    // console.log(left_order, right_order);

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x004E7253000000000000000000000000\", \"taker-asset-data\": \"0x00E1F505000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 1, \"timestamp\": 1 }"
    const left_order_hash =
      '0x809387c986b14b0bfc30adf2261f21955cf3810975175bb211041e2099e46f14';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x00E1F505000000000000000000000000\", \"taker-asset-data\": \"0x004E7253000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 2, \"timestamp\": 1 }"
    const right_order_hash =
      '0xc372d32cdc02d0247216eac5faff60cdf587667b0566de9acf4b9f0e3b97dbcd';

    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x809387c986b14b0bfc30adf2261f21955cf3810975175bb211041e2099e46f14
    const left_signature =
      '0x63ba5eec3b711afc2122d6ea4cd31d01bc3681c559c6ecc4ef31fb795adb6c2f23f8a46dbd8198efed03328be1f8c295e18e77750ad36667780e8534d6b3361e00';
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0xc372d32cdc02d0247216eac5faff60cdf587667b0566de9acf4b9f0e3b97dbcd
    const right_signature =
      '0x66c07047a0ce9b372dd7fb6d0458cb4264135f074213d7046b980ac3d9fbf1215df840cb35972fc3f1ce7c46e6079f58487fbf08cdc2d2c358389918e22735f801';

    let response = chain.callReadOnlyFn(
      contractNames.exchange,
      'validate-match',
      [left_order, right_order, left_signature, right_signature, types.none()],
      sender.address,
    );
    let response_tuple = response.result.expectOk().expectTuple();
    assertEquals(response_tuple, {
      fillable: types.uint(50),
      'left-order-fill': types.uint(0),
      'left-order-hash': left_order_hash,
      'right-order-fill': types.uint(0),
      'right-order-hash': right_order_hash,
      'left-order-make': types.uint(14e8),
      'right-order-make': types.uint(1e8),
    });
  },
});
