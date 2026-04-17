use serde::Serialize;
use std::net::IpAddr;

#[derive(Serialize, Clone)]
pub struct NetInterface {
    name: String,
    ip: String,
    is_ipv4: bool,
}

#[tauri::command]
fn get_interfaces() -> Vec<NetInterface> {
    let Ok(addrs) = if_addrs::get_if_addrs() else {
        return vec![];
    };

    addrs
        .into_iter()
        .filter(|iface| {
            if iface.is_loopback() {
                return false;
            }
            matches!(iface.addr.ip(), IpAddr::V4(_))
        })
        .map(|iface| NetInterface {
            name: iface.name,
            ip: iface.addr.ip().to_string(),
            is_ipv4: matches!(iface.addr.ip(), IpAddr::V4(_)),
        })
        .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_interfaces])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
