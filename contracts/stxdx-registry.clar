(impl-trait .trait-ownable.ownable-trait)

;; 4000-4999: registry errors
(define-constant err-unauthorised-caller (err u4000))
(define-constant err-unauthorised-sender (err u4001))
(define-constant err-storage-failure (err u4002))

(define-constant err-unknown-user-id (err u3500))
(define-constant err-unknown-asset-id (err u3501))
(define-constant err-user-already-registered (err u3502))
(define-constant err-asset-already-registered (err u3503))

(define-map order-fills (buff 32) uint)
(define-map order-approvals {maker: principal, order-hash: (buff 32)} bool)
(define-map authorised-exchanges principal bool)

(define-data-var contract-owner principal tx-sender)

(define-read-only (get-contract-owner)
	(ok (var-get contract-owner))
)

(define-public (set-contract-owner (new-owner principal))
	(begin
		(asserts! (is-eq (var-get contract-owner) tx-sender) err-unauthorised-sender)
		(ok (var-set contract-owner new-owner))
	)
)

(define-private (is-contract-owner)
	(ok (asserts! (is-eq (var-get contract-owner) tx-sender) err-unauthorised-caller))
)

(define-map user-registry
	uint
	{
		maker: principal,
		maker-pubkey: (buff 33)
	}
)
(define-data-var user-registry-nonce uint u0)
(define-map user-id-registry principal uint)

(define-map asset-registry uint principal)
(define-map asset-registry-ids principal uint)
(define-data-var asset-registry-nonce uint u0)

(define-public (register-asset (asset principal))
	(let
		(
			(asset-id (+ (var-get asset-registry-nonce) u1))
		)
		(try! (is-contract-owner))		
		(asserts! (map-insert asset-registry-ids asset asset-id) err-asset-already-registered)
		(map-insert asset-registry asset-id asset) 		
		(var-set asset-registry-nonce asset-id)		
		(ok asset-id)
	)
)

(define-public (register-user (maker-pubkey (buff 33)))
	(let
		(
			(reg-id (+ (var-get user-registry-nonce) u1))
		)
		(asserts! (map-insert user-id-registry tx-sender reg-id) err-user-already-registered)
		(map-insert user-registry reg-id {maker: tx-sender, maker-pubkey: maker-pubkey})		
		(var-set user-registry-nonce reg-id)
		(ok reg-id)
	)
)

(define-read-only (get-user-id (user principal))
	(map-get? user-id-registry user)
)

(define-read-only (get-user-id-or-fail (user principal))
	(ok (unwrap! (map-get? user-id-registry user) err-unknown-user-id))
)

(define-read-only (user-from-id (id uint))
	(map-get? user-registry id)
)

(define-read-only (user-from-id-or-fail (id uint))
	(ok (unwrap! (map-get? user-registry id) err-unknown-user-id))
)

(define-read-only (get-two-users-from-id-or-fail (id-1 uint) (id-2 uint))
	(ok {
		user-1: (unwrap! (map-get? user-registry id-1) err-unknown-user-id), 
		user-2: (unwrap! (map-get? user-registry id-2) err-unknown-user-id)
	})
)

(define-read-only (user-maker-from-id (id uint))
	(get maker (map-get? user-registry id))
)

(define-read-only (user-maker-from-id-or-fail (id uint))
	(ok (get maker (unwrap! (map-get? user-registry id) err-unknown-user-id)))
)

(define-read-only (asset-from-id (id uint))
	(map-get? asset-registry id)
)

(define-read-only (get-asset-id (asset principal))
	(map-get? asset-registry-ids asset)
)

(define-read-only (asset-from-id-or-fail (id uint))
	(ok (unwrap! (map-get? asset-registry id) err-unknown-asset-id))
)

(define-private (valid-exchange-caller)
	(ok (asserts! (is-approved-exchange contract-caller) err-unauthorised-caller))
)

(define-read-only (get-order-fill (order-hash (buff 32)))
	(default-to u0 (map-get? order-fills order-hash))
)

(define-read-only (get-two-order-fills (order-hash-1 (buff 32)) (order-hash-2 (buff 32)))
	{
		order-1: (default-to u0 (map-get? order-fills order-hash-1)),
		order-2: (default-to u0 (map-get? order-fills order-hash-2))
	}
)

(define-read-only (get-order-fills (order-hashes (list 200 (buff 32))))
	(map get-order-fill order-hashes)
)

(define-public (set-order-fill (order-hash (buff 32)) (new-fill uint))
	(begin
		(try! (valid-exchange-caller))
		(ok (asserts! (map-set order-fills order-hash new-fill) err-storage-failure))
	)
)

(define-public (set-two-order-fills (order-hash-1 (buff 32)) (new-fill-1 uint) (order-hash-2 (buff 32)) (new-fill-2 uint))
	(begin
		(try! (valid-exchange-caller))
		(ok (asserts! (and (map-set order-fills order-hash-1 new-fill-1) (map-set order-fills order-hash-2 new-fill-2)) err-storage-failure))
	)
)

(define-private (set-order-fills-iter (item {order-hash: (buff 32), new-fill: uint}) (prev bool))
	(and prev (map-set order-fills (get order-hash item) (get new-fill item)))
)

(define-public (set-order-fills (fills (list 200 {order-hash: (buff 32), new-fill: uint})))
	(begin
		(try! (valid-exchange-caller))
		(ok (asserts! (fold set-order-fills-iter fills true) err-storage-failure))
	)
)

(define-read-only (get-order-approval (maker principal) (order-hash (buff 32)))
	(default-to false (map-get? order-approvals {maker: maker, order-hash: order-hash}))
)

(define-public (set-order-approval (order-hash (buff 32)))
	(ok (map-set order-approvals {maker: tx-sender, order-hash: order-hash} true))
)

(define-public (set-order-approval-on-behalf (maker uint) (order-hash (buff 32)))
	(begin
		(try! (valid-exchange-caller))
		(ok (map-set order-approvals {maker: (try! (user-maker-from-id-or-fail maker)), order-hash: order-hash} true))
	)
)

(define-public (approve-exchange (exchange principal) (approved bool))
	(begin
		(try! (is-contract-owner))
		(ok (map-set authorised-exchanges exchange approved))
	)
)

(define-read-only (is-approved-exchange (exchange principal))
	(default-to false (map-get? authorised-exchanges exchange))
)
