# Bring up the loopback interface inside a fresh network namespace (D007-A54).
# Uses only the Python standard library (SIOCGIFFLAGS / SIOCSIFFLAGS ioctls).
import fcntl, socket, struct
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
req = struct.pack("16sH14s", b"lo", 0, b"\0" * 14)
flags = struct.unpack("16sH14s", fcntl.ioctl(s, 0x8913, req))[1]
fcntl.ioctl(s, 0x8914, struct.pack("16sH14s", b"lo", flags | 0x1, b"\0" * 14))
