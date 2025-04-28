import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("cilt_types", { schema: "railway" })
export class CiltTypes {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "site_id", nullable: true })
  siteId: number | null;

  @Column("varchar", { name: "name", nullable: true, length: 45 })
  name: string | null;

  @Column("char", {
    name: "status",
    nullable: true,
    length: 2,
    default: () => "'A'",
  })
  status: string | null;
}
