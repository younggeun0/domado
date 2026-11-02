import Foundation
import WidgetKit

// WidgetCenter는 Swift API뿐이라 정적 라이브러리로 묶어 Rust에서 C 함수로 부른다.
// 앱 프로세스 안에서 불러야 한다. 별도 실행 파일에서 부르면 ChronoCoreErrorDomain Code=10으로 거부된다
@_cdecl("dm_reload_widgets")
public func reloadWidgets() {
    WidgetCenter.shared.reloadAllTimelines()
}

// 컨테이너가 없으면 만든다. 돌려준 문자열은 호출한 쪽이 free로 지운다
@_cdecl("dm_group_container")
public func groupContainer(_ group: UnsafePointer<CChar>) -> UnsafeMutablePointer<CChar>? {
    FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: String(cString: group))
        .flatMap { strdup($0.path) }
}
