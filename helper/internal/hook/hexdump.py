# https://github.com/r0ysue/r0capture

import binascii  # binascii is required for Python 3
import sys

# --- constants
PY3K = sys.version_info >= (3, 0)


# --- workaround against Python consistency issues
def normalize_py():
    """Problem 001 - sys.stdout in Python is by default opened in
    text mode, and writes to this stdout produce corrupted binary
    data on Windows

        python -c "import sys; sys.stdout.write('_\n_')" > file
        python -c "print(repr(open('file', 'rb').read()))"
    """
    if sys.platform == "win32":
        # set sys.stdout to binary mode on Windows
        import os
        import msvcrt

        msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)


# --- - chunking helpers
def chunks(seq, size):
    """Generator that cuts sequence (bytes, memoryview, etc.)
    into chunks of given size. If `seq` length is not multiply
    of `size`, the lengh of the last chunk returned will be
    less than requested.

    >>> list( chunks([1,2,3,4,5,6,7], 3) )
    [[1, 2, 3], [4, 5, 6], [7]]
    """
    d, m = divmod(len(seq), size)
    for i in range(d):
        yield seq[i * size : (i + 1) * size]
    if m:
        yield seq[d * size :]


def chunkread(f, size):
    """Generator that reads from file like object. May return less
    data than requested on the last read."""
    c = f.read(size)
    while len(c):
        yield c
        c = f.read(size)


def genchunks(mixed, size):
    """Generator to chunk binary sequences or file like objects.
    The size of the last chunk returned may be less than
    requested."""
    if hasattr(mixed, "read"):
        return chunkread(mixed, size)
    else:
        return chunks(mixed, size)


# --- - /chunking helpers


def dehex(hextext):
    """
    Convert from hex string to binary data stripping
    whitespaces from `hextext` if necessary.
    """
    if PY3K:
        return bytes.fromhex(hextext)
    else:
        hextext = "".join(hextext.split())
        return hextext.decode("hex")


def dump(binary, size=2, sep=" "):
    """
    Convert binary data (bytes in Python 3 and str in
    Python 2) to hex string like '00 DE AD BE EF'.
    `size` argument specifies length of text chunks
    and `sep` sets chunk separator.
    """
    hexstr = binascii.hexlify(binary)
    if PY3K:
        hexstr = hexstr.decode("ascii")
    return sep.join(chunks(hexstr.upper(), size))


def dumpgen(data, only_str):
    """
    Generator that produces strings:

    '00000000: 00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  ................'
    """
    generator = genchunks(data, 16)
    for addr, d in enumerate(generator):
        line = ""
        if not only_str:
            # 00000000:
            line = "%08X: " % (addr * 16)
            # 00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00
            dumpstr = dump(d)
            line += dumpstr[: 8 * 3]
            if len(d) > 8:  # insert separator if needed
                line += " " + dumpstr[8 * 3 :]
            # ................
            # calculate indentation, which may be different for the last line
            pad = 2
            if len(d) < 16:
                pad += 3 * (16 - len(d))
            if len(d) <= 8:
                pad += 1
            line += " " * pad

        for byte in d:
            # printable ASCII range 0x20 to 0x7E
            if not PY3K:
                byte = ord(byte)
            if 0x20 <= byte <= 0x7E:
                line += chr(byte)
            else:
                line += "."
        yield line


def hexdump(data, result="print", only_str=False):
    """
    Transform binary data to the hex dump text format:

    00000000: 00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  ................

      [x] data argument as a binary string
      [x] data argument as a file like object

    Returns result depending on the `result` argument:
      'print'     - prints line by line
      'return'    - returns single string
      'generator' - returns generator that produces lines
    """
    if PY3K and type(data) == str:
        raise TypeError("Abstract unicode data (expected bytes sequence)")

    gen = dumpgen(data, only_str=only_str)
    if result == "generator":
        return gen
    elif result == "return":
        return "\n".join(gen)
    elif result == "print":
        for line in gen:
            print(line)
    else:
        raise ValueError("Unknown value of `result` argument")


