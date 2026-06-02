export function extractDirectusError(error: unknown, fallback: string): string {
	const e = error as any;
	if (!e) return '';

	const directusMsg =
		e?.response?.data?.errors?.[0]?.message ||
		e?.response?.data?.error?.message ||
		e?.response?.data?.message;

	if (typeof directusMsg === 'string' && directusMsg.trim()) return directusMsg;
	if (typeof e?.message === 'string' && e.message.trim()) return e.message;
	return fallback;
}
