(impl-trait .trait-ownable.ownable-trait)

;; 3000-3999: core errors
(define-constant err-unauthorised-sender (err u3000))
(define-constant err-maker_asset-mismatch (err u3001))
(define-constant err-taker_asset-mismatch (err u3002))
(define-constant err-maker_asset_data-mismatch (err u3003))
(define-constant err-taker_asset_data-mismatch (err u3004))
(define-constant err-left-order-expired (err u3005))
(define-constant err-right-order-expired (err u3006))
(define-constant err-left-authorisation-failed (err u3007))
(define-constant err-right-authorisation-failed (err u3008))
(define-constant err-maximum_fill-reached (err u3009))
(define-constant err-maker-not-tx-sender (err u3010))

;; 4000-4999: registry errors
(define-constant err-unauthorised-caller (err u4000))

;; 5000-5999: exchange errors
(define-constant err-asset_data-too-long (err u5003))
(define-constant err-sender_fee-payment-failed (err u5007))
(define-constant err-asset-contract-call-failed (err u5008))

(define-constant ONE_8 u100000000)
(define-constant structured-data-prefix 0x534950303138)

(define-data-var contract-owner principal tx-sender)
(define-map authorised-senders principal bool)

(define-private (is-contract-owner)
	(ok (asserts! (is-eq (var-get contract-owner) tx-sender) err-unauthorised-caller))
)

(define-public (set-contract-owner (new-owner principal))
	(begin
		(try! (is-contract-owner))
		(ok (var-set contract-owner new-owner))
	)
)

(define-public (set-authorised-sender (authorised bool) (sender principal))
	(begin
		(try! (is-contract-owner))
		(ok (map-set authorised-senders sender authorised))
	)
)

(define-private (is-authorised-sender)
	(ok (asserts! (default-to false (map-get? authorised-senders contract-caller)) err-unauthorised-sender))
)

(define-read-only (get-contract-owner)
	(ok (var-get contract-owner))
)

(define-constant message-domain 0xa029c5596ed80a140feec731f59708a05a78dd104ebbc1dc95b8ff8785cc7549)

(define-private (validate-authorisation (fills uint) (maker principal) (maker-pubkey (buff 33)) (hash (buff 32)) (signature (buff 65)))
	(begin
		(or
			(> fills u0)
			(is-eq maker tx-sender)
			(and (is-eq (len signature) u0) (contract-call? .stxdx-registry get-order-approval maker hash))
			(is-eq (secp256k1-recover? (sha256 (concat structured-data-prefix (concat message-domain hash))) signature) (ok maker-pubkey))
		)
	)
)

(define-constant serialized-key-sender (serialize-tuple-key "sender"))
(define-constant serialized-key-sender_fee (serialize-tuple-key "sender_fee"))
(define-constant serialized-key-maker (serialize-tuple-key "maker"))
(define-constant serialized-key-maker_asset (serialize-tuple-key "maker_asset"))
(define-constant serialized-key-taker_asset (serialize-tuple-key "taker_asset"))
(define-constant serialized-key-maker_asset_data (serialize-tuple-key "maker_asset_data"))
(define-constant serialized-key-taker_asset_data (serialize-tuple-key "taker_asset_data"))
(define-constant serialized-key-maximum_fill (serialize-tuple-key "maximum_fill"))
(define-constant serialized-key-expiration_height (serialize-tuple-key "expiration_height"))
(define-constant serialized-key-extra_data (serialize-tuple-key "extra_data"))
(define-constant serialized-key-salt (serialize-tuple-key "salt"))
(define-constant serialized-order-header (concat type-id-tuple (uint32-to-buff-be u11)))

(define-read-only (hash-order
	(order
		{
		sender: uint,
		sender_fee: uint,
		maker: uint,
		maker_asset: uint,
		taker_asset: uint,
		maker_asset_data: (buff 256),
		taker_asset_data: (buff 256),
		maximum_fill: uint,
		expiration_height: uint,
		extra_data: (buff 256),
		salt: uint
		}
	)
	)
	(sha256
		(concat serialized-order-header

		(concat serialized-key-expiration_height
		(concat (serialize-uint (get expiration_height order))

		(concat serialized-key-extra_data
		(concat (serialize-buff (get extra_data order))

		(concat serialized-key-maker
		(concat (serialize-uint (get maker order))

		(concat serialized-key-maker_asset
		(concat (serialize-uint (get maker_asset order))

		(concat serialized-key-maker_asset_data
		(concat (serialize-buff (get maker_asset_data order))

		(concat serialized-key-maximum_fill
		(concat (serialize-uint (get maximum_fill order))

		(concat serialized-key-salt
		(concat (serialize-uint (get salt order))

		(concat serialized-key-sender
		(concat (serialize-uint (get sender order))

		(concat serialized-key-sender_fee
		(concat (serialize-uint (get sender_fee order))
		
		(concat serialized-key-taker_asset
		(concat (serialize-uint (get taker_asset order))

		(concat serialized-key-taker_asset_data
				(serialize-buff (get taker_asset_data order))		

		))))))))))))))))))))))
	)
)

