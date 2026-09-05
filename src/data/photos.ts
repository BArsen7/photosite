/** Жанры съёмки — единый источник правды для фильтров, тикера и услуг. */
export type Genre = "street" | "portrait" | "architecture" | "still" | "landscape";

export interface GenreMeta {
  id: Genre;
  en: string;
  ru: string;
}

export const GENRES: GenreMeta[] = [
  { id: "street",       en: "Street",       ru: "Улица" },
  { id: "portrait",     en: "Portrait",     ru: "Портрет" },
  { id: "architecture", en: "Architecture", ru: "Архитектура" },
  { id: "still",        en: "Still Life",   ru: "Натюрморт" },
  { id: "landscape",    en: "Landscape",    ru: "Пейзаж" },
];

export interface Photo {
  id: string;
  src: string;
  alt: string;
  title: string;
  genre: Genre;
  location: string;
  year: number;
  /* EXIF — показывается в лайтбоксе и при наведении */
  camera: string;
  lens: string;
  aperture: string;
  shutter: string;
  iso: number;
  /** CSS aspect-ratio, например '4/5' — держит сетку стабильной до загрузки */
  ratio: string;
}

export const PHOTOS: Photo[] = [
  {
    id: "fr-01",
    src: "https://image.qwenlm.ai/generated-images/63cfecc5-6791-4b6d-9663-2a53c23d3f09/_result.png",
    alt: "Ночная улица в дождь, фигура с прозрачным зонтом, неон в лужах",
    title: "Неглинная, дождь",
    genre: "street",
    location: "Москва",
    year: 2024,
    camera: "Leica M6",
    lens: "Summicron 35mm ƒ/2",
    aperture: "2.0",
    shutter: "1/60",
    iso: 1600,
    ratio: "16/9",
  },
  {
    id: "fr-02",
    src: "https://image.qwenlm.ai/generated-images/269b7153-48c5-4ebd-b2c8-92cd611180fd/_result.png",
    alt: "Чёрно-белый портрет пожилого мужчины с глубокими морщинами",
    title: "Портрет №7. Виктор",
    genre: "portrait",
    location: "Москва",
    year: 2022,
    camera: "Hasselblad 500 C/M",
    lens: "Planar 80mm ƒ/2.8",
    aperture: "4.0",
    shutter: "1/125",
    iso: 100,
    ratio: "4/5",
  },
  {
    id: "fr-03",
    src: "https://image.qwenlm.ai/generated-images/15568a51-ea75-4743-8ed9-bf276d983e75/_result.png",
    alt: "Бетонный фасад с ритмичной сеткой окон и диагональной тенью",
    title: "Ритм №4",
    genre: "architecture",
    location: "Берлин",
    year: 2023,
    camera: "Fujifilm GFX 50S II",
    lens: "GF 45mm ƒ/2.8",
    aperture: "8.0",
    shutter: "1/500",
    iso: 100,
    ratio: "1/1",
  },
  {
    id: "fr-04",
    src: "https://image.qwenlm.ai/generated-images/e9fd5f54-7555-4ba4-b69f-39ec8c44f1f5/_result.png",
    alt: "Горные хребты в тумане на рассвете, сине-серая палитра",
    title: "Хребет в тумане",
    genre: "landscape",
    location: "Кавказ",
    year: 2023,
    camera: "Fujifilm GFX 50S II",
    lens: "GF 45mm ƒ/2.8",
    aperture: "11",
    shutter: "1/8",
    iso: 100,
    ratio: "16/10",
  },
  {
    id: "fr-05",
    src: "https://image.qwenlm.ai/generated-images/c6cd588e-b7ed-4c86-aab2-ec9932a27cb4/_result.png",
    alt: "Пешеходы на зебре сверху, резкие тени полуденного солнца",
    title: "Зебра, полдень",
    genre: "street",
    location: "Тбилиси",
    year: 2023,
    camera: "Ricoh GR III",
    lens: "GR 28mm ƒ/2.8",
    aperture: "8.0",
    shutter: "1/1000",
    iso: 100,
    ratio: "4/5",
  },
  {
    id: "fr-06",
    src: "https://image.qwenlm.ai/generated-images/b12f60e9-3593-4960-b5b1-70454943ce78/_result.png",
    alt: "Тёмный натюрморт: виноград, лимон и керамический кувшин",
    title: "Натюрморт с лимоном",
    genre: "still",
    location: "Студия",
    year: 2024,
    camera: "Hasselblad 500 C/M",
    lens: "Macro Planar 120mm ƒ/4",
    aperture: "8.0",
    shutter: "1/250",
    iso: 100,
    ratio: "4/5",
  },
  {
    id: "fr-07",
    src: "https://image.qwenlm.ai/generated-images/345fadf0-3e2f-488e-b607-9c034bd6d7e1/_result.png",
    alt: "Спиральная лестница снизу, концентрические круги, свет из фонаря",
    title: "Спираль",
    genre: "architecture",
    location: "Москва",
    year: 2021,
    camera: "Leica M6",
    lens: "Elmarit 28mm ƒ/2.8",
    aperture: "5.6",
    shutter: "1/30",
    iso: 400,
    ratio: "4/5",
  },
  {
    id: "fr-08",
    src: "https://image.qwenlm.ai/generated-images/e49e5f96-4965-433a-99b7-96de57b71195/_result.png",
    alt: "Девушка у окна в мягком дневном свете, плёночные тона",
    title: "Аня, свет из окна",
    genre: "portrait",
    location: "Санкт-Петербург",
    year: 2024,
    camera: "Fujifilm GFX 50S II",
    lens: "GF 110mm ƒ/2",
    aperture: "2.8",
    shutter: "1/250",
    iso: 200,
    ratio: "4/5",
  },
  {
    id: "fr-09",
    src: "https://image.qwenlm.ai/generated-images/8c5d739f-7c50-43a0-aa4f-b1b9c93fc230/_result.png",
    alt: "Минималистичный натюрморт со стеклянными сосудами и сухоцветом",
    title: "Стекло, полдень",
    genre: "still",
    location: "Студия",
    year: 2025,
    camera: "Fujifilm GFX 50S II",
    lens: "GF 120mm ƒ/4 Macro",
    aperture: "11",
    shutter: "1/250",
    iso: 100,
    ratio: "1/1",
  },
  {
    id: "fr-10",
    src: "https://image.qwenlm.ai/generated-images/6e1de98d-d2b4-4e9c-80a9-134679fe85c2/_result.png",
    alt: "Гребень песчаной дюны, одинокая фигура на границе света и тени",
    title: "Дюна и фигура",
    genre: "landscape",
    location: "Руб-эль-Хали",
    year: 2025,
    camera: "Leica Q3",
    lens: "Summilux 28mm ƒ/1.7",
    aperture: "8.0",
    shutter: "1/1000",
    iso: 100,
    ratio: "16/10",
  },
];
