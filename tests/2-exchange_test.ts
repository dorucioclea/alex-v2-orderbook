import {
  Account,
  Chain,
  Clarinet,
  orderToTupleCV,
  prepareChainBasicTest,
  Tx,
  types,
} from './includes.ts';

Clarinet.test({
  name: 'Exchange: can match orders (signature validation)',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet-1')!;

    const results = prepareChainBasicTest(chain, accounts);
    results.receipts.forEach((e: any) => {
      e.result.expectOk();
    });

    const left-order = orderToTupleCV({
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
    });
    const right-order = orderToTupleCV({
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
    });

    const left-signature =
      '0xee246c568e7eba56b30b3a643984b348c5a687e4d549e818ceb79280e9eaca401dfc99926ece91ec9e3af4d3ac2dc402cff5ec55ecade4bb25b53314a83e6f5801';
    const right-signature =
      '0x012e2ec0fdc8f1e91f3e46cc6c9bf861f1b7f44c5fc7a70f2ce34d49fc803df01b48cb1341d3c9c60f69fa13cea485156cf914fbd9838634c3ee32d09f40500500';

    // const block = chain.mineBlock([
    //   Tx.contractCall(
    //     'stxdx-sender-proxy',
    //     'match-orders-many',
    //     [
    //       types.list([
    //         types.tuple({
    //           'left-order': left-order,
    //           'right-order': right-order,
    //           'left-signature': left-signature,
    //           'right-signature': right-signature,
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
        'stxdx-sender-proxy',
        'match-orders',
        [
          left-order,
          right-order,
          left-signature,
          right-signature,
          types.none(),
        ],
        sender.address,
      ),
    ]);
    block.receipts[0].result
      .expectOk()
      .expectUint(50);
    console.log(block.receipts[0].events);    
  },
});
