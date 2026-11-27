use crate::config;
use crate::permissions;
use crate::store::AgentStore;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use xcap::Monitor;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentState {
    pub enrolled: bool,
    pub email: Option<String>,
    pub api_base_url: String,
    pub permission_granted: bool,
    pub permission_message: String,
    pub monitoring_active: bool,
    pub enabled: bool,
    pub capture_interval_seconds: u64,
    pub last_error: Option<String>,
}

pub struct AgentRuntime {
    store: AgentStore,
    permission_granted: bool,
    permission_message: String,
    monitoring_active: Arc<AtomicBool>,
    enabled: bool,
    capture_interval_seconds: u64,
    last_error: Option<String>,
    loop_started: bool,
}

#[derive(Debug, Deserialize)]
struct EnrollResponse {
    data: EnrollData,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EnrollData {
    token: String,
    device_id: String,
    email: String,
    enabled: bool,
    capture_interval_seconds: u64,
}

#[derive(Debug, Deserialize)]
struct ConfigResponse {
    data: ConfigData,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConfigData {
    enabled: bool,
    capture_interval_seconds: u64,
}

impl AgentRuntime {
    pub fn new(store: AgentStore) -> Self {
        Self {
            store,
            permission_granted: false,
            permission_message: String::new(),
            monitoring_active: Arc::new(AtomicBool::new(false)),
            enabled: false,
            capture_interval_seconds: 300,
            last_error: None,
            loop_started: false,
        }
    }

    pub fn snapshot(&self) -> AgentState {
        AgentState {
            enrolled: self.store.token.is_some(),
            email: self.store.email.clone(),
            api_base_url: self.store.api_base_url.clone(),
            permission_granted: self.permission_granted,
            permission_message: self.permission_message.clone(),
            monitoring_active: self.monitoring_active.load(Ordering::Relaxed),
            enabled: self.enabled,
            capture_interval_seconds: self.capture_interval_seconds,
            last_error: self.last_error.clone(),
        }
    }

    pub fn can_start(&self) -> bool {
        self.store.token.is_some() && self.permission_granted
    }

    pub fn refresh_permissions(&mut self) -> Result<(), String> {
        let (ok, msg) = permissions::check_screen_permission();
        self.permission_granted = ok;
        self.permission_message = msg;
        Ok(())
    }

    pub async fn enroll(&mut self, email: String, replace_existing: bool) -> Result<(), String> {
        let api_base_url = {
            let baked = config::baked_api_base_url();
            if !baked.is_empty() {
                baked
            } else if !self.store.api_base_url.trim().is_empty() {
                self.store.api_base_url.trim().trim_end_matches('/').to_string()
            } else {
                return Err(
                    "This build has no API URL. Rebuild with MONITOR_API_URL=https://your-api.example.com"
                        .into(),
                );
            }
        };

        let platform = current_platform();
        let device_name = hostname::get()
            .ok()
            .and_then(|h| h.into_string().ok())
            .unwrap_or_else(|| "unknown-device".to_string());

        let client = reqwest::Client::new();
        let url = format!("{}/api/monitor/enroll", api_base_url.trim_end_matches('/'));
        let res = client
            .post(url)
            .json(&serde_json::json!({
                "email": email,
                "deviceName": device_name,
                "platform": platform,
                "replaceExisting": replace_existing,
            }))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status = res.status();
        let body = res.text().await.map_err(|e| e.to_string())?;
        if !status.is_success() {
            // Pass structured 409 JSON through so the UI can show a replace warning.
            if status.as_u16() == 409 {
                return Err(body);
            }
            let msg = serde_json::from_str::<serde_json::Value>(&body)
                .ok()
                .and_then(|v| v.get("error").and_then(|e| e.as_str()).map(|s| s.to_string()))
                .unwrap_or_else(|| body);
            return Err(msg);
        }
        let parsed: EnrollResponse = serde_json::from_str(&body).map_err(|e| e.to_string())?;
        self.store.api_base_url = api_base_url;
        self.store.token = Some(parsed.data.token);
        self.store.device_id = Some(parsed.data.device_id);
        self.store.email = Some(parsed.data.email);
        self.enabled = parsed.data.enabled;
        self.capture_interval_seconds = parsed.data.capture_interval_seconds.max(60);
        self.store.save()?;
        self.last_error = None;
        Ok(())
    }

