
export interface Customer {
  id?: string;
  fullName: string;
  nationalID: string;
  genderId: string;
  governorateId: string;
  districtId: string;
  villageId: string;
  birthDate: string;
  salary: number;
}


export interface CustomerFormData {
  fullName: string;
  nationalID: string;
  genderId: string;
  governorateId: string;
  districtId: string;
  villageId: string;
  birthDate: string;
  salary: number;
}


export interface CustomerCreateRequest {
  fullName: string;
  nationalID: string;
  genderId: string;
  governorateId: string;
  districtId: string;
  villageId: string;
  birthDate: string;
  salary: number;
}


export interface CustomerUpdateRequest extends CustomerCreateRequest {
  id: string;
}