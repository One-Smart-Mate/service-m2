import { AmDiscardReasonEntity } from 'src/modules/amDiscardReason/entities/am-discard-reason.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cards')
export class CardEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'int', nullable: false, name: 'site_card_id' })
  siteCardId: number;

  @Column({ type: 'bigint', unsigned: true, nullable: false, name: 'site_id' })
  siteId: number;

  @Column({ type: 'varchar', length: 6, nullable: false, name: 'site_code' })
  siteCode: string;

  @Column({ type: 'varchar', length: 60, nullable: false, name: 'card_UUID' })
  cardUUID: string;

  @Column({ type: 'char', length: 6, nullable: false, name: 'cardType_color' })
  cardTypeColor: string;

  @Column({
    type: 'enum',
    enum: ['Alto', 'Bajo'],
    nullable: true,
    name: 'feasibility',
  })
  feasibility: 'Alto' | 'Bajo' | null;

  @Column({
    type: 'enum',
    enum: ['Alto', 'Bajo'],
    nullable: true,
    name: 'effect',
  })
  effect: 'Alto' | 'Bajo' | null;

  @Column({
    type: 'char',
    length: 1,
    nullable: false,
    default: 'A',
    name: 'status',
  })
  status: string;

  @Column({ type: 'datetime', nullable: false, name: 'card_creation_date' })
  cardCreationDate: string;

  @Column({ type: 'date', nullable: false, name: 'card_due_date' })
  cardDueDate: Date;

  @Column({ type: 'varchar', nullable: true, name: 'card_location', length: 250 })
  cardLocation: string;

  @Column({ type: 'int', nullable: true, name: 'area_id' })
  areaId: number | null;

  @Column({ type: 'varchar', length: 45, nullable: false, name: 'area_name' })
  areaName: string;

  @Column({ type: 'int', nullable: true, name: 'node_id' })
  nodeId: number | null;

  @Column({ type: 'varchar', length: 45, nullable: false, name: 'node_name' })
  nodeName: string;

  @Column({ type: 'int', nullable: false, name: 'level' })
  level: number;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: false,
    name: 'superior_id',
  })
  superiorId: number;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: false,
    name: 'priority_id',
  })
  priorityId: number;

  @Column({ type: 'char', length: 4, nullable: false, name: 'priority_code' })
  priorityCode: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'priority_description',
  })
  priorityDescription: string;

  @Column({
    type: 'enum',
    enum: ['M', 'C'],
    nullable: true,
    name: 'cardType_methodology',
  })
  cardTypeMethodology: string;

  @Column({
    type: 'varchar',
    length: 25,
    nullable: true,
    name: 'cardType_methodology_name',
  })
  cardTypeMethodologyName: string | null;

  @Column({
    type: 'enum',
    enum: ['safe', 'unsafe'],
    nullable: false,
    default: 'unsafe',
    name: 'cardType_value',
  })
  cardTypeValue: 'safe' | 'unsafe' | '';

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: false,
    name: 'cardType_id',
  })
  cardTypeId: number;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: false,
    name: 'cardType_name',
  })
  cardTypeName: string;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: false,
    name: 'preclassifier_id',
  })
  preclassifierId: number;

  @Column({
    type: 'char',
    length: 3,
    nullable: false,
    name: 'preclassifier_code',
  })
  preclassifierCode: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'preclassifier_description',
  })
  preclassifierDescription: string;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: false,
    name: 'creator_id',
  })
  creatorId: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'creator_name',
  })
  creatorName: string;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: false,
    name: 'responsable_id',
  })
  responsableId: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'responsable_name',
  })
  responsableName: string;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    name: 'mechanic_id',
  })
  mechanicId: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'mechanic_name',
  })
  mechanicName: string | null;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    name: 'user_provisional_solution_id',
  })
  userProvisionalSolutionId: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'user_provisional_solution_name',
  })
  userProvisionalSolutionName: string | null;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    name: 'user_app_provisional_solution_id',
  })
  userAppProvisionalSolutionId: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'user_app_provisional_solution_name',
  })
  userAppProvisionalSolutionName: string | null;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    name: 'user_definitive_solution_id',
  })
  userDefinitiveSolutionId: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'user_definitive_solution_name',
  })
  userDefinitiveSolutionName: string | null;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    name: 'user_app_definitive_solution_id',
  })
  userAppDefinitiveSolutionId: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'user_app_definitive_solution_name',
  })
  userAppDefinitiveSolutionName: string | null;

  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    name: 'manager_id',
  })
  managerId: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'manager_name',
  })
  managerName: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'card_manager_close_date' })
  cardManagerCloseDate: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'comments_manager_at_card_close',
  })
  commentsManagerAtCardClose: string | null;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'comments_at_card_creation',
  })
  commentsAtCardCreation: string | null;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'card_provisional_solution_date',
  })
  cardProvisionalSolutionDate: Date;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'comments_at_card_provisional_solution',
  })
  commentsAtCardProvisionalSolution: string | null;

  @Column({
    type: 'datetime',
    nullable: true,
    name: 'card_definitive_solution_date',
  })
  cardDefinitiveSolutionDate: Date;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'comments_at_card_definitive_solution',
  })
  commentsAtCardDefinitiveSolution: string | null;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: () => '0',
    name: 'evidence_aucr',
  })
  evidenceAucr: number;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: () => '0',
    name: 'evidence_vicr',
  })
  evidenceVicr: number;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: () => '0',
    name: 'evidence_imcr',
  })
  evidenceImcr: number;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: () => '0',
    name: 'evidence_aucl',
  })
  evidenceAucl: number;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: () => '0',
    name: 'evidence_vicl',
  })
  evidenceVicl: number;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: () => '0',
    name: 'evidence_imcl',
  })
  evidenceImcl: number;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: true,
    default: () => '0',
    name: 'evidence_aups',
  })
  evidenceAups: number;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: true,
    default: () => '0',
    name: 'evidence_vips',
  })
  evidenceVips: number;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: true,
    default: () => '0',
    name: 'evidence_imps',
  })
  evidenceImps: number;

  @Column({
    type: 'enum',
    enum: ['AM', 'CILT'],
    nullable: true,
    default: 'AM',
    name: 'tag_origin',
    comment: 'Show if a card was created from AM or due to the result of a CILT sequence'
  })
  tagOrigin: 'AM' | 'CILT' | null;
  
  @Column({ 
    type: 'int', 
    nullable: true, 
    default: 0, 
    name: 'cilt_secuence_execution_id', 
    comment: 'indicates if this table was originated in a CILT sequence, the number of the execution' 
  })
  ciltSecuenceExecutionId: number | null;
  
  @Column({ 
    type: 'varchar', 
    nullable: true, 
    name: 'route', 
    length: 250, 
    comment: 'text path where the card is located, example: /area1/machine1/zone1' 
  })
  route: string | null;
  
  @Column({
    type: 'int',
    unsigned: true,
    nullable: true,
    name: 'am_discard_reason_id'
  })
  amDiscardReasonId: number | null;
  
  @ManyToOne(() => AmDiscardReasonEntity)
  @JoinColumn({ name: 'am_discard_reason_id' })
  amDiscardReason: AmDiscardReasonEntity;
  
  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    name: 'discard_reason',
    comment: 'if the manager discarded a card instead of assigning it a definitive solution, here the preclassifier of the discard reason is stored, comes from the am_discard_reasons table'
  })
  discardReason: string | null;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    name: 'app_version',
  })
  appVersion: string | null;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    name: 'app_so',
  })
  appSo: string | null;

  @Column({
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: () => '0',
    name: 'assign_when_creating',
    comment: 'Flag to indicate if the card should be assigned to the level responsible when created'
  })
  assignWhenCreating: number;
}
