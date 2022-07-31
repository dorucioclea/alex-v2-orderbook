(use-trait sip010-trait .trait-sip-010.sip-010-trait)

(define-public (register-and-deposit (maker-pubkey (buff 33)) (amounts (list 10 uint)) (asset-ids (list 10 uint)) (asset-traits (list 10 <sip010-trait>)))
    (let 
        (
            (user-id (try! (contract-call? .stxdx-registry register-user maker-pubkey)))
        )
        (contract-call? .stxdx-wallet-zero transfer-in-many user-id amounts asset-ids asset-traits)
    )
)