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
        '0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000',
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
        '0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650100000000000000000000000000000000',
      salt: 2,
    });

    const left_signature =
      '0x8641824455adc64078c57e7fe3da4a26437891d9342ae224351b05340e9005635daf56268dec32f4344ebd33833145042639099055398cb7a54dc63ae428dbab00';
    const right_signature =
      '0x9af4e78fb8cf8edb15871886b3c57ada7fe4e1ec5931146439ad20f27891b46e46489e60f3fe16dad35ff7c22e2245ac474ebad832dbdbeb3d200c79a83806cd01';

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
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 2, \"type\": 1 }"
    const right_extra =
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650101000000000000000000000000000000';

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

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x47590000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0xcf2e8e5bc7cf69e031dc83187f1b02d4292d4648be770dc30b1ddf5c0cd5e77b
    const left_signature =
      '0x21e834bef3833746fb0308f328c1cc6018ae51c26c7d215f86ca8ea41d0345db1c646a550a9155f082b02d0d2232c569441aa1d088f982e5dd7f32e05ccd9be301';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650101000000000000000000000000000000\", \"salt\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0xe80d135edd4b0eec80611d8d1cbe35d875d152f7f1cbd0980449b15a16052ff6
    const right_signature =
      '0xaa6d24ac7149595be3438e5aec96c11571af82b8046ba639d565d57cb5607e4940be56dd027f607c275cb7c565fe3657b26e47eec49e67520a1656892d1d509f00';

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
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 2, \"type\": 2 }"
    const right_extra =
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650102000000000000000000000000000000';

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

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x18590000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x1ef112628f9602bdaa8894fbd275bce1720b7fc57f6381154c9e97578b412acb
    const left_signature =
      '0xb3ab76c7537f34f87ab335616ecc42c8ca09c0e73f64d18d6f00c33b9c39f7346db35f32bf3dc8895d8b7f751b015f08eae0a16585ff596792305a8714184fa201';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x47590000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650102000000000000000000000000000000\", \"salt\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0xb60c4530c705cefa0aa85d649fe457189856257a676f1bf639a9d034f450b8b5
    const right_signature =
      '0x87b191b01034bef87462453ead75c1e982c9b382dfa61ff98e00a38c8f0a53976644f068e49cb25f724dc70a353b4b00c9817414a506c2a3a09f5938db912c7f01';

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
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 1, \"type\": 0 }"
    const right_extra =
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000';

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

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x18590000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x1ef112628f9602bdaa8894fbd275bce1720b7fc57f6381154c9e97578b412acb
    const left_signature =
      '0xb3ab76c7537f34f87ab335616ecc42c8ca09c0e73f64d18d6f00c33b9c39f7346db35f32bf3dc8895d8b7f751b015f08eae0a16585ff596792305a8714184fa201';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x47590000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000\", \"salt\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0xcc270629dcf762a749fd6e81af0283a2528a43cb31428dd12815b47b18b58a11
    const right_signature =
      '0xee58dea1d2c886bf2d2158ce29f50ffb2be1ad74ce524b7d9f519fa800eec59a2bac81758f153c6022fb77d2de0383f85da71569d256bd7353d3be6b96143cb900';

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
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 2, \"type\": 2 }"
    const right_extra =
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650102000000000000000000000000000000';

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

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x9d7b72993e4e8fd06202cf37c7a41b21a3691ed6c5b8a50232e83645e0a2db3f
    const left_signature =
      '0x47712b038b5a5a3bf4f2c75d5a7d465a28c1fba17420277b0d7f7e1e899d8aed3f8c60a891c01d0b597b27bd3b9b734f9f235dc3d4316b70a6c1a95f00a1170600';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x47590000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650102000000000000000000000000000000\", \"salt\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x0342a4cf7e133f643aaf3d0c17385238847ff9aff98be7c3087acb75435e3266
    const right_signature =
      '0x942a48f405c4fb79340db16bb7e21f058726f1967cda734d869c40b0e20c335645c18f82e2ea770205a0e8987ff48ec95de64fab43c2baac0db0574144a1a8dc01';

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
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000';
    // yarn run generate-order-extra-data "{ \"risk\": false, \"stop\": 0, \"time\": 2, \"type\": 2 }"
    const right_extra =
      '0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650102000000000000000000000000000000';

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

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x01000000000000000000000000000000\", \"taker-asset-data\": \"0x47590000000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010100000000000000000000000000000004747970650100000000000000000000000000000000\", \"salt\": 1 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x36f277f427feb3f2b6d73c19fc54483a46c62c1f6e024a2bcbe2d5d0c09ad07f
    const left_signature =
      '0x536a75f2b7c6e6a5b6f9c2e0dcb37555032ac1e6446428a957b35e50b1e463c73ca4f0a2700d337df06f81d134181433735433be5999a962e612f8b9f4b3220900';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x18590000000000000000000000000000\", \"taker-asset-data\": \"0x01000000000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x047269736b000473746f7001000000000000000000000000000000000474696d65010200000000000000000000000000000004747970650102000000000000000000000000000000\", \"salt\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x80600e7ea7a748f174dec04139b77ae0764194c24d9714efe850ffbe0b0f4edd
    const right_signature =
      '0xc59aa89d07c6e4250decf319d2c771500dd82745ffacc2bf7e4660774b7b95bd7858e7d25f853fe73f084552e24990d8d29008dcddc1f294b026ac03fc75829600';

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
