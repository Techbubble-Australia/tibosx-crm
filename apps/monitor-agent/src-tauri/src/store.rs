use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AgentStore {
    pub api_base_url: String,
    pub token: Option<String>,
    pub device_id: Option<String>,
    pub email: Option<String>,
}

impl AgentStore {
    fn path() -> Result<PathBuf, String> {
        let dir = dirs::data_dir()
            .ok_or_else(|| "Could not resolve app data directory".to_string())?
            .join("tibosx-monitor-agent");
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        Ok(dir.join("credentials.json"))
    }

    pub fn load() -> Result<Self, String> {
        let path = Self::path()?;
        if !path.exists() {
            return Ok(Self::default());
        }
        let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
        serde_json::from_str(&raw).map_err(|e| e.to_string())
    }

    pub fn save(&self) -> Result<(), String> {
        let path = Self::path()?;
        let raw = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(path, raw).map_err(|e| e.to_string())
    }
}
