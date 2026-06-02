type HookContext = {
  services: any;
  logger: any;
  database: any;
  accountability?: any;
  getSchema: (options?: { database?: any }) => Promise<any>;
};

type CreateFolderOptions = {
  parentId?: string | null;
};

type FolderRecord = {
  id: string;
};

export async function createFolder(
  context: HookContext,
  folderName: string,
  options?: CreateFolderOptions
): Promise<FolderRecord | null> {
  const { logger, services, getSchema, accountability } = context;
  const { ItemsService } = services;

  logger.info(`[ERP bootstrap] Folders creation started: ${folderName}`);

  const foldersService = new ItemsService('directus_folders', {
    accountability: { ...accountability, admin: true },
    schema: await getSchema({ database: context.database }),
  });

  const parentId = options?.parentId ?? null;
  const existing = await foldersService.readByQuery({
    filter: {
      name: { _eq: folderName },
      parent: parentId ? { _eq: parentId } : { _null: true },
    },
    fields: ['id'],
    limit: 1,
  });

  if (!Array.isArray(existing) || existing.length === 0) {
    const createdId = await foldersService.createOne({
      name: folderName,
      parent: parentId,
    });
    logger.info('[ERP bootstrap] Folders creation finished: ', folderName);
    if (typeof createdId === 'string') {
      return { id: createdId };
    }
    return null;
  }

  existing ? logger.info('[ERP Bootstrap] Folder exists') : logger.info('[ERP bootstrap] Folders creation finished: ', folderName);

  return existing[0] ?? null;
}
