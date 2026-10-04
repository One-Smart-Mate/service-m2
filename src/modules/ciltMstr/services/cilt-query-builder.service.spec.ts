import { CiltQueryBuilderService } from './cilt-query-builder.service';

describe('CILT assignment response identity', () => {
  const builder = new CiltQueryBuilderService({
    logProcess: jest.fn(),
  } as never);
  const paths = [
    { ciltMstrId: 1, levelId: 10, route: 'Area/Press' },
    { ciltMstrId: 1, levelId: 20, route: 'Area/Pump' },
  ];
  it('uses the level of each execution instead of the first master match', () => {
    const result = builder.buildSiteCiltResponse(
      7,
      '2026-10-04',
      [
        { ciltId: 1, levelId: 10 },
        { ciltId: 1, levelId: 20 },
      ] as never,
      paths,
    );
    expect(result.executions).toMatchObject([
      { levelId: 10, route: 'Area/Press' },
      { levelId: 20, route: 'Area/Pump' },
    ]);
  });
  it('keeps executions attached to the correct position and level for a shared master', () => {
    const result = builder.buildUserCiltResponse(
      { id: 3 } as never,
      [{ position: { id: 5, name: 'Position' } }] as never,
      [
        { ciltMstr: { id: 1 }, positionId: 5, levelId: 10 },
        { ciltMstr: { id: 1 }, positionId: 5, levelId: 20 },
      ] as never,
      [{ id: 2, ciltMstrId: 1 }] as never,
      [
        { id: 11, ciltSecuenceId: 2, levelId: 10, positionId: 5 },
        { id: 22, ciltSecuenceId: 2, levelId: 20, positionId: 5 },
      ] as never,
      paths,
    );
    expect(result.positions[0].ciltMasters).toMatchObject([
      {
        levelId: 10,
        route: 'Area/Press',
        sequences: [{ executions: [{ id: 11 }] }],
      },
      {
        levelId: 20,
        route: 'Area/Pump',
        sequences: [{ executions: [{ id: 22 }] }],
      },
    ]);
  });
});
