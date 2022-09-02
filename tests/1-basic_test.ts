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
  name: 'Core: extra-data => tuple',
  fn(chain: Chain, accounts: Map<String, Account>) {
    const sender = accounts.get('wallet_1')!;
    // yarn run generate-order-extra-data "{ \"risk\": true, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const response = chain.callReadOnlyFn(
      contractNames.exchange,
      'extra-data-to-tuple',
      [
        '0x0c0000000402000000047269736b03020000000473746f700100000000000000000000000000000000020000000474696d6501000000000000000000000000000000010200000004747970650100000000000000000000000000000000',
      ],
      sender.address,
    );
    assertEquals(
      response.result.expectOk(),
      '{risk: true, stop: u0, time: u1, type: u0}',
    );
  },
});

Clarinet.test({
  name: 'Core: can hash orders',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet_1')!;

    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const extra_data =
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000';

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
      'extra-data': extra_data,
      salt: 1,
    });
    const response = chain.callReadOnlyFn(
      contractNames.exchange,
      'hash-order',
      [order],
      sender.address,
    );

    // yarn run generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x004E7253000000000000000000000000\", \"taker-asset-data\": \"0x00E1F505000000000000000000000000\", \"maximum-fill\": 1000, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000\", \"salt\": 1 }"
    assertEquals(
      response.result,
      '0x6bae4bf7a1afda64ebcc7ba4eeab3a96e9ddea8aa0adc900afd62fff6f50aee6',
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

    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const left_extra =
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000';

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
      'extra-data': left_extra,
      salt: 1,
    });

    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 2, \"type\": 0 }"
    const right_extra =
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650100000000000000000000000000000000';
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
      'extra-data': right_extra,
      salt: 2,
    });
    // console.log(left_order, right_order);

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x004E7253000000000000000000000000\", \"taker-asset-data\": \"0x00E1F505000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000\", \"salt\": 1 }"
    const left_order_hash =
      '0x072be04cc89bfa6d8f5f136e9dba4a27d6a126baa1103fbcc068cdd8c94f5871';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x00E1F505000000000000000000000000\", \"taker-asset-data\": \"0x004E7253000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650100000000000000000000000000000000\", \"salt\": 2 }"
    const right_order_hash =
      '0xed10538461ef2213c827a5c7982668a1cd4e486e889caca93229238900d79121';

    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x072be04cc89bfa6d8f5f136e9dba4a27d6a126baa1103fbcc068cdd8c94f5871
    const left_signature =
      '0x8641824455adc64078c57e7fe3da4a26437891d9342ae224351b05340e9005635daf56268dec32f4344ebd33833145042639099055398cb7a54dc63ae428dbab00';
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0xed10538461ef2213c827a5c7982668a1cd4e486e889caca93229238900d79121
    const right_signature =
      '0x9af4e78fb8cf8edb15871886b3c57ada7fe4e1ec5931146439ad20f27891b46e46489e60f3fe16dad35ff7c22e2245ac474ebad832dbdbeb3d200c79a83806cd01';

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
      'left-extra-data': '{risk: false, stop: u0, time: u1, type: u0}',
      'right-extra-data': '{risk: false, stop: u0, time: u2, type: u0}',
    });
  },
});
