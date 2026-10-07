// Electron 메인 프로세스(src/main/index.ts)를 옮긴 Tauri 시험 구현. renderer는 src/renderer/tauriBridge.ts가
// window.electron 모양으로 감싸 같은 채널 이름의 커맨드를 부른다
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::atomic::{AtomicBool, Ordering};

use base64::Engine;
use tauri::image::Image;
use tauri::menu::{CheckMenuItem, Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, LogicalSize, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::ShortcutState;
use tauri_plugin_notification::NotificationExt;

// 위젯 최소 크기. Electron 앱과 같다
const WIDGET_MIN: (f64, f64) = (100.0, 200.0);
const TRAY_ID: &str = "main";

// 단순 전체화면 여부. Tauri는 조회 API가 없어 직접 들고 있는다
static FULLSCREEN: AtomicBool = AtomicBool::new(false);

fn main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("main")
}

// macOS 네이티브 전체화면은 별도 Space를 만들어 자식 창을 닫으면 검은 화면이 남으므로 단순 전체화면을 쓴다
#[tauri::command]
fn set_fullscreen(app: AppHandle, value: bool) {
    let Some(window) = main_window(&app) else { return };
    if FULLSCREEN.swap(value, Ordering::SeqCst) == value {
        return;
    }
    #[cfg(target_os = "macos")]
    let _ = window.set_simple_fullscreen(value);
    #[cfg(not(target_os = "macos"))]
    let _ = window.set_fullscreen(value);
}

#[tauri::command]
fn notify(app: AppHandle, title: String, body: String) {
    let _ = app.notification().builder().title(title).body(body).show();
}

fn default_tray_icon(app: &AppHandle) -> Option<Image<'static>> {
    let path = app.path().resource_dir().ok()?.join("icon_22x22.png");
    Image::from_path(path).ok()
}

// renderer가 그린 남은 시간 아이콘(PNG data URL). 없으면 기본 아이콘으로 되돌린다
#[tauri::command]
fn update_tray(app: AppHandle, image: Option<String>) {
    let Some(tray) = app.tray_by_id(TRAY_ID) else { return };
    let icon = image
        .and_then(|url| url.strip_prefix("data:image/png;base64,").map(str::to_owned))
        .and_then(|data| base64::engine::general_purpose::STANDARD.decode(data).ok())
        .and_then(|bytes| Image::from_bytes(&bytes).ok())
        .or_else(|| default_tray_icon(&app));
    let _ = tray.set_icon(icon);
}

#[tauri::command]
fn resize_widget(app: AppHandle, width: f64, height: f64) {
    let Some(window) = main_window(&app) else { return };
    if FULLSCREEN.load(Ordering::SeqCst) || !width.is_finite() || !height.is_finite() {
        return;
    }
    let _ = window.set_size(LogicalSize::new(width.round().max(WIDGET_MIN.0), height.round().max(WIDGET_MIN.1)));
}

#[tauri::command]
fn open_window(app: AppHandle, name: String) -> tauri::Result<()> {
    let (width, height) = match name.as_str() {
        "settings" => (384.0, 530.0),
        "history" => (420.0, 370.0),
        _ => return Ok(()),
    };
    if let Some(existing) = app.get_webview_window(&name) {
        return existing.set_focus();
    }

    let mut builder = WebviewWindowBuilder::new(&app, &name, WebviewUrl::App(format!("index.html#{name}").into()))
        .title("")
        .inner_size(width, height)
        .background_color(tauri::window::Color(0x17, 0x17, 0x17, 0xff));
    #[cfg(target_os = "macos")]
    {
        builder = builder.title_bar_style(tauri::TitleBarStyle::Overlay).hidden_title(true);
    }
    // 위젯이 항상 위에 떠 있어 부모로 묶어야 위젯 뒤로 가려지지 않는다
    if let Some(main) = main_window(&app) {
        builder = builder.parent(&main)?;
    }
    builder = builder.on_navigation(|url| url.scheme() == "tauri" || url.host_str() == Some("localhost"));
    builder.build()?;
    Ok(())
}

