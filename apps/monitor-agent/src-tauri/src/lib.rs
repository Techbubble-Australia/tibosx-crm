mod agent;
mod config;
mod permissions;
mod store;

use agent::{AgentRuntime, AgentState};
use store::AgentStore;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, State,
};
use tokio::sync::Mutex;

struct AppState {
    runtime: Mutex<AgentRuntime>,
}

#[tauri::command]
async fn get_agent_state(state: State<'_, AppState>) -> Result<AgentState, String> {
    let runtime = state.runtime.lock().await;
    Ok(runtime.snapshot())
}

#[tauri::command]
async fn enroll(
    email: String,
    replace_existing: Option<bool>,
    state: State<'_, AppState>,
) -> Result<AgentState, String> {
    let mut runtime = state.runtime.lock().await;
    runtime
        .enroll(email, replace_existing.unwrap_or(false))
        .await?;
    // Token + email persisted to app data (credentials.json) inside enroll().
    let _ = runtime.refresh_permissions();
    let _ = runtime.start_background_loop();
    Ok(runtime.snapshot())
}

#[tauri::command]
async fn check_permissions(state: State<'_, AppState>) -> Result<AgentState, String> {
    let mut runtime = state.runtime.lock().await;
    runtime.refresh_permissions()?;
    Ok(runtime.snapshot())
}

#[tauri::command]
async fn start_monitoring_if_ready(state: State<'_, AppState>) -> Result<AgentState, String> {
    let mut runtime = state.runtime.lock().await;
    runtime.refresh_permissions()?;
    runtime.start_background_loop()?;
    Ok(runtime.snapshot())
}

#[tauri::command]
fn open_permission_settings() -> Result<(), String> {
    permissions::open_system_settings()
}

#[tauri::command]
fn hide_to_tray(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Menu-bar / tray agent only — do not appear in the macOS Dock.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let mut store = AgentStore::load().unwrap_or_else(|_| AgentStore::default());
            // Compile-time API URL always wins (hidden from the UI).
            let baked = config::baked_api_base_url();
            if !baked.is_empty() {
                store.api_base_url = baked;
                let _ = store.save();
            }
            let mut runtime = AgentRuntime::new(store);
            let _ = runtime.refresh_permissions();
            if runtime.can_start() {
                let _ = runtime.start_background_loop();
            }
            let snap = runtime.snapshot();
            // Show UI only for first enroll or when screen permission is still needed.
            let needs_setup_ui = !snap.enrolled || !snap.permission_granted;
            app.manage(AppState {
                runtime: Mutex::new(runtime),
            });

            let status_label = if snap.enrolled {
                match &snap.email {
                    Some(email) if !email.is_empty() => format!("Running · {email}"),
                    _ => "Running · enrolled".to_string(),
                }
            } else {
                "Not enrolled".to_string()
            };
            let status_i = MenuItem::with_id(app, "status", status_label, false, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Open window", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit TIBOSX Monitor", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&status_i, &show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("TIBOSX Monitor — click for status")
                // macOS: show text next to the icon so the agent is easy to spot in the menu bar.
                .title("TM")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        let handle = app.clone();
                        tauri::async_runtime::spawn(async move {
                            if let Some(state) = handle.try_state::<AppState>() {
                                let mut runtime = state.runtime.lock().await;
                                let _ = runtime.end_session().await;
                            }
                            handle.exit(0);
                        });
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Closing the window hides to the menu bar instead of quitting.
            if let Some(window) = app.get_webview_window("main") {
                let win = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win.hide();
                    }
                });

                // Already signed in + permissions OK → stay in menu bar only.
                // First-time enroll (or permission gate) → show the window.
                if needs_setup_ui {
                    let _ = window.show();
                    let _ = window.set_focus();
                } else {
                    let _ = window.hide();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_agent_state,
            enroll,
            check_permissions,
            start_monitoring_if_ready,
            open_permission_settings,
            hide_to_tray
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
