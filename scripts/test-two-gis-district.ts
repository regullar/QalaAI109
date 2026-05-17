import { extractDistrictFromTwoGisItems } from "../lib/locations";

const district = extractDistrictFromTwoGisItems([
  {
    adm_div: [
      { type: "adm_div.country", name: "Казахстан" },
      { type: "adm_div.city", name: "Шымкент" },
      { type: "adm_div.district", name: "Аль-Фарабийский район" }
    ]
  }
]);

if (district !== "Аль-Фарабийский район") {
  throw new Error(`Expected Аль-Фарабийский район, received ${String(district)}`);
}

const turan = extractDistrictFromTwoGisItems([
  {
    adm_div: [
      { type: "adm_div.city", name: "Шымкент" },
      { type: "adm_div.district", name: "Туранский район" }
    ]
  }
]);

if (turan !== "район Тұран") {
  throw new Error(`Expected район Тұран, received ${String(turan)}`);
}
