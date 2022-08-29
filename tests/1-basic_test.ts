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
      timestamp: 2,
    });
    // console.log(left_order, right_order);

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x004E7253000000000000000000000000\", \"taker-asset-data\": \"0x00E1F505000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 1, \"timestamp\": 1 }"
    const left_order_hash =
      '0x809387c986b14b0bfc30adf2261f21955cf3810975175bb211041e2099e46f14';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x00E1F505000000000000000000000000\", \"taker-asset-data\": \"0x004E7253000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 2, \"timestamp\": 2 }"
    const right_order_hash =
      '0x7fec2f67aa0dc866421ca4f38cb2a8169d32fe18acccb233f2960814bf7c26f9';

    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x809387c986b14b0bfc30adf2261f21955cf3810975175bb211041e2099e46f14
    const left_signature =
      '0x63ba5eec3b711afc2122d6ea4cd31d01bc3681c559c6ecc4ef31fb795adb6c2f23f8a46dbd8198efed03328be1f8c295e18e77750ad36667780e8534d6b3361e00';
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x7fec2f67aa0dc866421ca4f38cb2a8169d32fe18acccb233f2960814bf7c26f9
    const right_signature =
      '0x330d9d6e5fd42da2ec210e6ed5d9b6246ad11df704f14a04555ce9da4987bab66fd024ea53032ea3b1af3f647828eeb12eec2e80d9d627720d5bcc39b7fad8f400';

    let response = chain.callReadOnlyFn(
      contractNames.exchange,
      'validate-match',
      [
        left_order,
        right_order,
        left_signature,
        right_signature,
        types.none(),
        types.none(),
        types.none(),
      ],
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
