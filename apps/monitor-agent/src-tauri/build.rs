fn main() {
    // Rebuild when the bake-in API URL changes.
    println!("cargo:rerun-if-env-changed=MONITOR_API_URL");
    tauri_build::build()
}
