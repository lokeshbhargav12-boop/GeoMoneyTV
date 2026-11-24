#!/usr/bin/env python3
"""Objective sanity check for screenshots: decodes PNGs with pure stdlib and
reports size, mean brightness and percentage of lit pixels. Catches the
black-paint rendering quirk without needing PIL."""
import struct, zlib, sys, os, glob

def read_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a png'
    pos = 8
    width = height = bit = color = None
    idat = b''
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        ctype = data[pos+4:pos+8]
        chunk = data[pos+8:pos+8+length]
        if ctype == b'IHDR':
            width, height, bit, color = struct.unpack('>IIBB', chunk[:10])
        elif ctype == b'IDAT':
            idat += chunk
        elif ctype == b'IEND':
            break
        pos += 12 + length
    raw = zlib.decompress(idat)
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[color]
    if bit != 8:
        return width, height, None, None  # unsupported depth
    bpp = channels
    stride = width * bpp
    prev = bytearray(stride)
    out_rows = []
    pos = 0
    for y in range(height):
        ftype = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos+stride]); pos += stride
        if ftype == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i-bpp]) & 0xFF
        elif ftype == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ftype == 3:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif ftype == 4:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                b = prev[i]
                c = prev[i-bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        out_rows.append(bytes(line))
        prev = line
    return width, height, out_rows, channels

def stats(path):
    w, h, rows, ch = read_png(path)
    if rows is None:
        return w, h, None, None
    step_y = max(1, h // 80)
    n = 0; tot = 0; lit = 0
    for y in range(0, h, step_y):
        row = rows[y]
        step_x = max(1, w // 120)
        for x in range(0, w, step_x):
            j = x * ch
            r, g, b = row[j], row[j+1] if ch >= 3 else row[j], row[j+2] if ch >= 3 else row[j]
            v = (r + g + b) / 3.0
            tot += v; n += 1
            if v > 12: lit += 1
    return w, h, tot / n, 100.0 * lit / n

if __name__ == '__main__':
    paths = sys.argv[1:] or sorted(glob.glob(os.path.join(os.path.dirname(__file__), '*.png')))
    for p in paths:
        try:
            w, h, mean, lit = stats(p)
            mean_s = '%.1f' % mean if mean is not None else 'n/a'
            lit_s = '%.0f%%' % lit if lit is not None else 'n/a'
            print(f'{os.path.basename(p):45s} {w}x{h:<5} mean {mean_s:>6}  lit {lit_s:>4}')
        except Exception as e:
            print(f'{os.path.basename(p):45s} ERROR: {e}')
