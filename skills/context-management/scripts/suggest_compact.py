"""Optional Claude PreToolUse reminder; state errors must not block tool use."""

import fcntl
import hashlib
import json
import os
import stat
import sys
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

MAX_INPUT = 1024 * 1024
MAX_COUNT = (1 << 63) - 1


@contextmanager
def state_directory(directory: Path) -> Iterator[int]:
    if not directory.is_absolute() or '..' in directory.parts:
        raise ValueError('state path must be absolute without parent traversal')
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    descriptor = os.open(directory.anchor, flags)
    try:
        for component in directory.parts[1:]:
            try:
                os.mkdir(component, mode=0o700, dir_fd=descriptor)
            except FileExistsError:
                pass
            child = os.open(component, flags, dir_fd=descriptor)
            os.close(descriptor)
            descriptor = child
        info = os.fstat(descriptor)
        if info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) & 0o077:
            raise ValueError('state directory must be private and user-owned')
        yield descriptor
    finally:
        os.close(descriptor)


def increment(directory: int, session_id: str) -> int:
    name = hashlib.sha256(session_id.encode('utf-8')).hexdigest() + '.count'
    descriptor = os.open(
        name, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK,
        0o600, dir_fd=directory,
    )
    try:
        info = os.fstat(descriptor)
        if (not stat.S_ISREG(info.st_mode) or info.st_nlink != 1
                or info.st_uid != os.getuid()
                or stat.S_IMODE(info.st_mode) & 0o077):
            raise ValueError('counter must be a private, user-owned regular file')
        # A contended optional reminder is skipped instead of delaying a tool.
        fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        raw = os.read(descriptor, 32).strip()
        previous = int(raw) if raw.isdigit() and len(raw) <= 19 else 0
        count = min(previous + 1, MAX_COUNT)
        os.lseek(descriptor, 0, os.SEEK_SET)
        with os.fdopen(descriptor, 'w', encoding='ascii', closefd=False) as output:
            output.write(str(count) + '\n')
            output.flush()
            output.truncate()
        return count
    finally:
        os.close(descriptor)


def main() -> None:
    try:
        raw = sys.stdin.buffer.read(MAX_INPUT + 1)
        if len(raw) > MAX_INPUT:
            raise ValueError('hook input exceeds the size limit')
        event = json.loads(raw)
        if not isinstance(event, dict) or event.get('hook_event_name') != 'PreToolUse':
            raise ValueError('expected a PreToolUse event')
        session_id = event.get('session_id')
        if not isinstance(session_id, str) or not session_id or len(session_id) > 4096:
            raise ValueError('missing or invalid session identity')
        threshold_text = os.environ.get('COMPACT_THRESHOLD', '50')
        if not threshold_text.isascii() or not threshold_text.isdigit() or len(threshold_text) > 19:
            raise ValueError('invalid reminder threshold')
        threshold = int(threshold_text)
        if not 1 <= threshold <= MAX_COUNT:
            raise ValueError('invalid reminder threshold')
        state_home = os.environ.get('XDG_STATE_HOME') or os.path.join(
            os.environ.get('HOME', ''), '.local', 'state',
        )
        with state_directory(Path(state_home) / 'bjornjee-skills' / 'compact') as directory:
            count = increment(directory, session_id)
    except (OSError, ValueError, UnicodeError, RecursionError):
        # Malformed input, unsafe state, and lock contention are nonblocking.
        print('[StrategicCompact] Reminder skipped: invalid input or unavailable private state.', file=sys.stderr)
        return

    if count == threshold or (count > threshold and (count - threshold) % 25 == 0):
        print(json.dumps({'hookSpecificOutput': {
            'hookEventName': 'PreToolUse',
            'additionalContext': (
                f'[StrategicCompact] {count} selected tool calls reached. '
                'Consider /compact at a completed phase boundary if context is bulky; '
                'preserve the active task, constraints, and evidence first.'
            ),
        }}))


if __name__ == '__main__':
    main()
