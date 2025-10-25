export interface SignupModel {
   id?: string;           // Optional, for updates
  fullName: string;
  nationalID: string;
  genderId: string;
  governorateId: string;
  districtId: string;
  villageId: string;
  birthDate: string;     // ISO date string
  salary?: number;
  createdBy: string;     // Required GUID string
  userId?: string;
}

export interface SignupResult {
  customerId: string;
}