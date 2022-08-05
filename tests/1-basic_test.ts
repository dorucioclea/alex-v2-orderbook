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
    });
    const response = chain.callReadOnlyFn(
      contractNames.exchange,
      'hash-order',
      [order],
      sender.address,
    );

    // yarn run generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x004E7253000000000000000000000000\", \"taker-asset-data\": \"0x00E1F505000000000000000000000000\", \"maximum-fill\": 1000, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 1 }"
    assertEquals(
      response.result,
      '0x9ea2a0a9f02cf521f42d5c93d1bfe0044da9038ba020677bab8a5183dd496aa0',
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
    // console.log(left_order, right_order);

    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 2, \"maker-asset\": 1, \"taker-asset\": 2, \"maker-asset-data\": \"0x004E7253000000000000000000000000\", \"taker-asset-data\": \"0x00E1F505000000000000000000000000\", \"maximum-fill\": 100, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 1 }"
    const left_order_hash =
      '0xbb959eac2fee756c1d485bd52c773b7cc8167dd52b6b390eacf2861fff182154';
    // yarn generate-order-hash "{ \"sender\": 1, \"sender-fee\": 1e8, \"maker\": 3, \"maker-asset\": 2, \"taker-asset\": 1, \"maker-asset-data\": \"0x00E1F505000000000000000000000000\", \"taker-asset-data\": \"0x004E7253000000000000000000000000\", \"maximum-fill\": 50, \"expiration-height\": 100, \"extra-data\": \"0x\", \"salt\": 2 }"
    const right_order_hash =
      '0x605b2d8f902e5457c5e8c19e65cc1cba7df1ba43758c0eebf586aec685ebcc3d';

    // yarn sign-order-hash 530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101 0xbb959eac2fee756c1d485bd52c773b7cc8167dd52b6b390eacf2861fff182154
    const left_signature =
      '0xf683892aeb1ee85dbaf13f4f755dce11226496a923625dd6734bfb0a3afc35c103de2d41bd57a8e01d0923b4e9bb65ef5055d99e8e4cbd59b0c7259a91034d3500';
    // yarn sign-order-hash d655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901 0x605b2d8f902e5457c5e8c19e65cc1cba7df1ba43758c0eebf586aec685ebcc3d
    const right_signature =
      '0x5ebb47614350f292ca7207cb138375ffd976f3ff29ef807147da97448a084d540af1f8b0ffbf9d15d92e1831fd6f9a702d32af027f857e09d533d07d8db875f800';

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