def restore(dump):
    """
    Restore binary data from a hex dump.
      [x] dump argument as a string
      [ ] dump argument as a line iterator

    Supported formats:
      [x] hexdump.hexdump
      [x] Scapy
      [x] Far Manager
    """
    minhexwidth = 2 * 16  # minimal width of the hex part - 00000... style
    bytehexwidth = 3 * 16 - 1  # min width for a bytewise dump - 00 00 ... style

    result = bytes() if PY3K else ""
    if type(dump) != str:
        raise TypeError("Invalid data for restore")

    text = dump.strip()  # ignore surrounding empty lines
    for line in text.split("\n"):
        # strip address part
        addrend = line.find(":")
        if 0 < addrend < minhexwidth:  # : is not in ascii part
            line = line[addrend + 1 :]
        line = line.lstrip()
        # check dump type
        if line[2] == " ":  # 00 00 00 ...  type of dump
            # check separator
            sepstart = (2 + 1) * 7 + 2  # ('00'+' ')*7+'00'
            sep = line[sepstart : sepstart + 3]
            if sep[:2] == "  " and sep[2:] != " ":  # ...00 00  00 00...
                hexdata = line[: bytehexwidth + 1]
            elif sep[2:] == " ":  # ...00 00 | 00 00...  - Far Manager
                hexdata = line[:sepstart] + line[sepstart + 3 : bytehexwidth + 2]
            else:  # ...00 00 00 00... - Scapy, no separator
                hexdata = line[:bytehexwidth]
            line = hexdata
        result += dehex(line)
    return result


