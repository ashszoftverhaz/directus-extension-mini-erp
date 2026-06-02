export type ListFetchOptions = {
	search?: string;
	limit?: number;
	offset?: number;
	sort?: string[];
	filter?: Record<string, any>;
};

export type ListFetchResult<T> = {
	data: T[];
	total: number;
};
