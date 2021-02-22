export function formatTime(timestamp) {
    const time = new Date(timestamp);
    return `${String(time.getDate()).padStart(2, '0')}.${String(time.getMonth() + 1).padStart(2, '0')}.${time.getFullYear()} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
}