def runtest(logfile=None):
    """Run hexdump tests. Requires hexfile.bin to be in the same
    directory as hexdump.py itself"""

    class TeeOutput(object):
        def __init__(self, stream1, stream2):
            self.outputs = [stream1, stream2]

        # -- methods from sys.stdout / sys.stderr
        def write(self, data):
            for stream in self.outputs:
                if PY3K:
                    if "b" in stream.mode:
                        data = data.encode("utf-8")
                stream.write(data)
                stream.flush()

        def tell(self):
            raise IOError

        def flush(self):
            for stream in self.outputs:
                stream.flush()

        # --/ sys.stdout

    if logfile:
        openlog = open(logfile, "wb")
        # copy stdout and stderr streams to log file
        savedstd = sys.stderr, sys.stdout
        sys.stderr = TeeOutput(sys.stderr, openlog)
        sys.stdout = TeeOutput(sys.stdout, openlog)

    def echo(msg, linefeed=True):
        sys.stdout.write(msg)
        if linefeed:
            sys.stdout.write("\n")

    expected = """\
00000000: 00 00 00 5B 68 65 78 64  75 6D 70 5D 00 00 00 00  ...[hexdump]....
00000010: 00 11 22 33 44 55 66 77  88 99 0A BB CC DD EE FF  .."3DUfw........\
"""

    # get path to hexfile.bin
    # this doesn't work from .zip
    #   import os.path as osp
    #   hexfile = osp.dirname(osp.abspath(__file__)) + '/hexfile.bin'
    # this doesn't work either
    #   hexfile = osp.dirname(sys.modules[__name__].__file__) + '/hexfile.bin'
    # this works
    import pkgutil

    bin = pkgutil.get_data("hexdump", "data/hexfile.bin")

    # varios length of input data
    hexdump(b"zzzz" * 12)
    hexdump(b"o" * 17)
    hexdump(b"p" * 24)
    hexdump(b"q" * 26)
    # allowable character set filter
    hexdump(b"line\nfeed\r\ntest")
    hexdump(
        b"\x00\x00\x00\x5B\x68\x65\x78\x64\x75\x6D\x70\x5D\x00\x00\x00\x00"
        b"\x00\x11\x22\x33\x44\x55\x66\x77\x88\x99\x0A\xBB\xCC\xDD\xEE\xFF"
    )
    print("---")
    # dumping file-like binary object to screen (default behavior)
    hexdump(bin)
    print("return output")
    hexout = hexdump(bin, result="return")
    assert hexout == expected, "returned hex didn't match"
    print("return generator")
    hexgen = hexdump(bin, result="generator")
    assert next(hexgen) == expected.split("\n")[0], "hex generator 1 didn't match"
    assert next(hexgen) == expected.split("\n")[1], "hex generator 2 didn't match"

    # binary restore test
    bindata = restore(
        """
        00000000: 00 00 00 5B 68 65 78 64  75 6D 70 5D 00 00 00 00  ...[hexdump]....
        00000010: 00 11 22 33 44 55 66 77  88 99 0A BB CC DD EE FF  .."3DUfw........
        """
    )
    echo("restore check ", linefeed=False)
    assert bin == bindata, "restore check failed"
    echo("passed")

    far = """
        000000000: 00 00 00 5B 68 65 78 64 ¦ 75 6D 70 5D 00 00 00 00     [hexdump]
        000000010: 00 11 22 33 44 55 66 77 ¦ 88 99 0A BB CC DD EE FF   ?"3DUfwª»ÌÝîÿ
        """
    echo("restore far format ", linefeed=False)
    assert bin == restore(far), "far format check failed"
    echo("passed")

    scapy = """\
00 00 00 5B 68 65 78 64 75 6D 70 5D 00 00 00 00  ...[hexdump]....
00 11 22 33 44 55 66 77 88 99 0A BB CC DD EE FF  .."3DUfw........
"""
    echo("restore scapy format ", linefeed=False)
    assert bin == restore(scapy), "scapy format check failed"
    echo("passed")

    if not PY3K:
        assert restore("5B68657864756D705D") == "[hexdump]", "no space check failed"
        assert dump("\\\xa1\xab\x1e", sep="").lower() == "5ca1ab1e"
    else:
        assert restore("5B68657864756D705D") == b"[hexdump]", "no space check failed"
        assert dump(b"\\\xa1\xab\x1e", sep="").lower() == "5ca1ab1e"

    print("---[test file hexdumping]---")

    import os
    import tempfile

    hexfile = tempfile.NamedTemporaryFile(delete=False)
    try:
        hexfile.write(bin)
        hexfile.close()
        hexdump(open(hexfile.name, "rb"))
    finally:
        os.remove(hexfile.name)
    if logfile:
        sys.stderr, sys.stdout = savedstd
        openlog.close()


def main():
    from optparse import OptionParser

    parser = OptionParser(
        usage="""
  %prog [binfile|-]
  %prog -r hexfile
  %prog --test [logfile]""",
        version=__version__,
    )
    parser.add_option(
        "-r", "--restore", action="store_true", help="restore binary from hex dump"
    )
    parser.add_option("--test", action="store_true", help="run hexdump sanity checks")

    options, args = parser.parse_args()

    if options.test:
        if args:
            runtest(logfile=args[0])
        else:
            runtest()
    elif not args or len(args) > 1:
        parser.print_help()
        sys.exit(-1)
    else:
        # dump file
        if not options.restore:
            # [x] memory effective dump
            if args[0] == "-":
                if not PY3K:
                    hexdump(sys.stdin)
                else:
                    hexdump(sys.stdin.buffer)
            else:
                hexdump(open(args[0], "rb"))

        # restore file
        else:
            # prepare input stream
            if args[0] == "-":
                instream = sys.stdin
            else:
                if PY3K:
                    instream = open(args[0])
                else:
                    instream = open(args[0], "rb")

            # output stream
            # [ ] memory efficient restore
            if PY3K:
                sys.stdout.buffer.write(restore(instream.read()))
            else:
                # Windows - binary mode for sys.stdout to prevent data corruption
                normalize_py()
                sys.stdout.write(restore(instream.read()))
