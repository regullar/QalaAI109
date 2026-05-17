import assert from "node:assert/strict";
import { buildComplaintClusters } from "../lib/cluster";
import type { Complaint } from "../types/complaint";

function complaint(overrides: Partial<Complaint>): Complaint {
  return {
    id: overrides.id || crypto.randomUUID(),
    public_id: overrides.public_id || `TEST-${Math.random().toString(36).slice(2, 8)}`,
    user_id: null,
    raw_text: overrides.raw_text || "Во дворе темно и не работают фонари.",
    title: overrides.title || "Не работает освещение",
    description: overrides.description || null,
    summary: overrides.summary || "Жители жалуются на отсутствие света во дворе.",
    category: overrides.category || "Уличное освещение",
    subcategory: overrides.subcategory || "Не работают фонари",
    priority: overrides.priority || "high",
    status: overrides.status || "new",
    district: overrides.district || "Аль-Фарабийский район",
    address_text: overrides.address_text || "мкр Нурсат, двор 12",
    latitude: overrides.latitude ?? 42.3438,
    longitude: overrides.longitude ?? 69.5886,
    location_text: overrides.location_text || overrides.address_text || "мкр Нурсат, двор 12",
    location_lat: overrides.location_lat ?? overrides.latitude ?? 42.3438,
    location_lng: overrides.location_lng ?? overrides.longitude ?? 69.5886,
    responsible_service: overrides.responsible_service || null,
    appeal_text: overrides.appeal_text || null,
    risk_factors: overrides.risk_factors || null,
    ai_confidence: overrides.ai_confidence ?? 0.82,
    source: overrides.source || "Web",
    is_demo: overrides.is_demo ?? false,
    needs_emergency_warning: overrides.needs_emergency_warning ?? false,
    created_at: overrides.created_at || "2026-05-17T10:00:00.000Z",
    updated_at: overrides.updated_at || "2026-05-17T10:00:00.000Z"
  };
}

function clusterSizes(complaints: Complaint[]) {
  return buildComplaintClusters(complaints)
    .map((cluster) => cluster.count)
    .sort((a, b) => b - a);
}

{
  const first = complaint({
    id: "c-1",
    public_id: "PUB-1",
    address_text: "мкр Нурсат, школа 12",
    raw_text: "Возле школы 12 вечером не горят фонари.",
    summary: "Не горит свет возле школы."
  });
  const second = complaint({
    id: "c-2",
    public_id: "PUB-2",
    address_text: "Нурсат, рядом со школой №12",
    latitude: 42.3441,
    longitude: 69.5889,
    raw_text: "Около школы №12 снова темно, фонари не работают.",
    summary: "Темный участок возле школы."
  });

  assert.deepEqual(
    clusterSizes([first, second]),
    [2],
    "Nearby complaints with the same issue should cluster even if the address text differs."
  );
}

{
  const first = complaint({
    id: "c-3",
    public_id: "PUB-3",
    address_text: "мкр Самал, дом 8",
    latitude: 42.3372,
    longitude: 69.6011,
    category: "Уличное освещение"
  });
  const second = complaint({
    id: "c-4",
    public_id: "PUB-4",
    address_text: "мкр Самал, дом 8",
    latitude: 42.3572,
    longitude: 69.6311,
    category: "Уличное освещение",
    raw_text: "Не работает освещение на другом конце района."
  });

  assert.deepEqual(
    clusterSizes([first, second]),
    [1, 1],
    "Complaints with the same address label but far coordinates should not be merged."
  );
}

{
  const first = complaint({
    id: "c-5",
    public_id: "PUB-5",
    category: "Уличное освещение",
    address_text: "мкр Нурсат, дом 4"
  });
  const second = complaint({
    id: "c-6",
    public_id: "PUB-6",
    category: "Безопасность",
    subcategory: "Подозрительная активность",
    raw_text: "Во дворе подозрительные люди ночью.",
    summary: "Жители сообщают о проблеме безопасности.",
    title: "Проблема безопасности",
    address_text: "мкр Нурсат, дом 4"
  });

  assert.deepEqual(
    clusterSizes([first, second]),
    [1, 1],
    "Different categories at the same address should stay in separate clusters."
  );
}

console.log("duplicate matching checks passed");
