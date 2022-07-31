import {
  Account,
  Chain,
  Clarinet,
  prepareChainBasicTest,
  Tx,
  types,
} from './includes.ts';

Clarinet.test({
  name: 'Wallet: can process transfer-out',
  fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get('wallet_2')!;
    const deployer = accounts.get('deployer')!;

    const results = prepareChainBasicTest(chain, accounts);
    results.receipts.forEach((e: any) => {
      e.result.expectOk();
    });

    let block = chain.mineBlock([
      Tx.contractCall(
        'stxdx-wallet-zero',
        'request-transfer-out',
        [
          types.uint(1e8),
          types.uint(2),
          types.uint(1),
          types.principal(deployer.address + '.token-wstx'),
        ],
        sender.address,
      ),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall(
        'stxdx-wallet-zero',
        'transfer-out',
        [types.uint(1), types.principal(deployer.address + '.token-wstx')],
        sender.address,
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(6003);

    const call: any = chain.callReadOnlyFn(
      'stxdx-wallet-zero',
      'get-request-or-fail',
      [types.uint(1)],
      sender.address,
    );
    const output: any = call.result.expectOk().expectTuple();
    chain.mineEmptyBlockUntil(
      Number(output['request-block'].replace(/\D/g, '')) + 101,
    );

    block = chain.mineBlock([
      Tx.contractCall(
        'stxdx-wallet-zero',
        'transfer-out',
        [types.uint(1), types.principal(deployer.address + '.token-wstx')],
        sender.address,
      ),
    ]);
    block.receipts[0].result.expectOk();
    console.log(block.receipts[0].events);
  },
});
