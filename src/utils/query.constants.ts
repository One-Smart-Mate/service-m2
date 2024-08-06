export const QUERY_CONSTANTS = {
  findSiteCardsGroupedByPreclassifier: `
      CONCAT(card.preclassifier_code, ' ', card.preclassifier_description) AS preclassifier,
      card.cardType_methodology_name AS methodology,
      COUNT(*) AS totalCards
    `,
  findSiteCardsGroupedByMethodology: `
      card.cardType_methodology_name AS methodology,
      COUNT(*) AS totalCards
    `,
  findSiteCardsGroupedByArea: `
      area_name AS area,
      COUNT(*) AS totalCards
    `,
  findSiteCardsGroupedByCreator: `
      creator_name AS creator,
      COUNT(*) AS totalCards
    `,
  findSiteCardsGroupedByWeeks: `
      YEAR(card.created_at) AS year,
      WEEK(card.created_at, 1) AS week,
      COUNT(*) AS issued,
      SUM(IF(card.user_definitive_solution_id IS NOT NULL, 1, 0)) AS eradicated
    `,
};