// 새 창으로 여는 링크는 기본 브라우저로 연다 (http/https만)
#[tauri::command]
fn open_external(app: AppHandle, url: String) {
    use tauri_plugin_opener::OpenerExt;
    if url.starts_with("https://") || url.starts_with("http://") {
        let _ = app.opener().open_url(url, None::<&str>);
    }
}

fn create_main_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    // E2E·수동 확인용 3초 타이머 (Electron의 DOMADO_FAST_TIMER와 같다)
    let fast_timer = std::env::var("DOMADO_FAST_TIMER").as_deref() == Ok("1");
    WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
        .title("domado")
        .inner_size(WIDGET_MIN.0, WIDGET_MIN.1)
        .min_inner_size(WIDGET_MIN.0, WIDGET_MIN.1)
        .transparent(true)
        .decorations(false)
        .shadow(false)
        .always_on_top(true)
        .accept_first_mouse(true)
        .initialization_script(format!("window.__DOMADO_FAST_TIMER__ = {fast_timer};"))
        .build()
}

fn show_main_window(app: &AppHandle) {
    match main_window(app) {
        Some(window) => {
            let _ = window.show();
        }
        None => {
            let _ = create_main_window(app);
        }
    }
}

fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let reload = MenuItem::with_id(app, "reload", "Reload", true, None::<&str>)?;
    let on_top = CheckMenuItem::with_id(app, "on_top", "Stick on top", true, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&reload, &on_top, &quit])?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "reload" => {
                if let Some(window) = main_window(app) {
                    let _ = window.eval("location.reload()");
                }
            }
            "on_top" => {
                if let Some(window) = main_window(app) {
                    let next = !window.is_always_on_top().unwrap_or(true);
                    let _ = window.set_always_on_top(next);
                    let _ = on_top.set_checked(next);
                }
            }
            "quit" => app.exit(0),
            _ => {}
        });
    if let Some(icon) = default_tray_icon(app) {
        builder = builder.icon(icon);
    }
    builder.build(app)?;
    Ok(())
}

// E2E가 창 상태(전체화면·크기·표시 여부)를 확인하는 커맨드. e2e feature 빌드에만 있다
#[cfg(feature = "e2e")]
#[tauri::command]
fn e2e_window_states(app: AppHandle) -> Vec<serde_json::Value> {
    app.webview_windows()
        .into_iter()
        .map(|(label, window)| {
            let scale = window.scale_factor().unwrap_or(1.0);
            let size = window.inner_size().map(|s| s.to_logical::<f64>(scale)).ok();
            serde_json::json!({
                "label": label,
                "visible": window.is_visible().unwrap_or(false),
                "fullScreen": label == "main" && FULLSCREEN.load(Ordering::SeqCst),
                "width": size.map(|s| s.width),
                "height": size.map(|s| s.height),
            })
        })
        .collect()
}

fn main() {
    let builder = tauri::Builder::default();
    #[cfg(feature = "e2e")]
    let builder = builder.plugin(tauri_plugin_wdio_webdriver::init());
    builder
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts(["super+shift+d"])
                .expect("valid shortcut")
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        show_main_window(app);
                        let _ = app.emit_to("main", "start_pomodoro", ());
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            set_fullscreen,
            notify,
            update_tray,
            resize_widget,
            open_window,
            open_external,
            #[cfg(feature = "e2e")]
            e2e_window_states
        ])
        .setup(|app| {
            create_main_window(app.handle())?;
            create_tray(app.handle())?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // 독 아이콘을 누르면 위젯을 다시 띄운다
            match event {
                tauri::RunEvent::Reopen { .. } => show_main_window(app),
                // macOS 관례대로 창을 모두 닫아도 트레이에 남는다 (트레이 Quit은 code가 있어 그대로 종료)
                #[cfg(target_os = "macos")]
                tauri::RunEvent::ExitRequested { code: None, api, .. } => api.prevent_exit(),
                _ => {}
            }
        });
}
