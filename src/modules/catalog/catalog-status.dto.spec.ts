import { validate } from 'class-validator';
import { UpdateCardTypesDTO } from '../cardTypes/dto/update.cardTypes.dto';
import { UpdateLevelDTO } from '../level/models/dto/update.level.dto';
import { UpdatePreclassifierDTO } from '../preclassifier/models/dto/update-preclassifier.dto';
import { UpdatePriorityDTO } from '../priority/models/dto/update.priority.dto';

describe('catalog update status contracts', () => {
  const fixtures = [
    Object.assign(new UpdatePriorityDTO(), {
      id: 1,
      priorityCode: 'P1',
      priorityDescription: 'Urgent',
      priorityDays: 1,
    }),
    Object.assign(new UpdateCardTypesDTO(), {
      id: 1,
      methodology: 'Maintenance',
      name: 'Type',
      description: 'Description',
      color: '00FF00',
    }),
    Object.assign(new UpdatePreclassifierDTO(), {
      id: 1,
      preclassifierCode: 'PC1',
      preclassifierDescription: 'Description',
    }),
    Object.assign(new UpdateLevelDTO(), {
      id: 1,
      responsibleId: null,
      name: 'Area',
      description: 'Description',
      levelMachineId: null,
      notify: 1,
    }),
  ];

  it.each(fixtures.map((fixture) => [fixture.constructor.name, fixture]))(
    '%s rejects an unknown lifecycle status',
    async (_name, fixture) => {
      Object.assign(fixture, { status: 'X' });

      const errors = await validate(fixture as object);

      expect(
        errors.find((error) => error.property === 'status')?.constraints,
      ).toHaveProperty('isIn');
    },
  );
});
