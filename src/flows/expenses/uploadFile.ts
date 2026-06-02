import { createFolder } from '../../bootstrap/helpers/folderCreationHelper';
import { BootstrapContext } from '../../bootstrap/types';
import {
  ERP_ROOT_FOLDER,
  EXPENSES_COLLECTION,
  INVOICES_FOLDER,
} from '../../shared/contracts/constants';

/**
 * moves invoice file to its's location folder, 
 * folder structure: ERP root/Invoices/location-{locationId}
 */
export async function uploadInvoiceHandler(
  meta: Record<string, any>,
  context: BootstrapContext,
): Promise<void> {
  const accountability = meta?.accountability ?? context?.accountability ?? context.accountability;
  const schema = await context.getSchema({ database: context.database });
  const { ItemsService } = context.services;
  const expensesService = new ItemsService(EXPENSES_COLLECTION, {
    accountability: { ...accountability, admin: true },
    schema,
  });

  const expense = await expensesService.readOne(meta?.payload?.expenses_id);
  const locationId = expense?.location;

  if (!locationId) return;

  const erpRootFolder = await createFolder(context, ERP_ROOT_FOLDER);
  if (!erpRootFolder?.id) return;

  const invoidesFolder = await createFolder(context, INVOICES_FOLDER, {
    parentId: erpRootFolder.id,
  });
  if (!invoidesFolder?.id) return;

  const locationFolderName = `location-${locationId}`;
  const locationFolder = await createFolder(context, locationFolderName, {
    parentId: invoidesFolder.id,
  });
  if (!locationFolder?.id) return;

  const fileId = meta?.payload?.directus_files_id?.id;
  if (!fileId) return;

  const filesService = new ItemsService('directus_files', {
    accountability: { ...accountability, admin: true },
    schema,
  });

  await filesService.updateOne(fileId, { folder: locationFolder.id });
}
