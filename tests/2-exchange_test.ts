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
  name: 'Exchange: can match two vanilla limit order',
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
      'extra-data':
        '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000',
      salt: 1,
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
      'extra-data':
        '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000000',
      salt: 2,
    });

    const left_signature =
      '0xaa0d4ed3479761b42649e3be78928ba813245ba8cdf24cdc33ebbb735a1cf5432995c2dfeb0ee0de7b71bf2f4ed0adaea4a600455bd41b9cb2ef5791713bd2e601';
    const right_signature =
      '0xecd7fde1ce1e45329069afa80a0c5dcce2ede096e2f7120676519a4c2221de9d679f5edaafad5a3665e3a8cf246d93f2e6eaf5b18cb7d8c3811ca15fa2033e4d01';

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
  name: 'Exchange: can match sell market limit order',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet_1')!;

    const results = prepareChainBasicTest(chain, accounts);
    results.receipts.forEach((e: any) => {
      e.result.expectOk();
    });

    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const left_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 2, \"type\": 1 }"
    const right_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000001';

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
      'extra-data': left_extra,
      salt: 1,
    });
    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': '0x01000000000000000000000000000000',
      'taker-asset-data': '0x01000000000000000000000000000000', // u1
      'maximum-fill': 50,
      'expiration-height': 100,
      'extra-data': right_extra,
      salt: 2,
    });

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x47590000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x005291d9994d95ca7c8003317009293dc44ca9636987750b3f9a3888b231bc4e
    const left_signature =
      '0x0018b13c660cbcd42af3bbc29473ea05b888f4feaef3c81a968cd0b0ae161d4e636d8114759b7ca3a6ead683832b4a9c3938a5525a976dc3a2b7b78d9b35e1a600';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000001\", \"salt\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0xe7f39b11d970d8b5621099e976c3694d5c4115b5f41ddaa7df1744248182a42e
    const right_signature =
      '0xf9ebc5fdd52a3b8c4620cc26506e0fa914c29f57988f99234d6198c89d3dc4eb397358decb5994a04d13cc7cc05e60964b856b7c758a00f2093bdfba43608e2101';

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
      ['left-order-make'].expectUint(22855);
  },
});

Clarinet.test({
  name: 'Exchange: can match buy market limit order',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet_1')!;

    const results = prepareChainBasicTest(chain, accounts);
    results.receipts.forEach((e: any) => {
      e.result.expectOk();
    });

    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const left_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 2, \"type\": 2 }"
    const right_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000002';

    const left_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 2,
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': '0x01000000000000000000000000000000',
      'taker-asset-data': '0x18590000000000000000000000000000', // u22808
      'maximum-fill': 100,
      'expiration-height': 100,
      'extra-data': left_extra,
      salt: 1,
    });

    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 1,
      'taker-asset': 2,
      'maker-asset-data': '0x47590000000000000000000000000000', // u22855
      'taker-asset-data': '0x01000000000000000000000000000000', // u1
      'maximum-fill': 50,
      'expiration-height': 100,
      'extra-data': right_extra,
      salt: 2,
    });

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x18590000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x7156794ee9f56202d6629e3711505d34722fc9e16a58ca011cbe4c8f8d12987e
    const left_signature =
      '0x1bef0f096aff0189a1f90791b8fcfc323c389d7800d5a90b4fc17fa5145f9f4515708b1efe1b8e8260633635be0feaa8cf0cf7b56445c9f6617d0e47d5b8d1a700';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x47590000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000002\", \"salt\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0xb658f7cef9ad7790a7409d1afd4f34356916046aa498d8a7daf9a1b996666940
    const right_signature =
      '0x0a44356cf099660308157335b88d0ea50b096bfd6727d2cdc5b44a30ae16851d1e4faa0e3416f9aa1b3a2354ed96fcfb23d0894fbe95887c71258c73277e378b00';

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
      ['right-order-make'].expectUint(22808);
  },
});

