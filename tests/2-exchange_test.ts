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
      'maker-asset-data': 14e8,
      'taker-asset-data': 1e8,
      'maximum-fill': 100,
      'expiration-height': 100,
      salt: 1,
      risk: false,
      stop: 0,
      timestamp: 1,
      type: 0,
    });

    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': 1e8,
      'taker-asset-data': 14e8,
      'maximum-fill': 50,
      'expiration-height': 100,
      salt: 2,
      risk: false,
      stop: 0,
      timestamp: 2,
      type: 0,
    });

    const left_signature =
      '0x51b195c240eae83f7c42438a673c2338105851ab11d0ac6ded878d14981e9b7479b1a62a18af10b34a21acd0392cec7cfbb3b8ea19b355a7268e2526bddd66f401';
    const right_signature =
      '0x5e3c2e1f8d414b3abef2891a9198fe278534a648e2e01d92af4c52b381cfe4b5756fd6a7e6111110bf6995463a73ab055863d9e131de34cb9a467c73918bb49600';

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

    const left_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 2,
      'maker-asset': 1,
      'taker-asset': 2,
      'maker-asset-data': 22855,
      'taker-asset-data': 1,
      'maximum-fill': 100,
      'expiration-height': 100,
      salt: 1,
      risk: false,
      stop: 0,
      timestamp: 1,
      type: 0,
    });
    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': 1,
      'taker-asset-data': 1,
      'maximum-fill': 50,
      'expiration-height': 100,
      salt: 2,
      risk: false,
      stop: 0,
      timestamp: 2,
      type: 1,
    });

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": 22855, \"taker-asset-data\": 1, \"maximum-fill\": 100, \"expiration-height\": 100, \"salt\": 1, \"risk\": false, \"stop\": 0, \"timestamp\": 1, \"type\": 0 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x94dc395eab0640041348df411995f35527c70246ea4facc98b061c1613b5f8fb
    const left_signature =
      '0x727cab7e6c3695222ae18492ed8a47fe14ee180acf5f20c80cf59f1407e50ac21ba754fb31710a2d2be048812fb42b8c012780eb9df0a1cb0573ce8df54bdba601';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": 1, \"taker-asset-data\": 1, \"maximum-fill\": 50, \"expiration-height\": 100, \"salt\": 2, \"risk\": false, \"stop\": 0, \"timestamp\": 2, \"type\": 1 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x49005ef87a3cd9ec603d717585dae4f026a7a3d0f54052aa312ea1c4c22820bc
    const right_signature =
      '0xd4e9bdcab5c652f3f27674c1426ee7a0691edebfd8f9b30ef19e6980113aeb022e94973d61bdea3e6055b31d5ee18c400e199a3c7f8f12a95fe1a149f532eb0300';

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

    const left_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 2,
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': 1,
      'taker-asset-data': 22808,
      'maximum-fill': 100,
      'expiration-height': 100,
      salt: 1,
      risk: false,
      stop: 0,
      timestamp: 1,
      type: 0,
    });

    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 1,
      'taker-asset': 2,
      'maker-asset-data': 22855,
      'taker-asset-data': 1,
      'maximum-fill': 50,
      'expiration-height': 100,
      salt: 2,
      risk: false,
      stop: 0,
      timestamp: 2,
      type: 2,
    });

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": 1, \"taker-asset-data\": 22808, \"maximum-fill\": 100, \"expiration-height\": 100, \"salt\": 1, \"risk\": false, \"stop\": 0, \"timestamp\": 1, \"type\": 0 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0xb26072bb08ec119ac18aadc930c50bb1bc71161012674ff0c9c7e4b5dfe154d0
    const left_signature =
      '0xc09731b7f3a7a2bc4cdf9eabe79e8dd9494f561d65bd8fa176fa3742f54718584eb6d6bd2afd7ef5ec08741339d5943e48d4eb48bea924da0db0727b56c4b6fd00';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": 22855, \"taker-asset-data\": 1, \"maximum-fill\": 50, \"expiration-height\": 100, \"salt\": 2, \"risk\": false, \"stop\": 0, \"timestamp\": 2, \"type\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x82a6ee06d550045eb2dc401a04c32bd99fef8cc16636a885984b0430b2352a57
    const right_signature =
      '0x7defeb8cfbf56eddbe428a424cb86c93d7ead145a6149546bedf11dd5563e3012e48895772a41e01ed6c1ac9b34d3f717293a3b39a04613044baf07d6317670901';

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
  name: 'Exchange: can match buy market limit order',
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
      'maker-asset': 2,
      'taker-asset': 1,
      'maker-asset-data': 1,
      'taker-asset-data': 22808,
      'maximum-fill': 100,
      'expiration-height': 100,
      salt: 1,
      risk: false,
      stop: 0,
      timestamp: 1,
      type: 0,
    });

    const right_order = orderToTupleCV({
      sender: 1,
      'sender-fee': 1e8,
      maker: 3,
      'maker-asset': 1,
      'taker-asset': 2,
      'maker-asset-data': 22855,
      'taker-asset-data': 1,
      'maximum-fill': 50,
      'expiration-height': 100,
      salt: 2,
      risk: false,
      stop: 0,
      timestamp: 2,
      type: 2,
    });

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": 1, \"taker-asset-data\": 22808, \"maximum-fill\": 100, \"expiration-height\": 100, \"salt\": 1, \"risk\": false, \"stop\": 0, \"timestamp\": 1, \"type\": 0 }"
    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0xb26072bb08ec119ac18aadc930c50bb1bc71161012674ff0c9c7e4b5dfe154d0
    const left_signature =
      '0xc09731b7f3a7a2bc4cdf9eabe79e8dd9494f561d65bd8fa176fa3742f54718584eb6d6bd2afd7ef5ec08741339d5943e48d4eb48bea924da0db0727b56c4b6fd00';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": 22855, \"taker-asset-data\": 1, \"maximum-fill\": 50, \"expiration-height\": 100, \"salt\": 2, \"risk\": false, \"stop\": 0, \"timestamp\": 2, \"type\": 2 }"
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x82a6ee06d550045eb2dc401a04c32bd99fef8cc16636a885984b0430b2352a57
    const right_signature =
      '0x7defeb8cfbf56eddbe428a424cb86c93d7ead145a6149546bedf11dd5563e3012e48895772a41e01ed6c1ac9b34d3f717293a3b39a04613044baf07d6317670901';

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
