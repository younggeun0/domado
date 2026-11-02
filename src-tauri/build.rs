use std::env;
use std::path::PathBuf;
use std::process::Command;

fn main() {
    if env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("macos") {
        build_widget_bridge();
    }
    tauri_build::build()
}

fn xcrun(args: &[&str]) -> String {
    let out = Command::new("xcrun").args(args).output().expect("xcrun not found");
    assert!(out.status.success(), "xcrun {args:?} failed");
    String::from_utf8(out.stdout).unwrap().trim().to_string()
}

// swift/WidgetBridge.swift를 타깃 아키텍처별 정적 라이브러리로 만들어 링크한다
fn build_widget_bridge() {
    let src = "swift/WidgetBridge.swift";
    println!("cargo:rerun-if-changed={src}");
    println!("cargo:rerun-if-env-changed=MACOSX_DEPLOYMENT_TARGET");
    let out = PathBuf::from(env::var("OUT_DIR").unwrap());
    let arch = match env::var("CARGO_CFG_TARGET_ARCH").unwrap().as_str() {
        "aarch64" => "arm64".to_string(),
        other => other.to_string(),
    };
    let min = env::var("MACOSX_DEPLOYMENT_TARGET").unwrap_or_else(|_| "13.0".into());
    let status = Command::new("xcrun")
        .args(["swiftc", "-parse-as-library", "-emit-library", "-static", "-O", "-module-name", "WidgetBridge"])
        .args(["-target", &format!("{arch}-apple-macosx{min}"), src, "-o"])
        .arg(out.join("libwidget_bridge.a"))
        .status()
        .expect("swiftc not found");
    assert!(status.success(), "swiftc failed");

    let sdk = xcrun(&["--sdk", "macosx", "--show-sdk-path"]);
    let swiftc = PathBuf::from(xcrun(&["--find", "swiftc"]));
    let compat = swiftc.parent().unwrap().parent().unwrap().join("lib/swift/macosx");
    println!("cargo:rustc-link-search=native={}", out.display());
    println!("cargo:rustc-link-lib=static=widget_bridge");
    println!("cargo:rustc-link-search=native={sdk}/usr/lib/swift");
    println!("cargo:rustc-link-search=native={}", compat.display());
    println!("cargo:rustc-link-arg=-Wl,-rpath,/usr/lib/swift");
}
