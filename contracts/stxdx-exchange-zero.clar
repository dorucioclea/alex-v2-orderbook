(impl-trait .trait-ownable.ownable-trait)

;; 3000-3999: core errors
(define-constant err-unauthorised-sender (err u3000))
(define-constant err-maker-asset-mismatch (err u3001))
(define-constant err-taker-asset-mismatch (err u3002))
(define-constant err-asset-data-mismatch (err u3003))
(define-constant err-left-order-expired (err u3005))
(define-constant err-right-order-expired (err u3006))
(define-constant err-left-authorisation-failed (err u3007))
(define-constant err-right-authorisation-failed (err u3008))
(define-constant err-maximum-fill-reached (err u3009))
(define-constant err-maker-not-tx-sender (err u3010))

;; 4000-4999: registry errors
(define-constant err-unauthorised-caller (err u4000))

;; 5000-5999: exchange errors
(define-constant err-asset-data-too-long (err u5003))
(define-constant err-sender-fee-payment-failed (err u5007))
(define-constant err-asset-contract-call-failed (err u5008))

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
(define-constant serialized-key-sender-fee (serialize-tuple-key "sender-fee"))
(define-constant serialized-key-maker (serialize-tuple-key "maker"))
(define-constant serialized-key-maker-asset (serialize-tuple-key "maker-asset"))
(define-constant serialized-key-taker-asset (serialize-tuple-key "taker-asset"))
(define-constant serialized-key-maker-asset-data (serialize-tuple-key "maker-asset-data"))
(define-constant serialized-key-taker-asset-data (serialize-tuple-key "taker-asset-data"))
(define-constant serialized-key-maximum-fill (serialize-tuple-key "maximum-fill"))
(define-constant serialized-key-expiration-height (serialize-tuple-key "expiration-height"))
(define-constant serialized-key-extra-data (serialize-tuple-key "extra-data"))
(define-constant serialized-key-salt (serialize-tuple-key "salt"))
(define-constant serialized-order-header (concat type-id-tuple (uint32-to-buff-be u11)))

(define-read-only (hash-order
	(order
		{
		sender: uint,
		sender-fee: uint,
		maker: uint,
		maker-asset: uint,
		taker-asset: uint,
		maker-asset-data: (buff 256),
		taker-asset-data: (buff 256),
		maximum-fill: uint,
		expiration-height: uint,
		extra-data: (buff 256),
		salt: uint
		}
	)
	)
	(sha256
		(concat serialized-order-header

		(concat serialized-key-expiration-height
		(concat (serialize-uint (get expiration-height order))

		(concat serialized-key-extra-data
		(concat (serialize-buff (get extra-data order))

		(concat serialized-key-maker
		(concat (serialize-uint (get maker order))

		(concat serialized-key-maker-asset
		(concat (serialize-uint (get maker-asset order))

		(concat serialized-key-maker-asset-data
		(concat (serialize-buff (get maker-asset-data order))

		(concat serialized-key-maximum-fill
		(concat (serialize-uint (get maximum-fill order))

		(concat serialized-key-salt
		(concat (serialize-uint (get salt order))

		(concat serialized-key-sender
		(concat (serialize-uint (get sender order))

		(concat serialized-key-sender-fee
		(concat (serialize-uint (get sender-fee order))
		
		(concat serialized-key-taker-asset
		(concat (serialize-uint (get taker-asset order))

		(concat serialized-key-taker-asset-data
				(serialize-buff (get taker-asset-data order))		

		))))))))))))))))))))))
	)
)

