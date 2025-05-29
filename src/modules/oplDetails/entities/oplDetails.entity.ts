import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { OplMstr } from '../../oplMstr/entities/oplMstr.entity';
import { SiteEntity } from '../../site/entities/site.entity';

@Entity("opl_details")
export class OplDetailsEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "site_id", nullable: true, unsigned: true })
  siteId: number | null;

  @Column("int", { name: "opl_id", unsigned: true })
  oplId: number;

  @Column("tinyint", { name: "order" })
  order: number;

  @Column("enum", { name: "type", enum: ["texto", "imagen", "video", "pdf"] })
  type: "texto" | "imagen" | "video" | "pdf";

  @Column("text", { name: "text", nullable: true })
  text: string | null;

  @Column("varchar", { name: "media_url", nullable: true, length: 500 })
  mediaUrl: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP"
  })
  createdAt: Date | null;

  @Column("timestamp", {
    name: "updated_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP"
  })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => OplMstr)
  @JoinColumn({ name: 'opl_id' })
  opl: OplMstr;

  @ManyToOne(() => SiteEntity)
  @JoinColumn({ name: 'site_id' })
  site: SiteEntity;
}