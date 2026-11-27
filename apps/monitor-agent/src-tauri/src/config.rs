/// API base URL baked in at compile time via `MONITOR_API_URL`.
/// Example: `MONITOR_API_URL=https://api-staging-79b42177.up.railway.app cargo tauri build`
pub fn baked_api_base_url() -> String {
    if let Some(url) = option_env!("MONITOR_API_URL") {
        let trimmed = url.trim().trim_end_matches('/');
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }
    // Dev convenience only — release builds must set MONITOR_API_URL.
    if cfg!(debug_assertions) {
        return "http://localhost:3001".to_string();
    }
    String::new()
}
