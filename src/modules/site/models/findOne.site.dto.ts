import { Expose } from "class-transformer";

export class FindOneSiteDTO {
    @Expose()
    id: string
    @Expose()
    siteCode: string;
    @Expose()
    siteBusinessName: string;
    @Expose()
    name: string;
    @Expose()
    siteType: string;
    @Expose()
    rfc: string;
    @Expose()
    address: string;
    @Expose()
    contact: string;
    @Expose()
    position: string;
    @Expose()
    phone: string;
    @Expose()
    extension: string;
    @Expose()
    cellular: string;
    @Expose()
    email: string;
    @Expose()
    logo: string;
    @Expose()
    latitud: string;
    @Expose()
    longitud: string;
    @Expose()
    dueDate: string;
    @Expose()
    monthlyPayment: number;
    @Expose()
    currency: string;  
    @Expose()
    appHistoryDays: number;
    @Expose()
    status: string;
  }