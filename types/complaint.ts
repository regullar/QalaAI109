export type ComplaintPriority = "low" | "medium" | "high" | "critical";

export type ComplaintStatus =
  | "new"
  | "checking"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected";

export type Complaint = {
  id: string;
  public_id: string;
  user_id: string | null;

  raw_text: string;
  title: string;
  description: string | null;
  summary: string | null;

  category: string;
  subcategory: string | null;
  priority: ComplaintPriority;
  status: ComplaintStatus;

  district: string | null;
  address_text: string | null;
  latitude: number | null;
  longitude: number | null;
  location_text: string | null;
  location_lat: number | null;
  location_lng: number | null;

  responsible_service: string | null;
  appeal_text: string | null;
  risk_factors: string[] | null;
  ai_confidence: number | null;

  source: string;
  is_demo: boolean;
  needs_emergency_warning: boolean;

  created_at: string;
  updated_at: string;
};

export type StatusLog = {
  id: string;
  complaint_id: string;
  old_status: ComplaintStatus | null;
  new_status: ComplaintStatus;
  comment: string | null;
  created_at: string;
};

export type AnalyzeComplaintRequest = {
  text: string;
  district?: string;
  addressText?: string;
};

export type AnalyzeComplaintResponse = {
  title: string;
  category: string;
  subcategory: string;
  district: string;
  priority: ComplaintPriority;
  addressText: string;
  riskFactors: string[];
  summary: string;
  responsibleService: string;
  appealText: string;
  needsEmergencyWarning: boolean;
  confidence: number;
  source: "ai" | "fallback";
};
