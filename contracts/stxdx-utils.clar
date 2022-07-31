(define-constant byte-list 0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff)

(define-read-only (byte-to-uint (byte (buff 1)))
	(unwrap-panic (index-of byte-list byte))
)

(define-read-only (buff-to-uint (bytes (buff 16)))
	(+
		(match (element-at bytes u0) byte (byte-to-uint byte) u0)
		(match (element-at bytes u1) byte (* (byte-to-uint byte) u256) u0)
		(match (element-at bytes u2) byte (* (byte-to-uint byte) u65536) u0)
		(match (element-at bytes u3) byte (* (byte-to-uint byte) u16777216) u0)
		(match (element-at bytes u4) byte (* (byte-to-uint byte) u4294967296) u0)
		(match (element-at bytes u5) byte (* (byte-to-uint byte) u1099511627776) u0)
		(match (element-at bytes u6) byte (* (byte-to-uint byte) u281474976710656) u0)
		(match (element-at bytes u7) byte (* (byte-to-uint byte) u72057594037927936) u0)
		(match (element-at bytes u8) byte (* (byte-to-uint byte) u18446744073709551616) u0)
		(match (element-at bytes u9) byte (* (byte-to-uint byte) u4722366482869645213696) u0)
		(match (element-at bytes u10) byte (* (byte-to-uint byte) u1208925819614629174706176) u0)
		(match (element-at bytes u11) byte (* (byte-to-uint byte) u309485009821345068724781056) u0)
		(match (element-at bytes u12) byte (* (byte-to-uint byte) u79228162514264337593543950336) u0)
		(match (element-at bytes u13) byte (* (byte-to-uint byte) u20282409603651670423947251286016) u0)
		(match (element-at bytes u14) byte (* (byte-to-uint byte) u5192296858534827628530496329220096) u0)
		(match (element-at bytes u15) byte (* (byte-to-uint byte) u1329227995784915872903807060280344576) u0)
	)
)

(define-private (buff-slice-iterator (byte (buff 1)) (state {accumulator: (buff 256), index: uint, start: uint, end: uint}))
	(let
		(
			(start (get start state))
			(end (get end state))
			(index (get index state))
			(accumulator (get accumulator state))
		)
		{
			start: start,
			end: end,
			accumulator: (if (and (>= index start) (< index end)) (unwrap-panic (as-max-len? (concat accumulator byte) u256)) accumulator),
			index: (+ index u1)
		}
	)
)

(define-read-only (buff-slice (bytes (buff 256)) (start uint) (end uint))
	(get accumulator (fold buff-slice-iterator bytes {accumulator: 0x, index: u0, start: start, end: end}))
)
