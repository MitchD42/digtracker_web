export interface GWD {
  gwd_id: number;
  gwd_number: number;
  afe_id?: number;
  system?: string;
  pipeline?: string;
  status: string;
  notes?: string;
  initial_budget: number;
  land_cost: number;
  dig_cost: number;
  b_sleeve: number;
  petro_sleeve: number;
  composite: number;
  recoat: number;
  created_date: string;
  // New fields
  execution_year?: number;
  dig_name?: string;
  inspection_provider?: string;
  ili_analysis?: string;
  dig_criteria?: string;
  inspection_start_relative?: number;
  inspection_end_relative?: number;
  inspection_length?: number;
  target_features?: string;
  smys?: number;
  mop?: number;
  design_factor?: number;
  class_location?: number;
  class_location_factor?: number;
  p_failure?: number;
  latitude?: number;
  longitude?: number;
  program_engineer?: string;
  program_engineer_comments?: string;
  project_engineer?: string;
  post_execution_comments?: string;
  last_updated?: string;
  created_by?: string;
  inspection_completion_date?: string;
  actual_inspection_start?: number;
  actual_inspection_start_relative?: number;
  actual_inspection_end_relative?: number;
  actual_inspection_length?: number;
} 