export type DrivingLicenceDto = {
  id: string | number;
  category?: string | null;
  validity?: string | null;
  issuer_country?: string | null;
  isinternational?: boolean | null;
  employee?: {
    id: string | number;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
};

export type DrivingLicenceListItem = {
  id: string;
  category: string;
  validity: string;
  issuerCountry: string;
  international: boolean;
  employee: string;
};

