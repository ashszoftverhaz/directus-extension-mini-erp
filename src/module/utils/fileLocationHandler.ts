import { useApi } from '@directus/extensions-sdk';
import {
  ERP_ROOT_FOLDER,
  FolderDto,
  FRANCHISE_FOLDER_SUFFIX,
  INVOICES_FOLDER,
  LOCATION_FOLDER_SUFFIX,
  LocationDto,
} from '../types/folders';

type ApiClient = ReturnType<typeof useApi>;

async function getFolderStructureForInvoice(id: string, api: ApiClient): Promise<string[] | null> {
  const folderStructure: string[] = [];

  const location = await getLocation(id, api);
  if (!location) {
    console.warn(`No location found for id ${id}. Cannot determine folder structure.`);
    return null;
  }

  folderStructure.push(getFolderNameFromLocation(location));
  folderStructure.push(INVOICES_FOLDER);
  if (location.franchise) {
    folderStructure.push(getFolderNameFromFranchise(location.franchise.name));
  }

  return folderStructure;
}

function getFolderNameFromLocation(location: LocationDto): string {
  return `${location.name}${LOCATION_FOLDER_SUFFIX}`;
}

function getFolderNameFromFranchise(franchiseName: string): string {
  return `${franchiseName}${FRANCHISE_FOLDER_SUFFIX}`;
}

async function getOrCreateFolderId(
  name: string,
  parentId: string | null,
  api: ApiClient,
): Promise<string | null> {
  const existingResponse = await api.get('folders', {
    params: {
      filter: {
        name: { _eq: name },
        parent: parentId ? { _eq: parentId } : { _null: true },
      },
      fields: ['id'],
      limit: 1,
    },
  });

  const existingData =
    (existingResponse as { data?: { data?: FolderDto[] } })?.data?.data ??
    (existingResponse as unknown as FolderDto[]);
  const existing = Array.isArray(existingData) ? existingData : [];

  const existingId = existing[0]?.id;
  if (typeof existingId === 'string' && existingId.length > 0) {
    return existingId;
  }

  const createdResponse = await api.post('folders', {
    name,
    parent: parentId,
  });

  const createdData =
    (createdResponse as { data?: { data?: FolderDto } })?.data?.data ??
    (createdResponse as unknown as FolderDto | string);

  if (typeof createdData === 'string') {
    return createdData;
  }

  if (
    createdData &&
    typeof createdData === 'object' &&
    'id' in createdData &&
    typeof createdData.id === 'string'
  ) {
    return createdData.id;
  }

  return null;
}

export async function getFolderForUploadedFile(id: string, api: ApiClient): Promise<string | null> {
  try {
    const folderStructure = await getFolderStructureForInvoice(id, api);
    if (!folderStructure) {
      return null;
    }

    return await createFolderHierarchy(folderStructure, api);
  } catch (error) {
    console.error(`Failed to resolve upload folder for location ${id}:`, error);
    return null;
  }
}

async function createFolderHierarchy(
  folderNames: string[],
  api: ApiClient,
): Promise<string | null> {
  let folderId = await getOrCreateFolderId(ERP_ROOT_FOLDER, null, api);

  while (folderId && folderNames.length > 0) {
    const folderName = folderNames.pop()!;
    folderId = await getOrCreateFolderId(folderName, folderId, api);
  }

  return folderId;
}

async function collectionExists(collection: string, api: ApiClient): Promise<boolean> {
  try {
    await api.get(`collections/${collection}`, {
      params: {
        fields: ['collection'],
      },
    });

    return true;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 403 || status === 404) {
      return false;
    }

    console.warn(`Failed to verify collection ${collection}:`, error);
    return false;
  }
}

async function getLocation(id: string, api: ApiClient): Promise<LocationDto | null> {
  const hasWashingLocationCollection = await collectionExists('washing_location', api);
  if (hasWashingLocationCollection) {
    const location: { data: { data: LocationDto[] } } = await api.get('items/washing_location', {
      params: {
        fields: ['id', 'name', 'franchise.id', 'franchise.name'],
        filter: {
          id: { _eq: id },
        },
      },
    });

    if (
      !location?.data?.data ||
      !Array.isArray(location.data.data) ||
      location.data.data.length === 0 ||
      !location.data.data[0]?.name
    ) {
      return null;
    }

    return location.data.data[0];
  }

  const hasErpLocationCollection = await collectionExists('erp_locations', api);
  if (hasErpLocationCollection) {
    const location: { data: { data: LocationDto[] } } = await api.get('items/erp_locations', {
      params: {
        fields: ['id', 'name', ],
        filter: {
          id: { _eq: id },
        },
      },
    });

        if (
      !location?.data?.data ||
      !Array.isArray(location.data.data) ||
      location.data.data.length === 0 ||
      !location.data.data[0]?.name
    ) {
      return null;
    }

    return location.data.data[0];
  }

  console.warn('Neither washing_location nor erp_locations collection exists. Cannot fetch location name.');
  return null;
}
