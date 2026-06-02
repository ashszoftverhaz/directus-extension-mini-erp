import { createFolder } from '../helpers/folderCreationHelper';
import type { BootstrapContext } from '../types';

type FoldersContext = Pick<
  BootstrapContext,
  'services' | 'logger' | 'database' | 'accountability' | 'getSchema'
>;

export async function bootstrapFolders(context: FoldersContext): Promise<void> {
  const { logger } = context;

  try {
    const rootFolder = await createFolder(context, 'ERP root');
    if (!rootFolder) return;

    await createFolder(context, 'Public', {
      parentId: rootFolder.id,
    });

  } catch (error: any) {
    logger.error('Folder creation error ', error);
    return;
  }

  logger.info('[ERP bootstrap] Folder creation successfull.');

}
