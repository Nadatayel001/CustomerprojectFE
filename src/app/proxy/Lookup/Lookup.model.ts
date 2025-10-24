export interface LookupItem {
  id: string;
  categoryCode: number;
  parentId: string | null;
  code: string;
  name: string;
}


export interface LookupSearchResponse {
  totalCount: number;
  items: LookupItem[];
}

export interface LookupSearchParams {
  categoryCode: number;
  parentId?: string | null;
  skip?: number;
  take?: number;
}