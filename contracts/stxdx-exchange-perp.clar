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

(define-constant err-to-be-defined (err u99999))

(define-constant structured-data-prefix 0x534950303138)

(define-data-var contract-owner principal tx-sender)
(define-map authorised-senders principal bool)

(define-map positions 
	(buff 32)
	{
		maker: uint, 
		maker-asset: uint, 
		taker-asset: uint, 
		maker-asset-data: (buff 256), 
		taker-asset-data: (buff 256),
		child-order-hash: (buff 32)
	}
)

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

(define-read-only (hash-order (order { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint }))
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
			parent: { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint },
			child: (optional { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint })
		}			
	)
	(right-order
		{
			parent: { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint },
			child: (optional { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint })
		}
	)
	(left-signature (buff 65))
	(right-signature (buff 65))
	(fill (optional uint))
	)
	(let
		(		
			(left-parent (get parent left-order))
			(right-parent (get parent right-order))
			(users (try! (contract-call? .stxdx-registry get-two-users-from-id-or-fail (get maker left-parent) (get maker right-parent))))
			(left-user (get user-1 users))
			(right-user (get user-2 users))
			(left-order-hash (hash-order left-parent))
			(right-order-hash (hash-order right-parent))
			(order-fills (contract-call? .stxdx-registry get-two-order-fills left-order-hash right-order-hash))
			(left-order-fill (get order-1 order-fills))
			(right-order-fill (get order-2 order-fills))
			(fillable (min (- (get maximum-fill left-parent) left-order-fill) (- (get maximum-fill right-parent) right-order-fill)))
			(left-maker-asset-amount (try! (asset-data-to-uint (get maker-asset-data left-parent))))
			(left-taker-asset-amount (try! (asset-data-to-uint (get taker-asset-data left-parent))))
			(right-maker-asset-amount (try! (asset-data-to-uint (get maker-asset-data right-parent))))
			(right-taker-asset-amount (try! (asset-data-to-uint (get taker-asset-data right-parent))))
			(left-extra-data (try! (extra-data-to-tuple (get extra-data left-order))))
			(right-extra-data (try! (extra-data-to-tuple (get extra-data right-order))))			
		)
		(try! (is-authorised-sender))				
		(asserts! (is-eq (get maker-asset left-parent) (get taker-asset right-parent)) err-maker-asset-mismatch)
		(asserts! (is-eq (get taker-asset left-parent) (get maker-asset right-parent)) err-taker-asset-mismatch)
		
		(match (get child left-order)
			left-child 
			(begin 
				;; validate parent-child data
				(asserts! (is-eq (get maker left-parent) (get maker left-child)) err-to-be-defined)
				(asserts! (is-eq (get maker-asset left-parent) (get taker-asset left-child)) err-to-be-defined)
				(asserts! (is-eq (get taker-asset left-parent) (get maker-asset left-child)) err-to-be-defined)
				(asserts! (is-eq (get maximum-fill left-parent) (get maximum-fill left-child)) err-to-be-defined)
				(asserts! (is-eq (get expiration-height left-child) u340282366920938463463374607431768211455) err-to-be-defined)
				(asserts! (is-eq (hash-order left-child) (unwrap-panic (as-max-len? (get extra-data left-parent) u32))) err-to-be-defined)
				;; validate parent FOK
				;; NOTE to backend: parent order has to be FOK, because 
				;; maximum-fill of child order has to be fixed (and the order hashed) when parent order is submitted, and
				;; we cannot retrieve the original order tuple from the hashed child order to update its maximum-fill				
				(asserts! (is-eq left-order-fill u0) err-to-be-defined)
				(asserts! (is-eq fillable (get maximum-fill left-parent)) err-to-be-defined)
			)
			(asserts! true err-to-be-defined)
		)
		(match (get child right-order)
			right-child	
			(begin		
				;; validate parent-child data
				(asserts! (is-eq (get maker right-parent) (get maker right-child)) err-to-be-defined)		
				(asserts! (is-eq (get maker-asset right-parent) (get taker-asset right-child)) err-to-be-defined)		
				(asserts! (is-eq (get taker-asset right-parent) (get maker-asset right-child)) err-to-be-defined)		
				(asserts! (is-eq (get maximum-fill right-parent) (get maximum-fill right-child)) err-to-be-defined)		
				(asserts! (is-eq (get expiration-height right-child) u340282366920938463463374607431768211455) err-to-be-defined)		
				(asserts! (is-eq (hash-order right-child) (unwrap-panic (as-max-len? (get extra-data right-parent) u32))) err-to-be-defined)
				;; validate parent FOK
				;; NOTE to backend: parent order has to be FOK, because 
				;; maximum-fill of child order has to be fixed (and the order hashed) when parent order is submitted, and
				;; we cannot retrieve the original order tuple from the hashed child order to update its maximum-fill
				(asserts! (is-eq right-order-fill u0) err-to-be-defined)
				(asserts! (is-eq fillable (get maximum-fill right-parent)) err-to-be-defined)
			)
			(asserts! true err-to-be-defined)
		)
		
		;; one side matches and the taker of the other side is smaller than maker.
		;; so that maker gives at most maker-asset-data, and taker takes at least taker-asset-data
		(asserts! 
			(or 
				(and (is-eq left-maker-asset-amount right-taker-asset-amount) (<= left-taker-asset-amount right-maker-asset-amount))
				(and (is-eq left-taker-asset-amount right-maker-asset-amount) (>= left-maker-asset-amount right-taker-asset-amount)) 
			)
			err-asset-data-mismatch
		)
		(asserts! (< block-height (get expiration-height left-parent)) err-left-order-expired)
		(asserts! (< block-height (get expiration-height right-parent)) err-right-order-expired)
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
			left-order-make: left-order-make,
			right-order-make: right-order-make
			}
		)
	)
)

