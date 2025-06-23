export const QUERY_CONSTANTS = {
  findSiteCardsGroupedByPreclassifier: `
        CONCAT(card.preclassifier_code, ' ', card.preclassifier_description) AS preclassifier,
  COUNT(*) AS totalCards,
  card.cardType_name AS methodology,
  card.cardType_color AS color
    `,
  findSiteCardsGroupedByMethodology: `
      card.cardType_name AS methodology,
      cardType_color as color,
      COUNT(*) AS totalCards
    `,
  findSiteCardsGroupedByArea: `
      area_name AS area,
      COUNT(*) AS totalCards,
      cardType_name AS cardTypeName
    `,
  findSiteCardsGroupedByAreaMore: `
      area_name AS area,
      area_id AS areaId,
      COUNT(*) AS totalCards,
      cardType_name AS cardTypeName
    `,
  findSiteCardsGroupedByMachine: `
      node_name AS nodeName,
      card_location as location,
      COUNT(*) AS totalCards,
      cardType_name AS cardTypeName
    `,
  findSiteCardsGroupedByCreator: `
      creator_name AS creator,
      COUNT(*) AS totalCards,
      cardType_name AS cardTypeName
    `,
    findSiteCardsGroupedByMechanic: `
    mechanic_name AS mechanic,
    COUNT(*) AS totalCards,
    cardType_name AS cardTypeName
  `,
  findSiteCardsGroupedByDefinitiveUser: `
    user_definitive_solution_name AS definitiveUser,
    COUNT(*) AS totalCards,
    cardType_name AS cardTypeName
  `,
  findSiteCardsGroupedByWeeks: `
      YEAR(card.created_at) AS year,
      WEEK(card.created_at, 1) AS week,
      COUNT(*) AS issued,
      SUM(IF(card.user_definitive_solution_id IS NOT NULL, 1, 0)) AS eradicated
    `,
  findSiteDiscardedCardsGroupedByUser: `
    responsable_name as responsibleName,
    adr.discard_reason as discardReason,
    card.cardType_name as cardTypeName,
    COUNT(*) AS totalCards
  `,
};
