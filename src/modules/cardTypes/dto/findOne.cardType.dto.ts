import { Expose } from "class-transformer";

export class FindOneCardTypeDTO {
    @Expose()
    id: number;
    @Expose()
    siteCode: string;
    @Expose()
    methodology: string;
    @Expose()
    name: string;
    @Expose()
    description: string;
    @Expose()
    color: string;
    @Expose()
    responsableId: number;
    @Expose()
    responsableName: string;
    @Expose()
    email: string;
    @Expose()
    quantityPicturesCreate: number;
    @Expose()
    quantityAudiosCreate: number;
    @Expose()
    quantityVideosCreate: number;
    @Expose()
    audiosDurationCreate: number;
    @Expose()
    videosDurationCreate: number;
    @Expose()
    quantityPicturesClose: number;
    @Expose()
    quantityAudiosClose: number;
    @Expose()
    quantityVideosClose: number;
    @Expose()
    audiosDurationClose: number;
    @Expose()
    videosDurationClose: number;
    @Expose()
    status: Date;
}