export type HookContext = {
  services: any;
  logger: any;
  database: any;
  getSchema: (options?: { database?: any }) => Promise<any>;
};