(define-public (approve-order (order { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint }))
	(begin
		(asserts! (is-eq (try! (contract-call? .stxdx-registry user-maker-from-id-or-fail (get maker order))) tx-sender) err-maker-not-tx-sender)
		(contract-call? .stxdx-registry set-order-approval (hash-order order) true)
	)
)

(define-private (asset-data-to-uint (asset-data (buff 256)))
	(match (as-max-len? asset-data u16) bytes (ok (contract-call? .stxdx-utils buff-to-uint bytes)) err-asset-data-too-long)
)

(define-private (settle-to-exchange 
	(order { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint })
	(amount uint)	
	)
	(let 
		(
			(exchange-uid (as-contract (try! (contract-call? .stxdx-registry get-user-id-or-fail tx-sender))))
		)
		(as-contract (unwrap! (contract-call? .stxdx-wallet-zero transfer amount (get maker order) exchange-uid (get maker-asset order)) err-asset-contract-call-failed))
		(and
			(> (get sender-fee order) u0)
			(as-contract (unwrap! (contract-call? .stxdx-wallet-zero transfer (get sender-fee order) (get maker order) (get sender order) u1) err-sender-fee-payment-failed))
		)
		(ok true)
	)
)

(define-private (settle-from-exchange 
	(order { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint })
	(amount uint)	
	)
	(let 
		(
			(exchange-uid (as-contract (try! (contract-call? .stxdx-registry get-user-id-or-fail tx-sender))))
		)
		(as-contract (unwrap! (contract-call? .stxdx-wallet-zero transfer amount exchange-uid (get maker order) (get taker-asset order)) err-asset-contract-call-failed))
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
			parent: { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint },
			child: (optional { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint })
		}			
	)
	(right-order
		{
			parent: { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint },
			child: (optional { sender: uint, sender-fee: uint, maker: uint, maker-asset: uint, taker-asset: uint, maker-asset-data: (buff 256), taker-asset-data: (buff 256), maximum-fill: uint, expiration-height: uint, extra-data: (buff 256), salt: uint })
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
			(left-parent-make (get left-order-make validation-data))
			(right-parent-make (get right-order-make validation-data))
		)		

		(match (get child left-order)
			left-child
			(let 
				;; if child order exists, then it is to add position
				;; extra-data of parent contains the hash of child, for validation
			 	(
					(parent-order (get parent left-order))
					(child-hash (unwrap-panic (as-max-len? (get extra-data parent-order) u32)))
				)
				(try! (as-contract (contract-call? .stxdx-registry set-order-approval-on-behalf (get maker parent-order) child-hash true)))
				;; TODO: can a duplicate enter the map?
				(map-set 
					positions
					(get left-order-hash validation-data) 
					{ 
						maker: (get maker parent-order), 
						maker-asset: (get maker-asset parent-order),
						taker-asset: (get taker-asset parent-order),
						maker-asset-data: (serialize-uint left-parent-make), 
						taker-asset-data: (get taker-asset-data parent-order),
						child-order-hash: child-hash 
					}
				)
				(try! (settle-to-exchange parent-order (* fillable (- left-parent-make (try! (asset-data-to-uint (get taker-asset-data left-child)))))))
			)
			(let 
				;; if child order does not exist, then it is to reduce position
				;; extra-data of parent contains the hash of the initiating order, so we can settle against that.
				;; TODO: or it chould be child order being executed (i.e. liquidation)
				(
					(parent-order (get parent left-order))
					(target-order-hash (unwrap-panic (as-max-len? (get extra-data parent-order) u32)))
					(target-order (unwrap! (map-get? positions target-order-hash) err-to-be-defined))
				)
				(asserts! (is-eq (get maker parent-order) (get maker target-order)) err-to-be-defined)
				(asserts! (is-eq (get maker-asset parent-order) (get taker-asset target-order)) err-to-be-defined)
				(asserts! (is-eq (get taker-asset parent-order) (get maker-asset target-order)) err-to-be-defined)
				;; numeraire must be the same
				(asserts! (is-eq (get maker-asset-data parent-order) (get taker-asset-data target-order)) err-to-be-defined)
				
				(try! (as-contract (contract-call? .stxdx-registry set-order-approval-on-behalf (get maker parent-order) (get child-order-hash target-order) false)))
				(map-delete positions target-order-hash)
				(try! (settle-from-exchange parent-order (* fillable (- right-parent-make (try! (asset-data-to-uint (get maker-asset-data target-order)))))))
			)
		)	

		(match (get child right-order)
			right-child
			(let 
				;; if child order exists, then it is to add position
				;; extra-data of parent contains the hash of child, for validation
				;; TODO: or it chould be child order being executed (i.e. liquidation)
			 	(
					(parent-order (get parent right-order))
					(child-hash (unwrap-panic (as-max-len? (get extra-data parent-order) u32)))
				)
				(try! (as-contract (contract-call? .stxdx-registry set-order-approval-on-behalf (get maker parent-order) child-hash true)))
				;; TODO: can a duplicate enter the map?
				(map-set 
					positions
					(get right-order-hash validation-data) 
					{ 
						maker: (get maker parent-order), 
						maker-asset: (get maker-asset parent-order),
						taker-asset: (get taker-asset parent-order),
						maker-asset-data: (serialize-uint right-parent-make), 
						taker-asset-data: (get taker-asset-data parent-order),
						child-order-hash: child-hash 
					}
				)
				(try! (settle-to-exchange parent-order (* fillable (- right-parent-make (try! (asset-data-to-uint (get taker-asset-data right-child)))))))
			)
			(let 
				;; if child order does not exist, then it is to reduce position
				;; extra-data of parent contains the hash of the initiating order, so we can settle against that.
				(
					(parent-order (get parent right-order))
					(target-order-hash (unwrap-panic (as-max-len? (get extra-data parent-order) u32)))
					(target-order (unwrap! (map-get? positions target-order-hash) err-to-be-defined))
				)
				(asserts! (is-eq (get maker parent-order) (get maker target-order)) err-to-be-defined)
				(asserts! (is-eq (get maker-asset parent-order) (get taker-asset target-order)) err-to-be-defined)
				(asserts! (is-eq (get taker-asset parent-order) (get maker-asset target-order)) err-to-be-defined)
				;; numeraire must be the same
				(asserts! (is-eq (get maker-asset-data parent-order) (get taker-asset-data target-order)) err-to-be-defined)
				
				(try! (as-contract (contract-call? .stxdx-registry set-order-approval-on-behalf (get maker parent-order) (get child-order-hash target-order) false)))
				(map-delete positions target-order-hash)
				(try! (settle-from-exchange parent-order (* fillable (- left-parent-make (try! (asset-data-to-uint (get maker-asset-data target-order)))))))
			)
		)				

		(try! (contract-call? .stxdx-registry set-two-order-fills (get left-order-hash validation-data) (+ (get left-order-fill validation-data) fillable) (get right-order-hash validation-data) (+ (get right-order-fill validation-data) fillable)))				
		(ok { fillable: fillable, left-order-make: left-parent-make, right-order-make: right-parent-make })
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


;; Exports a tuple of the following type (size in bracket):
;; {
;; hash (4): (buff 32)
;; risk (4): bool (1),
;; stop (4): uint (16)
;; time (4): uint (16),
;; type (4): uint (16),
;; }
(define-read-only (extra-data-to-tuple (extra-data (buff 256)))
    (begin  
        ;; key 'hash'
        (asserts! (is-eq (element-at extra-data u0) (some 0x04)) err-invalid-extra-data-type)
        (asserts! (is-eq (element-at extra-data u1) (some (string-ascii-to-byte "h"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u2) (some (string-ascii-to-byte "a"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u3) (some (string-ascii-to-byte "s"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u4) (some (string-ascii-to-byte "h"))) err-invalid-extra-data-key)
        ;; value (buff 32)
        (asserts! (is-eq (element-at extra-data u5) (some type-id-buff)) err-invalid-extra-data-type)

        ;; key 'risk'
        (asserts! (is-eq (element-at extra-data u37) (some 0x04)) err-invalid-extra-data-type)
        (asserts! (is-eq (element-at extra-data u38) (some (string-ascii-to-byte "r"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u39) (some (string-ascii-to-byte "i"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u40) (some (string-ascii-to-byte "s"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u41) (some (string-ascii-to-byte "k"))) err-invalid-extra-data-key)
        ;; value true/false => mapped below directly    

        ;; key 'stop'
        (asserts! (is-eq (element-at extra-data u43) (some 0x04)) err-invalid-extra-data-type)
        (asserts! (is-eq (element-at extra-data u44) (some (string-ascii-to-byte "s"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u45) (some (string-ascii-to-byte "t"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u46) (some (string-ascii-to-byte "o"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u47) (some (string-ascii-to-byte "p"))) err-invalid-extra-data-key)
        ;; value uint
        (asserts! (is-eq (element-at extra-data u48) (some type-id-uint)) err-invalid-extra-data-type)              

        ;; key 'time'
        (asserts! (is-eq (element-at extra-data u65) (some 0x04)) err-invalid-extra-data-type)
        (asserts! (is-eq (element-at extra-data u66) (some (string-ascii-to-byte "t"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u67) (some (string-ascii-to-byte "i"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u68) (some (string-ascii-to-byte "m"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u69) (some (string-ascii-to-byte "e"))) err-invalid-extra-data-key)
        ;; value uint
        (asserts! (is-eq (element-at extra-data u70) (some type-id-uint)) err-invalid-extra-data-type)

        ;; key 'type'
        (asserts! (is-eq (element-at extra-data u87) (some 0x04)) err-invalid-extra-data-type)
        (asserts! (is-eq (element-at extra-data u88) (some (string-ascii-to-byte "t"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u89) (some (string-ascii-to-byte "y"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u90) (some (string-ascii-to-byte "p"))) err-invalid-extra-data-key)
        (asserts! (is-eq (element-at extra-data u91) (some (string-ascii-to-byte "e"))) err-invalid-extra-data-key)
        ;; value uint
        (asserts! (is-eq (element-at extra-data u92) (some type-id-uint)) err-invalid-extra-data-type)
        

        (ok {
            hash:
                (concat
                    (unwrap! (element-at extra-data u5) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u6) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u7) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u8) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u9) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u10) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u11) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u12) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u13) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u14) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u15) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u16) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u17) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u18) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u19) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u20) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u21) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u22) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u23) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u24) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u25) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u26) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u27) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u28) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u29) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u30) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u31) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u32) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u33) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u34) err-invalid-extra-data-length)
                (concat
                    (unwrap! (element-at extra-data u35) err-invalid-extra-data-length)
                    (unwrap! (element-at extra-data u36) err-invalid-extra-data-length)
                ))))))))))))))))))))))))))))))),    
            risk: (is-eq (element-at extra-data u42) (some type-id-true)),
            stop:
                (+
                    (match (element-at extra-data u49) byte (byte-to-uint byte) u0)
                    (match (element-at extra-data u50) byte (* (byte-to-uint byte) u256) u0)
                    (match (element-at extra-data u51) byte (* (byte-to-uint byte) u65536) u0)
                    (match (element-at extra-data u52) byte (* (byte-to-uint byte) u16777216) u0)
                    (match (element-at extra-data u53) byte (* (byte-to-uint byte) u4294967296) u0)
                    (match (element-at extra-data u54) byte (* (byte-to-uint byte) u1099511627776) u0)
                    (match (element-at extra-data u55) byte (* (byte-to-uint byte) u281474976710656) u0)
                    (match (element-at extra-data u56) byte (* (byte-to-uint byte) u72057594037927936) u0)
                    (match (element-at extra-data u57) byte (* (byte-to-uint byte) u18446744073709551616) u0)
                    (match (element-at extra-data u58) byte (* (byte-to-uint byte) u4722366482869645213696) u0)
                    (match (element-at extra-data u59) byte (* (byte-to-uint byte) u1208925819614629174706176) u0)
                    (match (element-at extra-data u60) byte (* (byte-to-uint byte) u309485009821345068724781056) u0)
                    (match (element-at extra-data u61) byte (* (byte-to-uint byte) u79228162514264337593543950336) u0)
                    (match (element-at extra-data u62) byte (* (byte-to-uint byte) u20282409603651670423947251286016) u0)
                    (match (element-at extra-data u63) byte (* (byte-to-uint byte) u5192296858534827628530496329220096) u0)
                    (match (element-at extra-data u64) byte (* (byte-to-uint byte) u1329227995784915872903807060280344576) u0)
                ),                  
            time:
                (+
                    (match (element-at extra-data u71) byte (byte-to-uint byte) u0)
                    (match (element-at extra-data u72) byte (* (byte-to-uint byte) u256) u0)
                    (match (element-at extra-data u73) byte (* (byte-to-uint byte) u65536) u0)
                    (match (element-at extra-data u74) byte (* (byte-to-uint byte) u16777216) u0)
                    (match (element-at extra-data u75) byte (* (byte-to-uint byte) u4294967296) u0)
                    (match (element-at extra-data u76) byte (* (byte-to-uint byte) u1099511627776) u0)
                    (match (element-at extra-data u77) byte (* (byte-to-uint byte) u281474976710656) u0)
                    (match (element-at extra-data u78) byte (* (byte-to-uint byte) u72057594037927936) u0)
                    (match (element-at extra-data u79) byte (* (byte-to-uint byte) u18446744073709551616) u0)
                    (match (element-at extra-data u80) byte (* (byte-to-uint byte) u4722366482869645213696) u0)
                    (match (element-at extra-data u81) byte (* (byte-to-uint byte) u1208925819614629174706176) u0)
                    (match (element-at extra-data u82) byte (* (byte-to-uint byte) u309485009821345068724781056) u0)
                    (match (element-at extra-data u83) byte (* (byte-to-uint byte) u79228162514264337593543950336) u0)
                    (match (element-at extra-data u84) byte (* (byte-to-uint byte) u20282409603651670423947251286016) u0)
                    (match (element-at extra-data u85) byte (* (byte-to-uint byte) u5192296858534827628530496329220096) u0)
                    (match (element-at extra-data u86) byte (* (byte-to-uint byte) u1329227995784915872903807060280344576) u0)
                ),                      
            type:
                (+
                    (match (element-at extra-data u93) byte (byte-to-uint byte) u0)
                    (match (element-at extra-data u94) byte (* (byte-to-uint byte) u256) u0)
                    (match (element-at extra-data u95) byte (* (byte-to-uint byte) u65536) u0)
                    (match (element-at extra-data u96) byte (* (byte-to-uint byte) u16777216) u0)
                    (match (element-at extra-data u97) byte (* (byte-to-uint byte) u4294967296) u0)
                    (match (element-at extra-data u98) byte (* (byte-to-uint byte) u1099511627776) u0)
                    (match (element-at extra-data u99) byte (* (byte-to-uint byte) u281474976710656) u0)
                    (match (element-at extra-data u100) byte (* (byte-to-uint byte) u72057594037927936) u0)
                    (match (element-at extra-data u101) byte (* (byte-to-uint byte) u18446744073709551616) u0)
                    (match (element-at extra-data u102) byte (* (byte-to-uint byte) u4722366482869645213696) u0)
                    (match (element-at extra-data u103) byte (* (byte-to-uint byte) u1208925819614629174706176) u0)
                    (match (element-at extra-data u104) byte (* (byte-to-uint byte) u309485009821345068724781056) u0)
                    (match (element-at extra-data u105) byte (* (byte-to-uint byte) u79228162514264337593543950336) u0)
                    (match (element-at extra-data u106) byte (* (byte-to-uint byte) u20282409603651670423947251286016) u0)
                    (match (element-at extra-data u107) byte (* (byte-to-uint byte) u5192296858534827628530496329220096) u0)
                    (match (element-at extra-data u108) byte (* (byte-to-uint byte) u1329227995784915872903807060280344576) u0)
                ),          
            
        })
    )
)


(define-constant type-id-uint 0x01)
(define-constant type-id-buff 0x02)
(define-constant type-id-none 0x09)
(define-constant type-id-some 0x0a)
(define-constant type-id-tuple 0x0c)
(define-constant byte-list 0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff)
(define-constant ascii-list "//////////////////////////////// !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////")


;; (register-asset .age000-governance-token)
