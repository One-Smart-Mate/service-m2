import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity("opl_details")
export class OplDetailsEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "opl_id" })
  oplId: number;

  @Column("tinyint", { name: "order" })
  order: number;

  @Column("enum", { name: "type", enum: ["texto", "imagen", "video", "pdf"] })
  type: "texto" | "imagen" | "video" | "pdf";

  @Column("text", { name: "text", nullable: true })
  text: string | null;

  @Column("varchar", { name: "media_url", nullable: true, length: 500 })
  mediaUrl: string | null;

  @Column("datetime", {
    name: "updated_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date | null;
}