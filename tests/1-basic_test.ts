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
      'sender_fee': 1e8,
      maker: 2,
      'maker_asset': 1,
      'taker_asset': 2,
      'maker_asset_data': '0x004E7253000000000000000000000000', //14e8
      'taker_asset_data': '0x00E1F505000000000000000000000000', //1e8
      'maximum_fill': 1000,
      'expiration_height': 100,
      'extra_data': '0x',
      salt: 1,
    });
    const response = chain.callReadOnlyFn(
      contractNames.exchange,
      'hash-order',
      [order],
      sender.address,
    );

    // yarn run generate-order-hash "{ \"sender\": 1, \"sender_fee\": 1e8, \"maker\": 2, \"maker_asset\": 1, \"taker_asset\": 2, \"maker_asset_data\": \"0x004E7253000000000000000000000000\", \"taker_asset_data\": \"0x00E1F505000000000000000000000000\", \"maximum_fill\": 1000, \"expiration_height\": 100, \"extra_data\": \"0x\", \"salt\": 1 }"
    assertEquals(
      response.result,
      '0x39391701dde1a458dd569b241fdc54342b68e48c4806794184ef6a99025c6b28',
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
      'sender_fee': 1e8,
      maker: 2,
      'maker_asset': 1,
      'taker_asset': 2,
      'maker_asset_data': '0x004E7253000000000000000000000000',
      'taker_asset_data': '0x00E1F505000000000000000000000000',
      'maximum_fill': 100,
      'expiration_height': 100,
      'extra_data': '0x',
      salt: 1,
    });
    const right_order = orderToTupleCV({
      sender: 1,
      'sender_fee': 1e8,
      maker: 3,
      'maker_asset': 2,
      'taker_asset': 1,
      'maker_asset_data': '0x00E1F505000000000000000000000000',
      'taker_asset_data': '0x004E7253000000000000000000000000',
      'maximum_fill': 50,
      'expiration_height': 100,
      'extra_data': '0x',
      salt: 2,
    });
    // console.log(left_order, right_order);

    // yarn generate-order-hash "{ \"sender\": 1, \"sender_fee\": 1e8, \"maker\": 2, \"maker_asset\": 1, \"taker_asset\": 2, \"maker_asset_data\": \"0x004E7253000000000000000000000000\", \"taker_asset_data\": \"0x00E1F505000000000000000000000000\", \"maximum_fill\": 100, \"expiration_height\": 100, \"extra_data\": \"0x\", \"salt\": 1 }"
    const left_order_hash =
      '0x04688c14cf3bb557911fd2cbb6663aeea3b729ba2fcef0e1001b3135726879b0';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender_fee\": 1e8, \"maker\": 3, \"maker_asset\": 2, \"taker_asset\": 1, \"maker_asset_data\": \"0x00E1F505000000000000000000000000\", \"taker_asset_data\": \"0x004E7253000000000000000000000000\", \"maximum_fill\": 50, \"expiration_height\": 100, \"extra_data\": \"0x\", \"salt\": 2 }"
    const right_order_hash =
      '0x79bca0c59063dd38fe032d2cc65453c728f58661a159a1b9270092318a1a6ba4';

    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0x04688c14cf3bb557911fd2cbb6663aeea3b729ba2fcef0e1001b3135726879b0
    const left_signature =
      '0xee246c568e7eba56b30b3a643984b348c5a687e4d549e818ceb79280e9eaca401dfc99926ece91ec9e3af4d3ac2dc402cff5ec55ecade4bb25b53314a83e6f5801';
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x79bca0c59063dd38fe032d2cc65453c728f58661a159a1b9270092318a1a6ba4
    const right_signature =
      '0x012e2ec0fdc8f1e91f3e46cc6c9bf861f1b7f44c5fc7a70f2ce34d49fc803df01b48cb1341d3c9c60f69fa13cea485156cf914fbd9838634c3ee32d09f40500500';

    const response = chain.callReadOnlyFn(
      contractNames.exchange,
      'validate-match',
      [left_order, right_order, left_signature, right_signature, types.none()],
      sender.address,
    );
    const response_tuple = response.result.expectOk().expectTuple();
    assertEquals(response_tuple, {
      fillable: types.uint(50),
      'left-order-fill': types.uint(0),
      'left-order-hash': left_order_hash,
      'right-order-fill': types.uint(0),
      'right-order-hash': right_order_hash,
    });
  },
});