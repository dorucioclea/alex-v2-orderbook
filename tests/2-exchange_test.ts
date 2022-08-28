import {
  Account,
  Chain,
  Clarinet,
  contractNames,
  orderToTupleCV,
  prepareChainBasicTest,
  Tx,
  types,
} from './includes.ts';

Clarinet.test({
  name: 'Exchange: can match orders (signature validation)',
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

    const left_signature =
      '0x63ba5eec3b711afc2122d6ea4cd31d01bc3681c559c6ecc4ef31fb795adb6c2f23f8a46dbd8198efed03328be1f8c295e18e77750ad36667780e8534d6b3361e00';
    const right_signature =
      '0x66c07047a0ce9b372dd7fb6d0458cb4264135f074213d7046b980ac3d9fbf1215df840cb35972fc3f1ce7c46e6079f58487fbf08cdc2d2c358389918e22735f801';

    // const block = chain.mineBlock([
    //   Tx.contractCall(
    //     contractNames.sender_proxy,
    //     'match-orders-many',
    //     [
    //       types.list([
    //         types.tuple({
    //           'left-order': left_order,
    //           'right-order': right_order,
    //           'left-signature': left_signature,
    //           'right-signature': right_signature,
    //           fill: types.none(),
    //         }),
    //       ]),
    //     ],
    //     sender.address,
    //   ),
    // ]);
    // block.receipts[0].result
    //   .expectOk()
    //   .expectList()[0]
    //   .expectOk()
    //   .expectUint(50);
    // console.log(block.receipts[0].events);

    const block = chain.mineBlock([
      Tx.contractCall(
        contractNames.sender_proxy,
        'match-orders',
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
      ),
    ]);
    block.receipts[0].result
      .expectOk()
      .expectTuple()
      ['fillable'].expectUint(50);
    // console.log(block.receipts[0].events);
  },
});

Clarinet.test({
  name: 'Exchange: can match loose orders (signature validation)',
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
      'maker-asset-data': '0x47590000000000000000000000000000', // u22855
      'taker-asset-data': '0x01000000000000000000000000000000',
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
      'maker-asset-data': '0x01000000000000000000000000000000',
      'taker-asset-data': '0x18590000000000000000000000000000', // u22808
      'maximum-fill': 50,
      'expiration-height': 100,
      'extra-data': '0x',
      salt: 2,
      timestamp: 1,
    });

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x47590000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 1, \"timestamp\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x384b9c6edc1ac957502b34705472ff930a828ab8f1d44d0e7aeb0d9e782813a4
    const left_signature =
      '0xe667c4b998e9c418a851fd681e0188f04dd56b7ec82fe29705ea5e249f572a5b541dff57a493a9917a191445e88f46327c1c0b736e1504d6d916c0334a1589f400';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x18590000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 2, \"timestamp\": 1 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0xf827fd5672d6e0cec7fc962ba4c8926ecf394ae1891324ec04d305b1272e3db9
    const right_signature =
      '0xb7ed0e4b6fd26cb78b87d3cfcd9a5bd5d7132bd6546662c520f7b88b8d32d86128b1c8a859b10a200fd35232131ea00b360d5be0a524186c79c7814ee677124901';

    const block = chain.mineBlock([
      Tx.contractCall(
        contractNames.sender_proxy,
        'match-orders',
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
      ),
    ]);
    block.receipts[0].result
      .expectOk()
      .expectTuple()
      ['left-order-make'].expectUint(Math.floor((22855 + 22808) / 2));
    // console.log(block.receipts[0].events);
  },
});
