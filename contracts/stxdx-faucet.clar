(define-public (faucet-one 
	(recipient principal))
  (begin
    (try! (stx-transfer? u10000000000 tx-sender recipient))
    (try! (contract-call? .age000-governance-token mint u1000000000000 recipient))
    (try! (contract-call? .token-xusd mint u1000000000000 recipient))
    (try! (contract-call? .token-apower mint u10000000000 recipient))
    (try! (contract-call? .token-xbtc mint u100000000 recipient))
    (ok u0)
  )
)

(define-public (faucet-many 
	(recipient-list
		(list 299 principal)
	))
	(ok (map faucet-one recipient-list))
)