    pub fn start_background_loop(&mut self) -> Result<(), String> {
        if !self.can_start() {
            return Err(if self.store.token.is_none() {
                "Not enrolled".into()
            } else {
                self.permission_message.clone()
            });
        }
        if self.loop_started {
            return Ok(());
        }
        self.loop_started = true;
        self.monitoring_active.store(true, Ordering::Relaxed);

        let token = self.store.token.clone().unwrap();
        let api = self.store.api_base_url.clone();
        let active = self.monitoring_active.clone();
        let mut interval_secs = self.capture_interval_seconds.max(60);

        tauri::async_runtime::spawn(async move {
            let client = reqwest::Client::new();
            let mut last_capture = std::time::Instant::now() - Duration::from_secs(interval_secs);
            let mut last_config = std::time::Instant::now() - Duration::from_secs(300);
            // Wall clock — Instant may pause during laptop sleep; SystemTime still jumps.
            let mut last_wall = std::time::SystemTime::now();
            let mut enabled = true;

            while active.load(Ordering::Relaxed) {
                let now_wall = std::time::SystemTime::now();
                if let Ok(gap) = now_wall.duration_since(last_wall) {
                    // Laptop slept / process suspended. Don't end the session with "now"
                    // (that would count sleep as online); the next heartbeat asks the API
                    // to close the old session at lastHeartbeat and open a new one.
                    if gap > Duration::from_secs(90) {
                        last_capture = std::time::Instant::now() - Duration::from_secs(interval_secs);
                        last_config = std::time::Instant::now() - Duration::from_secs(300);
                    }
                }
                last_wall = now_wall;

                if last_config.elapsed() >= Duration::from_secs(120) {
                    if let Ok(cfg) = fetch_config(&client, &api, &token).await {
                        enabled = cfg.enabled;
                        interval_secs = cfg.capture_interval_seconds.max(60);
                    }
                    last_config = std::time::Instant::now();
                }

                let _ = post_heartbeat(&client, &api, &token).await;

                if enabled && last_capture.elapsed() >= Duration::from_secs(interval_secs) {
                    match capture_png_bytes() {
                        Ok((bytes, w, h)) => {
                            let _ = upload_screenshot(&client, &api, &token, bytes, w, h).await;
                        }
                        Err(err) => {
                            eprintln!("[monitor-agent] capture failed: {err}");
                        }
                    }
                    last_capture = std::time::Instant::now();
                }

                tokio::time::sleep(Duration::from_secs(15)).await;
            }
        });

        Ok(())
    }

    pub async fn end_session(&mut self) -> Result<(), String> {
        self.monitoring_active.store(false, Ordering::Relaxed);
        if let Some(token) = &self.store.token {
            let client = reqwest::Client::new();
            let url = format!(
                "{}/api/monitor/session/end",
                self.store.api_base_url.trim_end_matches('/')
            );
            let _ = client
                .post(url)
                .bearer_auth(token)
                .send()
                .await;
        }
        Ok(())
    }
}

fn current_platform() -> &'static str {
    if cfg!(target_os = "macos") {
        "darwin"
    } else if cfg!(target_os = "windows") {
        "win32"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    }
}

async fn fetch_config(
    client: &reqwest::Client,
    api: &str,
    token: &str,
) -> Result<ConfigData, String> {
    let url = format!("{}/api/monitor/config", api.trim_end_matches('/'));
    let res = client
        .get(url)
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("config status {}", res.status()));
    }
    let parsed: ConfigResponse = res.json().await.map_err(|e| e.to_string())?;
    Ok(parsed.data)
}

async fn post_heartbeat(client: &reqwest::Client, api: &str, token: &str) -> Result<(), String> {
    let url = format!("{}/api/monitor/heartbeat", api.trim_end_matches('/'));
    let res = client
        .post(url)
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("heartbeat status {}", res.status()));
    }
    Ok(())
}

fn capture_png_bytes() -> Result<(Vec<u8>, u32, u32), String> {
    use image::ImageEncoder;
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors
        .into_iter()
        .next()
        .ok_or_else(|| "No monitors found".to_string())?;
    let image = monitor.capture_image().map_err(|e| e.to_string())?;
    let width = image.width();
    let height = image.height();
    let mut out = Cursor::new(Vec::new());
    image::codecs::png::PngEncoder::new(&mut out)
        .write_image(
            image.as_raw(),
            width,
            height,
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| e.to_string())?;
    Ok((out.into_inner(), width, height))
}

async fn upload_screenshot(
    client: &reqwest::Client,
    api: &str,
    token: &str,
    bytes: Vec<u8>,
    width: u32,
    height: u32,
) -> Result<(), String> {
    let url = format!("{}/api/monitor/screenshot", api.trim_end_matches('/'));
    let part = reqwest::multipart::Part::bytes(bytes)
        .file_name("screenshot.png")
        .mime_str("image/png")
        .map_err(|e| e.to_string())?;
    let form = reqwest::multipart::Form::new()
        .part("image", part)
        .text("width", width.to_string())
        .text("height", height.to_string())
        .text("capturedAt", chrono::Utc::now().to_rfc3339());
    let res = client
        .post(url)
        .bearer_auth(token)
        .multipart(form)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        let body = res.text().await.unwrap_or_default();
        return Err(body);
    }
    Ok(())
}
