export interface AnalyticsCounters {
  // Acesso
  pageview: number;
  unique_daily_view: number;
  extraction_page_view: number;
  palitos_page_view: number;
  cadsig_tools_page_view: number;
  about_page_view: number;
  changelog_page_view: number;

  // Dados de sondagem
  extract_preview: number;
  export_json: number;
  export_excel: number;
  export_csv: number;
  export_leapfrog_zip: number;
  export_leapfrog_collar: number;
  export_leapfrog_nspt: number;
  export_leapfrog_na: number;
  export_leapfrog_geology: number;
  export_leapfrog_interp: number;
  export_ags: number;
  extraction_presets_view: number;
  extraction_presets_load: number;
  extraction_presets_save: number;
  extraction_presets_download: number;
  extraction_presets_import: number;
  extraction_map_view: number;
  extraction_map_insert_data: number;
  extraction_map_export: number;
  extraction_exclude_page_open: number;
  extraction_exclude_page_use: number;

  // Palitos
  generate_dxf_count: number;
  generate_dxf_sondagens: number;
  extracted_data_to_palito: number;
  leapfrog_to_palito: number;

  // Ferramentas CAD/SIG
  dxf_tools_view: number;
  dxf_tools_save_dxf: number;
  dxf_tools_save_xlsx: number;
  dxf_tools_save_kml: number;
  dxf_tools_save_kmz: number;
  distance_tool_view: number;
  distance_tool_save: number;
  distance_tool_calculate: number;
  kml_to_xlsx_view: number;
  kml_to_xlsx_save: number;
  xlsx_to_dxf_profile_view: number;
  xlsx_to_dxf_profile_save: number;
  xlsx_to_kml_view: number;
  xlsx_to_kml_save_kmz: number;
  xlsx_to_kml_save_kml: number;
  cadsig_open_templates: number;

  cadsig_total_uses: number;

  // dxf_tools: number;
  // distance_tool: number;
  // xlsx_to_kml: number;
  // xlsx_to_dxf_profile: number;
  // kml_to_xlsx: number;
}

export type AnalyticsEvent = keyof AnalyticsCounters;
