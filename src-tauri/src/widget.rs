use std::ffi::{c_char, c_void, CStr, CString};
use std::io;
use std::path::PathBuf;

// widget/DomadoWidget과 두 entitlements 파일이 같은 값을 쓴다
const APP_GROUP: &str = "TFLHLW3C9D.domado";

extern "C" {
    fn dm_reload_widgets();
    fn dm_group_container(group: *const c_char) -> *mut c_char;
    fn free(ptr: *mut c_void);
}

// App Group 권한은 위젯 확장을 넣은 배포 빌드에만 붙는다.
// 권한 없이 그룹 컨테이너를 건드리면 macOS가 허용 창을 띄우므로 tauri dev 같은 빌드에서는 아무것도 하지 않는다
fn container() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    if !exe.parent()?.parent()?.join("PlugIns/DomadoWidget.appex").is_dir() {
        return None;
    }
    let group = CString::new(APP_GROUP).ok()?;
    unsafe {
        let ptr = dm_group_container(group.as_ptr());
        if ptr.is_null() {
            return None;
        }
        let path = PathBuf::from(CStr::from_ptr(ptr).to_string_lossy().into_owned());
        free(ptr.cast());
        Some(path)
    }
}

// 위젯이 반쯤 쓴 파일을 읽지 않도록 옆에 쓰고 바꿔 끼운다
pub fn publish(state: &serde_json::Value) -> io::Result<()> {
    let Some(dir) = container() else { return Ok(()) };
    let tmp = dir.join("widget.json.tmp");
    std::fs::write(&tmp, state.to_string())?;
    std::fs::rename(&tmp, dir.join("widget.json"))?;
    unsafe { dm_reload_widgets() };
    Ok(())
}

// 앱이 꺼지면 타이머도 멈추므로 위젯이 지난 카운트다운을 이어 가지 않게 상태를 지운다. 다시 켜면 renderer가 새로 쓴다
pub fn clear() {
    let Some(dir) = container() else { return };
    let _ = std::fs::remove_file(dir.join("widget.json"));
    unsafe { dm_reload_widgets() };
}
