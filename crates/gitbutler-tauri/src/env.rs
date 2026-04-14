#[cfg(debug_assertions)]
#[tauri::command(async)]
pub fn env_vars() -> std::collections::BTreeMap<String, String> {
    std::env::vars().collect()
}

#[tauri::command(async)]
pub fn read_file_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}
