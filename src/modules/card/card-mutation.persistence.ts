import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import {
  NotFoundCustomException,
  NotFoundCustomExceptionType,
} from 'src/common/exceptions/types/notFound.exception';
import { stringConstants } from 'src/utils/string.constant';
import { CardNoteEntity } from '../cardNotes/card.notes.entity';
import { CardEntity } from './entities/card.entity';

interface MutationActor {
  id: number;
  name: string;
}

interface MutationResult {
  card: CardEntity;
  note?: CardNoteEntity;
  changed: boolean;
}

@Injectable()
export class CardMutationPersistence {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  updatePriority(input: {
    cardId: number;
    actor: MutationActor;
    priority: {
      id: number;
      priorityCode: string;
      priorityDescription: string;
    };
    dueDate: Date;
  }): Promise<MutationResult> {
    return this.withLockedCard(input.cardId, async (manager, card) => {
      if (Number(card.priorityId) === Number(input.priority.id)) {
        return { card, changed: false };
      }

      const noteText = `${stringConstants.cambio} <${input.actor.id} ${input.actor.name}> ${stringConstants.cambioLaPrioridadDe} <${card.priorityCode} - ${card.priorityDescription}> ${stringConstants.a} <${input.priority.priorityCode} - ${input.priority.priorityDescription}>`;

      card.priorityId = input.priority.id;
      card.priorityCode = input.priority.priorityCode;
      card.priorityDescription = input.priority.priorityDescription;
      card.cardDueDate = input.dueDate;
      card.updatedAt = new Date();

      return this.saveCardAndNote(manager, card, noteText);
    });
  }

  updateMechanic(input: {
    cardId: number;
    actor: MutationActor;
    mechanic: MutationActor;
  }): Promise<MutationResult> {
    return this.withLockedCard(input.cardId, async (manager, card) => {
      if (Number(card.mechanicId) === Number(input.mechanic.id)) {
        return { card, changed: false };
      }

      const oldMechanicName =
        card.mechanicName || stringConstants.noResponsible;
      const noteText = `${stringConstants.cambio} <${input.actor.id} ${input.actor.name}> ${stringConstants.cambioElMecanicoDe} <${oldMechanicName}> ${stringConstants.a} <${input.mechanic.name}>`;

      card.mechanicId = input.mechanic.id;
      card.mechanicName = input.mechanic.name;
      card.updatedAt = new Date();

      return this.saveCardAndNote(manager, card, noteText);
    });
  }

  updateCustomDueDate(input: {
    cardId: number;
    actor: MutationActor;
    dueDate: Date;
    dueDateText: string;
  }): Promise<MutationResult> {
    return this.withLockedCard(input.cardId, async (manager, card) => {
      const noteText = `${stringConstants.cambio} <${input.actor.id} ${input.actor.name}> estableció fecha de vencimiento personalizada: <${input.dueDateText}>`;
      card.cardDueDate = input.dueDate;
      card.updatedAt = new Date();

      return this.saveCardAndNote(manager, card, noteText);
    });
  }

  discard(input: {
    cardId: number;
    actor: MutationActor;
    discardReasonId: number;
    discardReason?: string;
    comments?: string;
  }): Promise<CardEntity> {
    return this.withLockedCard(input.cardId, async (manager, card) => {
      const now = new Date();
      card.status = stringConstants.DISCARDED;
      card.amDiscardReasonId = input.discardReasonId;
      card.discardReason = input.discardReason || null;
      card.managerId = input.actor.id;
      card.managerName = input.actor.name;
      card.cardManagerCloseDate = now.toISOString();
      card.commentsManagerAtCardClose = input.comments || null;
      card.updatedAt = now;

      return manager.save(CardEntity, card);
    });
  }

  private async withLockedCard<T>(
    cardId: number,
    mutation: (manager: EntityManager, card: CardEntity) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const card = await manager.findOne(CardEntity, {
        where: { id: cardId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!card) {
        throw new NotFoundCustomException(NotFoundCustomExceptionType.CARD);
      }

      return mutation(manager, card);
    });
  }

  private async saveCardAndNote(
    manager: EntityManager,
    card: CardEntity,
    noteText: string,
  ): Promise<MutationResult> {
    const savedCard = await manager.save(CardEntity, card);
    const note = manager.create(CardNoteEntity, {
      cardId: card.id,
      siteId: card.siteId,
      note: noteText,
      createdAt: new Date(),
    });
    const savedNote = await manager.save(CardNoteEntity, note);

    return { card: savedCard, note: savedNote, changed: true };
  }
}
