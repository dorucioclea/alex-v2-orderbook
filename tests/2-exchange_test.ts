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
    });

    const left_signature =
      '0xf683892aeb1ee85dbaf13f4f755dce11226496a923625dd6734bfb0a3afc35c103de2d41bd57a8e01d0923b4e9bb65ef5055d99e8e4cbd59b0c7259a91034d3500';
    const right_signature =
      '0x5ebb47614350f292ca7207cb138375ffd976f3ff29ef807147da97448a084d540af1f8b0ffbf9d15d92e1831fd6f9a702d32af027f857e09d533d07d8db875f800';

    // const block = chain.mineBlock([
    //   Tx.contractCall(
    //     'stxdx-sender-proxy',
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
        'stxdx-sender-proxy',
        'match-orders',
        [
          left_order,
          right_order,
          left_signature,
          right_signature,
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
