/** Моковые данные избранных проектов для главной страницы.
 *  `id` совпадает со slug'ом проекта в БД — ссылка ведёт на /portfolio/[slug].
 *  Показываются, только пока архив пуст; затем — реальные проекты из БД. */
export interface Project {
  id: string;
  title: string;
  category: string;
  year: number;
  location: string;
  description: string;
  cover: string;
}

export const FEATURED_PROJECTS: Project[] = [
  {
    id: "silence-of-the-city",
    title: "Тишина города",
    category: "Улица",
    year: 2025,
    location: "Москва",
    description:
      "Ночные улицы, дождь и неон. Город, который говорит шёпотом, — снят за один январский вечер.",
    cover:
      "https://image.qwenlm.ai/generated-images/63cfecc5-6791-4b6d-9663-2a53c23d3f09/_result.png",
  },
  {
    id: "concrete-and-light",
    title: "Бетон и свет",
    category: "Архитектура",
    year: 2023,
    location: "Берлин",
    description:
      "Бетон, ритм окон и одна диагональная тень на весь фасад. Серия о брутализме, который умеет молчать.",
    cover:
      "https://image.qwenlm.ai/generated-images/15568a51-ea75-4743-8ed9-bf276d983e75/_result.png",
  },
  {
    id: "northern-thaw",
    title: "Север. Оттепель",
    category: "Пейзаж",
    year: 2023,
    location: "Кавказ",
    description:
      "Хребты в тумане на рассвете. Тишина, пойманная на длинной выдержке, — и ни одного лишнего кадра.",
    cover:
      "https://image.qwenlm.ai/generated-images/e9fd5f54-7555-4ba4-b69f-39ec8c44f1f5/_result.png",
  },
];
