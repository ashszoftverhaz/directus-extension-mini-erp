export const ERP_ROOT_FOLDER = 'ERP root';
export const INVOICES_FOLDER = 'Invoices';
export const LOCATION_FOLDER_SUFFIX = ' Location';
export const FRANCHISE_FOLDER_SUFFIX = ' Franchise';

export type FolderDto = {
  id: string;
  name: string;
  parent: string | null;
};

export type LocationDto = {
  id: string;
  name: string;
  franchise: {
    name: string;
  } | null;
};
