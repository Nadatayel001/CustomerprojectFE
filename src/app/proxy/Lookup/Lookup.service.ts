import { environment } from "../../environments/environment";
import { CategoryCode } from "../../shared/LookupEnums/CategoryCode.enum";
import { LookupItem, LookupSearchParams, LookupSearchResponse } from "./Lookup.model";

/**
 * Lookup Service
 * Handles all lookup-related API calls
 */
export class LookupService {
  private readonly API_BASE_URL: string;

  constructor() {
    this.API_BASE_URL = environment.apiBaseUrl;
  }


  async searchLookups(params: LookupSearchParams): Promise<LookupItem[]> {
    try {
      const { categoryCode, parentId = null, skip = 0, take = 50 } = params;
      
      let url = `${this.API_BASE_URL}/Lookups/search?categoryCode=${categoryCode}&skip=${skip}&take=${take}`;
      
      if (parentId) {
        url += `&parentId=${parentId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lookups: ${response.statusText}`);
      }

      const data: LookupSearchResponse = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error searching lookups:', error);
      throw error;
    }
  }


  async getGenders(): Promise<LookupItem[]> {
    return this.searchLookups({
      categoryCode: CategoryCode.Gender,
      skip: 0,
      take: 50
    });
  }


  async getGovernorates(): Promise<LookupItem[]> {
    return this.searchLookups({
      categoryCode: CategoryCode.Governorate,
      skip: 0,
      take: 50
    });
  }


  async getDistrictsByGovernorate(governorateId: string): Promise<LookupItem[]> {
    return this.searchLookups({
      categoryCode: CategoryCode.District,
      parentId: governorateId,
      skip: 0,
      take: 50
    });
  }


  async getVillagesByDistrict(districtId: string): Promise<LookupItem[]> {
    return this.searchLookups({
      categoryCode: CategoryCode.Village,
      parentId: districtId,
      skip: 0,
      take: 50
    });
  }


  getApiBaseUrl(): string {
    return this.API_BASE_URL;
  }


  isProduction(): boolean {
    return environment.production;
  }
}

export const lookupService = new LookupService();