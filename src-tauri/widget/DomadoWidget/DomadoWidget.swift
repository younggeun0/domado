import SwiftUI
import WidgetKit

// 앱(src/renderer/hooks/usePomodoroTimer.ts → src-tauri/src/widget.rs)이 App Group 폴더에 쓰는 타이머 상태. endsAt이 있으면 실행 중이다
struct TimerState: Codable {
    enum Phase: String, Codable { case focus, rest }

    var phase: Phase
    var endsAt: Double?
    var remaining: Int
    var duration: Int
    var count: Int
    var date: String

    static let idle = TimerState(phase: .focus, endsAt: nil, remaining: 25 * 60, duration: 25 * 60, count: 0, date: "")

    static func load() -> TimerState {
        guard
            let url = FileManager.default
                .containerURL(forSecurityApplicationGroupIdentifier: "TFLHLW3C9D.domado")?
                .appendingPathComponent("widget.json"),
            let data = try? Data(contentsOf: url),
            let state = try? JSONDecoder().decode(TimerState.self, from: data)
        else { return .idle }
        return state
    }

    var endDate: Date? { endsAt.map { Date(timeIntervalSince1970: $0 / 1000) } }

    // 자정이 지나 앱이 아직 쓰지 않았으면 어제 개수를 보여주지 않는다
    var todayCount: Int {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date()) == date ? count : 0
    }
}

struct Entry: TimelineEntry {
    let date: Date
    let state: TimerState
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> Entry { Entry(date: Date(), state: .idle) }

    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        completion(Entry(date: Date(), state: TimerState.load()))
    }

    // 실행 중 카운트다운은 Text(timerInterval:)가 스스로 줄인다. 상태가 바뀌면 앱이 다시 불러오게 한다
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let state = TimerState.load()
        var entries = [Entry(date: Date(), state: state)]
        if let end = state.endDate, end > Date() {
            var finished = state
            finished.endsAt = nil
            finished.remaining = 0
            entries.append(Entry(date: end, state: finished))
        }
        completion(Timeline(entries: entries, policy: .never))
    }
}

struct DomadoWidgetView: View {
    let entry: Entry

    var body: some View {
        let state = entry.state
        let tint: Color = state.phase == .rest ? .brown : .red
        let running = state.endDate.map { $0 > entry.date } ?? false
        VStack(spacing: 6) {
            HStack {
                Image(systemName: state.phase == .rest ? "cup.and.saucer.fill" : "timer")
                    .foregroundStyle(tint)
                Spacer()
                if !running {
                    Image(systemName: "pause.fill").foregroundStyle(.secondary)
                }
            }
            .font(.headline)

            Spacer(minLength: 0)

            Group {
                if running, let end = state.endDate {
                    Text(timerInterval: entry.date...end, countsDown: true)
                } else {
                    Text(Self.format(state.remaining))
                }
            }
            .font(.system(size: 34, weight: .semibold, design: .rounded))
            .monospacedDigit()
            .multilineTextAlignment(.center)
            .minimumScaleFactor(0.6)

            Spacer(minLength: 0)

            HStack(spacing: 8) {
                progress(state, running: running)
                    .progressViewStyle(.linear)
                    .tint(tint)
                Text("🍅 \(state.todayCount)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize()
            }
        }
        .widgetBackground()
    }

    // 실행 중이면 숫자처럼 새로고침 없이 스스로 차오른다
    @ViewBuilder
    func progress(_ state: TimerState, running: Bool) -> some View {
        let total = Double(max(state.duration, 1))
        if running, let end = state.endDate {
            ProgressView(timerInterval: end.addingTimeInterval(-total)...end, countsDown: false) {
                EmptyView()
            } currentValueLabel: {
                EmptyView()
            }
        } else {
            ProgressView(value: min(total, max(0, total - Double(state.remaining))), total: total)
        }
    }

    static func format(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}

extension View {
    @ViewBuilder
    func widgetBackground() -> some View {
        if #available(macOS 14.0, *) {
            containerBackground(.background, for: .widget)
        } else {
            padding()
        }
    }
}

@main
struct DomadoWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "DomadoWidget", provider: Provider()) { entry in
            DomadoWidgetView(entry: entry)
        }
        .configurationDisplayName("domado")
        .description("Time remaining and today's pomodoros")
        .supportedFamilies([.systemSmall])
    }
}
