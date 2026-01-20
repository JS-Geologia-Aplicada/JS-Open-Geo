export interface AnalyticsCounters {
  // Acesso
  pageview: number;

  // Visualização
  extract_preview: number;

  // Exports básicos
  export_json: number;
  export_excel: number;
  export_csv: number;

  // Exports Leapfrog
  export_leapfrog_zip: number;
  export_leapfrog_collar: number;
  export_leapfrog_nspt: number;
  export_leapfrog_na: number;
  export_leapfrog_geology: number;
  export_leapfrog_interp: number;

  // AGS
  export_ags: number;

  // Palitos
  generate_dxf_count: number;
  generate_dxf_sondagens: number;

  // Ferramentas CAD/SIG
  dxf_tools: number;
  distance_tool: number;
  kml_to_xlsx: number;
  xlsx_to_dxf_profile: number;
  xlsx_to_kml: number;
}

export type AnalyticsEvent = keyof AnalyticsCounters;
