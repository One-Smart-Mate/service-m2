import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import {
  ValidationException,
  ValidationExceptionType,
} from 'src/common/exceptions/types/validation.exception';
import { stringConstants } from 'src/utils/string.constant';
import { CardNoteEntity } from '../cardNotes/card.notes.entity';
import { EvidenceEntity } from '../evidence/entities/evidence.entity';
import { CardEntity } from './entities/card.entity';

export type CardSolutionType = 'provisional' | 'definitive';

export interface PersistCardSolution {
  cardId: number;
  type: CardSolutionType;
  solutionUser: { id: number; name: string };
  actor: { id: number; name: string };
  comments: string;
  evidences: Array<{ type: string; url: string }>;
}

@Injectable()
export class CardSolutionPersistence {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  persist = async (input: PersistCardSolution): Promise<CardEntity> =>
    this.dataSource.transaction(async (manager) => {
      const card = await manager.findOne(CardEntity, {
        where: { id: input.cardId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!card) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARD);
      }

      this.assertSolutionIsNotApplied(card, input.type);

      const now = new Date();
      this.applySolution(card, input, now);
      this.applyEvidenceFlags(card, input.evidences);

      const savedCard = await manager.save(CardEntity, card);

      if (input.evidences.length > 0) {
        const evidences = input.evidences.map((evidence) =>
          manager.create(EvidenceEntity, {
            evidenceName: evidence.url,
            evidenceType: evidence.type,
            cardId: card.id,
            siteId: card.siteId,
            createdAt: now,
          }),
        );
        await manager.save(EvidenceEntity, evidences);
      }

      const note = manager.create(CardNoteEntity, {
        cardId: card.id,
        siteId: card.siteId,
        note: this.buildNote(input),
        createdAt: now,
      });
      await manager.save(CardNoteEntity, note);

      return savedCard;
    });

  private assertSolutionIsNotApplied(
    card: CardEntity,
    type: CardSolutionType,
  ): void {
    if (type === 'definitive' && card.userDefinitiveSolutionId !== null) {
      throw new ValidationException(
        ValidationExceptionType.OVERWRITE_DEFINITIVE_SOLUTION,
      );
    }

    if (type === 'provisional' && card.userProvisionalSolutionId !== null) {
      throw new ValidationException(
        ValidationExceptionType.OVERWRITE_PROVISIONAL_SOLUTION,
      );
    }
  }

  private applySolution(
    card: CardEntity,
    input: PersistCardSolution,
    appliedAt: Date,
  ): void {
    if (input.type === 'definitive') {
      card.userDefinitiveSolutionId = input.solutionUser.id;
      card.userDefinitiveSolutionName = input.solutionUser.name;
      card.userAppDefinitiveSolutionId = input.actor.id;
      card.userAppDefinitiveSolutionName = input.actor.name;
      card.cardDefinitiveSolutionDate = appliedAt;
      card.commentsAtCardDefinitiveSolution = input.comments;
      card.status = stringConstants.R;
    } else {
      card.userProvisionalSolutionId = input.solutionUser.id;
      card.userProvisionalSolutionName = input.solutionUser.name;
      card.userAppProvisionalSolutionId = input.actor.id;
      card.userAppProvisionalSolutionName = input.actor.name;
      card.cardProvisionalSolutionDate = appliedAt;
      card.commentsAtCardProvisionalSolution = input.comments;
      card.status = stringConstants.P;
    }

    card.updatedAt = appliedAt;
  }

  private applyEvidenceFlags(
    card: CardEntity,
    evidences: PersistCardSolution['evidences'],
  ): void {
    const flags: Record<string, keyof CardEntity> = {
      [stringConstants.AUCR]: 'evidenceAucr',
      [stringConstants.VICR]: 'evidenceVicr',
      [stringConstants.IMCR]: 'evidenceImcr',
      [stringConstants.AUCL]: 'evidenceAucl',
      [stringConstants.VICL]: 'evidenceVicl',
      [stringConstants.IMCL]: 'evidenceImcl',
      [stringConstants.IMPS]: 'evidenceImps',
      [stringConstants.AUPS]: 'evidenceAups',
      [stringConstants.VIPS]: 'evidenceVips',
    };

    for (const evidence of evidences) {
      const flag = flags[evidence.type];
      if (flag) {
        (card[flag] as number) = 1;
      }
    }
  }

  private buildNote(input: PersistCardSolution): string {
    const prefix =
      input.type === 'definitive'
        ? stringConstants.noteDefinitiveSoluition
        : stringConstants.noteProvisionalSolution;

    return `${prefix} <${input.actor.id} ${input.actor.name}> ${stringConstants.aplico} <${input.solutionUser.id} ${input.solutionUser.name}>`;
  }
}
