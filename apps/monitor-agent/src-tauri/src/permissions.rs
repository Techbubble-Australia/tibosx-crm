use xcap::Monitor;

/// Probe whether screen capture works; return (granted, user-facing message).
pub fn check_screen_permission() -> (bool, String) {
    let ok = probe_capture();
    if ok {
        return (
            true,
            "Screen capture permission is granted.".to_string(),
        );
    }

    if cfg!(target_os = "macos") {
        (
            false,
            "macOS Screen Recording permission is required. Open System Settings → Privacy & Security → Screen Recording, enable TIBOSX Monitor, then click Check again.".to_string(),
        )
    } else if cfg!(target_os = "windows") {
        (
            false,
            "Screen capture failed on Windows. Close other security tools that block capture, then try again.".to_string(),
        )
    } else if cfg!(target_os = "linux") {
        (
            false,
            "Screen capture is unavailable. On Wayland, grant the portal screenshot prompt (xdg-desktop-portal). On X11, ensure your display server allows capture.".to_string(),
        )
    } else {
        (false, "Unsupported platform for screen capture.".to_string())
    }
}

fn probe_capture() -> bool {
    match Monitor::all() {
        Ok(monitors) => {
            let Some(monitor) = monitors.into_iter().next() else {
                return false;
            };
            match monitor.capture_image() {
                Ok(img) => img.width() > 0 && img.height() > 0,
                Err(_) => false,
            }
        }
        Err(_) => false,
    }
}

pub fn open_system_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "ms-settings:privacy"])
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg("settings://")
            .spawn();
        return Ok(());
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("Unsupported platform".into())
    }
}