(define-read-only (validate-match
	(left-order
		{
		sender: uint,
		sender-fee: uint,
		maker: uint,
		maker-asset: uint,
		taker-asset: uint,
		maker-asset-data: (buff 256),
		taker-asset-data: (buff 256),
		maximum-fill: uint,
		expiration-height: uint,
		extra-data: (buff 256),
		salt: uint
		}
	)
	(right-order
		{
		sender: uint,
		sender-fee: uint,
		maker: uint,
		maker-asset: uint,
		taker-asset: uint,
		maker-asset-data: (buff 256),
		taker-asset-data: (buff 256),
		maximum-fill: uint,
		expiration-height: uint,
		extra-data: (buff 256),
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
			(fillable (min (- (get maximum-fill left-order) left-order-fill) (- (get maximum-fill right-order) right-order-fill)))
			(left-maker-asset-amount (try! (asset-data-to-uint (get maker-asset-data left-order))))
			(left-taker-asset-amount (try! (asset-data-to-uint (get taker-asset-data left-order))))
			(right-maker-asset-amount (try! (asset-data-to-uint (get maker-asset-data right-order))))
			(right-taker-asset-amount (try! (asset-data-to-uint (get taker-asset-data right-order))))
		)
		(try! (is-authorised-sender))		
		(asserts! (is-eq (get maker-asset left-order) (get taker-asset right-order)) err-maker-asset-mismatch)
		(asserts! (is-eq (get taker-asset left-order) (get maker-asset right-order)) err-taker-asset-mismatch)
		;; one side matches and the taker of the other side is smaller than maker.
		;; so that maker gives at most maker-asset-data, and taker takes at least taker-asset-data
		(asserts! 
			(or 				
				(and ;; taker (right-order) is a buyer
					(is-eq left-maker-asset-amount right-taker-asset-amount)
					(<= left-taker-asset-amount right-maker-asset-amount)
			 	)
				(and ;; taker (right-order) is a seller
					(is-eq left-taker-asset-amount right-maker-asset-amount)
					(>= left-maker-asset-amount right-taker-asset-amount)
				) 
			)
			err-asset-data-mismatch
		)
		(asserts! (< block-height (get expiration-height left-order)) err-left-order-expired)
		(asserts! (< block-height (get expiration-height right-order)) err-right-order-expired)
		(match fill
			value
			(asserts! (>= fillable value) err-maximum-fill-reached)
			(asserts! (> fillable u0) err-maximum-fill-reached)
		)			
		(asserts! (validate-authorisation left-order-fill (get maker left-user) (get maker-pubkey left-user) left-order-hash left-signature) err-left-authorisation-failed)
		(asserts! (validate-authorisation right-order-fill (get maker right-user) (get maker-pubkey right-user) right-order-hash right-signature) err-right-authorisation-failed)
		(ok
			{
			left-order-hash: left-order-hash,
			right-order-hash: right-order-hash,
			left-order-fill: left-order-fill,
			right-order-fill: right-order-fill,
			fillable: fillable,
			maker-matched: left-maker-asset-amount,
			taker-matched: left-taker-asset-amount
			}
		)
	)
)

(define-public (approve-order
	(order
		{
		sender: uint,
		sender-fee: uint,
		maker: uint,
		maker-asset: uint,
		taker-asset: uint,
		maker-asset-data: (buff 256),
		taker-asset-data: (buff 256),
		maximum-fill: uint,
		expiration-height: uint,
		extra-data: (buff 256),
		salt: uint
		}
	)
	)
	(begin
		(asserts! (is-eq (try! (contract-call? .stxdx-registry user-maker-from-id-or-fail (get maker order))) tx-sender) err-maker-not-tx-sender)
		(contract-call? .stxdx-registry set-order-approval (hash-order order))
	)
)

(define-private (asset-data-to-uint (asset-data (buff 256)))
	(match (as-max-len? asset-data u16) bytes (ok (contract-call? .stxdx-utils buff-to-uint bytes)) err-asset-data-too-long)
)

(define-private (settle-order
	(order
		{
		sender: uint,
		sender-fee: uint,
		maker: uint,
		maker-asset: uint,
		taker-asset: uint,
		maker-asset-data: (buff 256),
		taker-asset-data: (buff 256),
		maximum-fill: uint,
		expiration-height: uint,
		extra-data: (buff 256),
		salt: uint
		}
	)
	(amount uint)
	(taker uint)
	)
	(begin
		(as-contract (unwrap! (contract-call? .stxdx-wallet-zero transfer amount (get maker order) taker (get maker-asset order)) err-asset-contract-call-failed))
		(and
			(> (get sender-fee order) u0)
			(as-contract (unwrap! (contract-call? .stxdx-wallet-zero transfer (get sender-fee order) (get maker order) (get sender order) u1) err-sender-fee-payment-failed))
		)
		(ok true)
	)
)

(define-public (match-orders
	(left-order
		{
		sender: uint,
		sender-fee: uint,
		maker: uint,
		maker-asset: uint,
		taker-asset: uint,
		maker-asset-data: (buff 256),
		taker-asset-data: (buff 256),
		maximum-fill: uint,
		expiration-height: uint,
		extra-data: (buff 256),
		salt: uint
		}
	)
	(right-order
		{
		sender: uint,
		sender-fee: uint,
		maker: uint,
		maker-asset: uint,
		taker-asset: uint,
		maker-asset-data: (buff 256),
		taker-asset-data: (buff 256),
		maximum-fill: uint,
		expiration-height: uint,
		extra-data: (buff 256),
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
			(maker-matched (get maker-matched validation-data))
			(taker-matched (get taker-matched validation-data))
		)
		(try! (settle-order left-order (* fillable maker-matched) (get maker right-order)))
		(try! (settle-order right-order (* fillable taker-matched) (get maker left-order)))
		(try! (contract-call? .stxdx-registry set-two-order-fills (get left-order-hash validation-data) (+ (get left-order-fill validation-data) fillable) (get right-order-hash validation-data) (+ (get right-order-fill validation-data) fillable)))
		(ok { fillable: fillable, left-order-make: maker-matched, right-order-make: taker-matched })
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

(define-read-only (uint128-to-buff-be (n uint))
	(concat (unwrap-panic (element-at byte-list (mod (/ n u1329227995784915872903807060280344576) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u5192296858534827628530496329220096) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u20282409603651670423947251286016) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u79228162514264337593543950336) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u309485009821345068724781056) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u1208925819614629174706176) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u4722366482869645213696) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u18446744073709551616) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u72057594037927936) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u281474976710656) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u1099511627776) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u4294967296) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u16777216) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u65536) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u256) u256)))
            (unwrap-panic (element-at byte-list (mod n u256)))
    )))))))))))))))
)

(define-read-only (uint32-to-buff-be (n uint))
	(concat (unwrap-panic (element-at byte-list (mod (/ n u16777216) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u65536) u256)))
    (concat (unwrap-panic (element-at byte-list (mod (/ n u256) u256)))
            (unwrap-panic (element-at byte-list (mod n u256))
    ))))
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
