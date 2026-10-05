import { BadRequestException, ConflictException } from '@nestjs/common';
import { LevelEntity } from './entities/level.entity';

export const MAX_LEVEL_HIERARCHY_DEPTH = 1000;

export function normalizeLevelId(value: unknown, allowRoot = false): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < (allowRoot ? 0 : 1)) {
    throw new BadRequestException('Invalid level identifier');
  }
  return id;
}

export function visitHierarchyLevel(
  level: Pick<LevelEntity, 'id' | 'siteId'>,
  visited: Set<number>,
  siteId: number,
): void {
  const id = normalizeLevelId(level.id);
  if (
    Number(level.siteId) !== Number(siteId) ||
    visited.has(id) ||
    visited.size >= MAX_LEVEL_HIERARCHY_DEPTH
  ) {
    throw new ConflictException(
      'Level hierarchy contains a cycle, an invalid site or excessive depth',
    );
  }
  visited.add(id);
}

export function levelMapFrom(rows: LevelEntity[]): Map<number, LevelEntity> {
  return new Map(rows.map((row) => [normalizeLevelId(row.id), row]));
}

/** Returns the path from the requested node to the root. */
export function traceLevelHierarchy(
  id: number,
  levels: Map<number, LevelEntity>,
): LevelEntity[] {
  const path: LevelEntity[] = [];
  const visited = new Set<number>();
  let current = levels.get(normalizeLevelId(id));
  if (!current)
    throw new ConflictException('Level hierarchy has a missing node');
  const siteId = Number(current.siteId);
  while (current) {
    visitHierarchyLevel(current, visited, siteId);
    path.push(current);
    const parentId = normalizeLevelId(current.superiorId ?? 0, true);
    if (!parentId) break;
    current = levels.get(parentId);
    if (!current)
      throw new ConflictException('Level hierarchy has a missing parent');
  }
  return path;
}

/** Includes the root and all its descendants; never follows another site. */
export function collectLevelDescendants(
  id: number,
  levels: Map<number, LevelEntity>,
): number[] {
  const root = levels.get(normalizeLevelId(id));
  if (!root) throw new ConflictException('Level hierarchy has a missing node');
  const children = new Map<number, LevelEntity[]>();
  for (const level of levels.values()) {
    const parentId = normalizeLevelId(level.superiorId ?? 0, true);
    const siblings = children.get(parentId) ?? [];
    siblings.push(level);
    children.set(parentId, siblings);
  }
  const result: number[] = [];
  const visited = new Set<number>();
  const queue = [{ level: root, depth: 0 }];
  for (let index = 0; index < queue.length; index++) {
    const { level, depth } = queue[index];
    const levelId = normalizeLevelId(level.id);
    if (
      Number(level.siteId) !== Number(root.siteId) ||
      visited.has(levelId) ||
      depth >= MAX_LEVEL_HIERARCHY_DEPTH
    ) {
      throw new ConflictException(
        'Level hierarchy contains a cycle, an invalid site or excessive depth',
      );
    }
    visited.add(levelId);
    result.push(levelId);
    for (const child of children.get(levelId) ?? []) {
      queue.push({ level: child, depth: depth + 1 });
    }
  }
  return result;
}
