import {
    Column,
    Entity,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
  } from 'typeorm';
  import { CiltEntity } from 'src/modules/cilt/entities/cilt.entity';
  import { Exclude } from 'class-transformer';
  
  @Entity('repository')
  export class RepositoryEntity {
    @PrimaryGeneratedColumn({ name: 'ID', type: 'int', unsigned: true })
    id: number;
  
    @Column({ name: 'cilt_id', type: 'int', unsigned: true })
    ciltId: number;    
  
    @Column({ name: 'evidence_name', type: 'varchar', length: 255, nullable: false })
    evidenceName: string;
  
    @Column({ name: 'evidence_type', type: 'varchar', length: 10, nullable: false })
    evidenceType: string; // Ejemplo: "OPL", "SOP", "VIDEO", "FOTOS"
  
    @Column({ name: 'status', type: 'char', length: 1, default: 'A' })
    status: string; // Activo (A), Inactivo (I)
  
    @Exclude()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
  
    @Exclude()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
  
    @Exclude()
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date;
  
    @ManyToOne(() => CiltEntity, (cilt) => cilt.repositories, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cilt_id', referencedColumnName: 'id' })
    cilt: CiltEntity;
  }
  