Clarinet.test({
  name: 'Exchange: fail if not left-order timestamp > right-order timestamp',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet_1')!;

    const results = prepareChainBasicTest(chain, accounts);
    results.receipts.forEach((e: any) => {
      e.result.expectOk();
    });

    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const left_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const right_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000';

    const left_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 2,
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': '0x01000000000000000000000000000000',
      'taker-asset-data': '0x18590000000000000000000000000000', // u22808
      'maximum-fill': 100,
      'expiration-height': 100,
      'extra-data': left_extra,
      salt: 1,
    });
    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 1,
      'taker-asset': 2,
      'maker-asset-data': '0x47590000000000000000000000000000', // u22855
      'taker-asset-data': '0x01000000000000000000000000000000', // u1
      'maximum-fill': 50,
      'expiration-height': 100,
      'extra-data': right_extra,
      salt: 2,
    });

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x18590000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x7156794ee9f56202d6629e3711505d34722fc9e16a58ca011cbe4c8f8d12987e
    const left_signature =
      '0x1bef0f096aff0189a1f90791b8fcfc323c389d7800d5a90b4fc17fa5145f9f4515708b1efe1b8e8260633635be0feaa8cf0cf7b56445c9f6617d0e47d5b8d1a700';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x47590000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000\", \"salt\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x9cb27b2106f7dedfb487d2b8cfd4f75831356aaccbeb2aa1b603a896e0edf8a5
    const right_signature =
      '0x96f563bee7461e294537caa28d634c49cd809890f57d3c7c3b4a370dcc04525c7f49995cee17dcd7861559654714aeca2dfc7f98ab52f360125661266fd67ffe01';

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
    block.receipts[0].result.expectErr().expectUint(3011);
  },
});

Clarinet.test({
  name: 'Exchange: fail to match sell market limit order if left-make < right-take',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet_1')!;

    const results = prepareChainBasicTest(chain, accounts);
    results.receipts.forEach((e: any) => {
      e.result.expectOk();
    });

    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const left_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 2, \"type\": 2 }"
    const right_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000002';

    const left_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 2,
      'maker-asset': 1,
      'taker-asset': 2,
      'maker-asset-data': '0x01000000000000000000000000000000',
      'taker-asset-data': '0x01000000000000000000000000000000',
      'maximum-fill': 100,
      'expiration-height': 100,
      'extra-data': left_extra,
      salt: 1,
    });
    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': '0x01000000000000000000000000000000',
      'taker-asset-data': '0x47590000000000000000000000000000', // u22855
      'maximum-fill': 50,
      'expiration-height': 100,
      'extra-data': right_extra,
      salt: 2,
      timestamp: 2,
    });

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0xdf76255e6e7bb5fe4a42874c2e0aafcec1d410d24d519f44fd3bc23c2330e807
    const left_signature =
      '0xec213583ee49f7afb6ff0340560ade96c923a7bfaec8f72da3944f56cae05d8c4200413ab6c656e710590e379825aaa5cbc7f391fc1e0369f9e5bed875482b1701';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x47590000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000002\", \"salt\": 2 }"
    // yarn sign-order-hash 0xce28fd7597e0b36fa6ce53b4880a07db8739d6ea8bc8a3feefc22579baf49164 0x0342a4cf7e133f643aaf3d0c17385238847ff9aff98be7c3087acb75435e3266
    const right_signature =
      '0x7c366d574ded146ce89289987cb7d3e75fa34ff3bd1a8b9a7c64c07171aad084014962c22f07ca863b1c6c17ccbfbab4a35c0f6428a761e3be9c29cb508c453800';

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
    block.receipts[0].result.expectErr().expectUint(3003);
  },
});

Clarinet.test({
  name: 'Exchange: fail to match buy market limit order if right-make < left-take',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet_1')!;

    const results = prepareChainBasicTest(chain, accounts);
    results.receipts.forEach((e: any) => {
      e.result.expectOk();
    });

    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const left_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 2, \"type\": 2 }"
    const right_extra =
      '0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000002';

    const left_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 2,
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': '0x01000000000000000000000000000000',
      'taker-asset-data': '0x47590000000000000000000000000000', // u22855
      'maximum-fill': 100,
      'expiration-height': 100,
      'extra-data': left_extra,
      salt: 1,
      timestamp: 1,
    });
    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 1,
      'taker-asset': 2,
      'maker-asset-data': '0x18590000000000000000000000000000', // u22808
      'taker-asset-data': '0x01000000000000000000000000000000', // u1
      'maximum-fill': 50,
      'expiration-height': 100,
      'extra-data': right_extra,
      salt: 2,
      timestamp: 2,
    });

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x47590000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000104747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x297aaebd731b00db673b62e9bb26c7b23c039d759a62531a71f237fd77da45d7
    const left_signature =
      '0xd9422de858ec3b3612a3d03b0647f0a48dd28b3425a07b0da6ae83d2c60dd2a041e2e3483f88ce83fcbdf4e674e5cbc7f592ef2b992ed61010dd2b26192a24b301';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x18590000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x0c00000004047269736b040473746f7001000000000000000000000000000000000474696d65010000000000000000000000000000000204747970650100000000000000000000000000000002\", \"salt\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0xf34e2373133d72a2c48614e239423f44a4f63deeb5d2d2ccd9820937a1de0e9a
    const right_signature =
      '0x7b591c7d764dea28512bfbaf011ce28236801305712cd2434d80f5983514871e594f745518da17a6562b84bf071164f4e0d0f97a38830cde3ec9cc2220a7a17101';

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
    block.receipts[0].result.expectErr().expectUint(3003);
  },
});
