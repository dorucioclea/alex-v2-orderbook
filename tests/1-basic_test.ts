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
        '0x0c00000004047269736b030473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000',
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
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000';

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

    // yarn run generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x004E7253000000000000000000000000\", \"taker-asset-data\": \"0x00E1F505000000000000000000000000\", \"maximum-fill\": 1000, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000\", \"salt\": 1 }"
    assertEquals(
      response.result,
      '0xad4e26db834064789cacd1e0d9ae02d5f6c4d4c45faacfa7874c9fb5d4e31d92',
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
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000';

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
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000000';
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

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x004E7253000000000000000000000000\", \"taker-asset-data\": \"0x00E1F505000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000\", \"salt\": 1 }"
    const left_order_hash =
      '0xf9dc05f614a96354f89b0c0be1b99da6611d5713f2cac302bb5d0bee25cbe303';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x00E1F505000000000000000000000000\", \"taker-asset-data\": \"0x004E7253000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000000\", \"salt\": 2 }"
    const right_order_hash =
      '0x891ec8206397ae7475b4b64309355b0f454e9d707b24556d91b1f2327512979e';

    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0xf9dc05f614a96354f89b0c0be1b99da6611d5713f2cac302bb5d0bee25cbe303
    const left_signature =
      '0xaa0d4ed3479761b42649e3be78928ba813245ba8cdf24cdc33ebbb735a1cf5432995c2dfeb0ee0de7b71bf2f4ed0adaea4a600455bd41b9cb2ef5791713bd2e601';
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x891ec8206397ae7475b4b64309355b0f454e9d707b24556d91b1f2327512979e
    const right_signature =
      '0xecd7fde1ce1e45329069afa80a0c5dcce2ede096e2f7120676519a4c2221de9d679f5edaafad5a3665e3a8cf246d93f2e6eaf5b18cb7d8c3811ca15fa2033e4d01';

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