(define-read-only (validate-match
	(left-order
		{
		sender: uint,
		sender_fee: uint,
		maker: uint,
		maker_asset: uint,
		taker_asset: uint,
		maker_asset_data: (buff 256),
		taker_asset_data: (buff 256),
		maximum_fill: uint,
		expiration_height: uint,
		extra_data: (buff 256),
		salt: uint
		}
	)
	(right-order
		{
		sender: uint,
		sender_fee: uint,
		maker: uint,
		maker_asset: uint,
		taker_asset: uint,
		maker_asset_data: (buff 256),
		taker_asset_data: (buff 256),
		maximum_fill: uint,
		expiration_height: uint,
		extra_data: (buff 256),
		salt: uint
		}
	)
	(left-signature (buff 65))
	(right-signature (buff 65))
	(fill (optional uint))
	)
	(let
		(
			(users (try! (contract-call? .stxdx-registry get-two-users-from-id-or-fail (get maker left-order) (get maker right-order))))
			(left-user (get user-1 users))
			(right-user (get user-2 users))
			(left-order-hash (hash-order left-order))
			(right-order-hash (hash-order right-order))
			(order-fills (contract-call? .stxdx-registry get-two-order-fills left-order-hash right-order-hash))
			(left-order-fill (get order-1 order-fills))
			(right-order-fill (get order-2 order-fills))
			(fillable (min (- (get maximum_fill left-order) left-order-fill) (- (get maximum_fill right-order) right-order-fill)))
		)
		(try! (is-authorised-sender))		
		(asserts! (is-eq (get maker_asset left-order) (get taker_asset right-order)) err-maker_asset-mismatch)
		(asserts! (is-eq (get taker_asset left-order) (get maker_asset right-order)) err-taker_asset-mismatch)
		(asserts! (is-eq (get maker_asset_data left-order) (get taker_asset_data right-order)) err-maker_asset_data-mismatch)
		(asserts! (is-eq (get taker_asset_data left-order) (get maker_asset_data right-order)) err-taker_asset_data-mismatch)
		(asserts! (< block-height (get expiration_height left-order)) err-left-order-expired)
		(asserts! (< block-height (get expiration_height right-order)) err-right-order-expired)
		(match fill
			value
			(asserts! (>= fillable value) err-maximum_fill-reached)
			(asserts! (> fillable u0) err-maximum_fill-reached)
		)			
		(asserts! (validate-authorisation left-order-fill (get maker left-user) (get maker-pubkey left-user) left-order-hash left-signature) err-left-authorisation-failed)
		(asserts! (validate-authorisation right-order-fill (get maker right-user) (get maker-pubkey right-user) right-order-hash right-signature) err-right-authorisation-failed)
		(ok
			{
			left-order-hash: left-order-hash,
			right-order-hash: right-order-hash,
			left-order-fill: left-order-fill,
			right-order-fill: right-order-fill,
			fillable: fillable
			}
		)
	)
)

(define-public (approve-order
	(order
		{
		sender: uint,
		sender_fee: uint,
		maker: uint,
		maker_asset: uint,
		taker_asset: uint,
		maker_asset_data: (buff 256),
		taker_asset_data: (buff 256),
		maximum_fill: uint,
		expiration_height: uint,
		extra_data: (buff 256),
		salt: uint
		}
	)
	)
	(begin
		(asserts! (is-eq (try! (contract-call? .stxdx-registry user-maker-from-id-or-fail (get maker order))) tx-sender) err-maker-not-tx-sender)
		(contract-call? .stxdx-registry set-order-approval (hash-order order))
	)
)

(define-private (asset_data-to-uint (asset_data (buff 256)))
	(match (as-max-len? asset_data u16) bytes (ok (contract-call? .stxdx-utils buff-to-uint bytes)) err-asset_data-too-long)
)

