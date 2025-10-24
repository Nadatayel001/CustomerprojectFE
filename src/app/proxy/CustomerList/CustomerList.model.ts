
export interface CustomerDto {
  id: string;
  fullName: string;
  nationalID: string;
  genderId: string;
  governorateId: string;
  districtId: string;
  villageId: string;
  salary: number;
  birthDate: string;
  age: number;
  createdDate: string;
  createdBy: string | null;
  isActive: boolean;
  userId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdByNavigation: any | null;
  district: any | null;
  gender: any | null;
  governorate: any | null;
  user: any | null;
  village: any | null;
}

export interface CustomerListResponse {
  totalCount: number;
  items: CustomerDto[];
}

export interface CustomerQueryParams {
  skip?: number;
  take?: number;
  search?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}