(define-private (settle-order
	(order
		{
		sender: uint,
		sender_fee: uint,
		maker: uint,
		maker_asset: uint,
		taker_asset: uint,
		maker_asset_data: (buff 256),
		taker_asset_data: (buff 256),
		maximum_fill: uint,
		expiration_height: uint,
		extra_data: (buff 256),
		salt: uint
		}
	)
	(amount uint)
	(taker uint)
	)
	(begin
		(as-contract (unwrap! (contract-call? .stxdx-wallet-zero transfer amount (get maker order) taker (get maker_asset order)) err-asset-contract-call-failed))
		(and
			(> (get sender_fee order) u0)
			(as-contract (unwrap! (contract-call? .stxdx-wallet-zero transfer (get sender_fee order) (get maker order) (get sender order) u1) err-sender_fee-payment-failed))
		)
		(ok true)
	)
)

(define-public (match-orders
	(left-order
		{
		sender: uint,
		sender_fee: uint,
		maker: uint,
		maker_asset: uint,
		taker_asset: uint,
		maker_asset_data: (buff 256),
		taker_asset_data: (buff 256),
		maximum_fill: uint,
		expiration_height: uint,
		extra_data: (buff 256),
		salt: uint
		}
	)
	(right-order
		{
		sender: uint,
		sender_fee: uint,
		maker: uint,
		maker_asset: uint,
		taker_asset: uint,
		maker_asset_data: (buff 256),
		taker_asset_data: (buff 256),
		maximum_fill: uint,
		expiration_height: uint,
		extra_data: (buff 256),
		salt: uint
		}
	)
	(left-signature (buff 65))
	(right-signature (buff 65))
	(fill (optional uint))
	)
	(let
		(
			(validation-data (try! (validate-match left-order right-order left-signature right-signature fill)))
			(fillable (match fill value value (get fillable validation-data)))
		)
		(try! (settle-order left-order (* fillable (try! (asset_data-to-uint (get maker_asset_data left-order)))) (get maker right-order)))
		(try! (settle-order right-order (* fillable (try! (asset_data-to-uint (get maker_asset_data right-order)))) (get maker left-order)))
		(try! (contract-call? .stxdx-registry set-two-order-fills (get left-order-hash validation-data) (+ (get left-order-fill validation-data) fillable) (get right-order-hash validation-data) (+ (get right-order-fill validation-data) fillable)))
		(ok fillable)
	)
)

(define-private (min (a uint) (b uint))
	(if (< a b) a b)
)

;; Everything below this point can be removed to optimise later.

(define-read-only (serialize-tuple-key (key (string-ascii 128)))
	(concat
		(unwrap-panic (element-at byte-list (len key)))
		(string-ascii-to-buff key)
	)
)

(define-read-only (serialize-uint (value uint))
	(concat type-id-uint (uint128-to-buff-be value))
)

(define-read-only (serialize-buff (value (buff 256)))
	(concat
		type-id-buff
	(concat
		(uint32-to-buff-be (len value))
		value
	))
)

(define-read-only (byte-to-uint (byte (buff 1)))
	(unwrap-panic (index-of byte-list byte))
)

(define-read-only (uint-to-byte (n uint))
	(unwrap-panic (element-at byte-list (mod n u255)))
)

(define-private (uint-to-buff-iter (b (buff 1)) (p {n: uint, l: uint, a: (buff 16)}))
	{
		a: (if (< (len (get a p)) (get l p))
			(unwrap-panic (as-max-len? (concat (if (is-eq (get n p) u0) 0x00 (unwrap-panic (element-at byte-list (mod (get n p) u256)))) (get a p)) u16))
			(get a p)
		),
		l: (get l p),
		n: (/ (get n p) u256)
	}
)

(define-private (extract-digit (n uint) (digit uint))
	(mod (/ n (pow u10 digit)) u10)
)

(define-read-only (uint128-to-buff-be (n uint))
	(unwrap-panic (as-max-len? (get a (fold uint-to-buff-iter 0x00000000000000000000000000000000 {n: n, l: u16, a: 0x})) u16))
)

(define-read-only (uint32-to-buff-be (n uint))
	(unwrap-panic (as-max-len? (get a (fold uint-to-buff-iter 0x0000000000 {n: n, l: u4, a: 0x})) u4))
)

(define-private (string-ascii-to-buff-iter (c (string-ascii 1)) (a (buff 128)))
	(unwrap-panic (as-max-len? (concat a (unwrap-panic (element-at byte-list (unwrap-panic (index-of ascii-list c))))) u128))
)

(define-read-only (string-ascii-to-buff (str (string-ascii 128)))
	(fold string-ascii-to-buff-iter str 0x)
)

(define-constant type-id-uint 0x01)
(define-constant type-id-buff 0x02)
(define-constant type-id-none 0x09)
(define-constant type-id-some 0x0a)
(define-constant type-id-tuple 0x0c)
(define-constant byte-list 0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff)
(define-constant ascii-list "//////////////////////////////// !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////")


;; (register-asset .age000-governance-token)