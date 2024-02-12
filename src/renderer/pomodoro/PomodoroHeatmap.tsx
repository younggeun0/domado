import CalHeatmap from 'cal-heatmap'
import Tooltip from 'cal-heatmap/plugins/Tooltip'
import 'cal-heatmap/cal-heatmap.css'
import { useEffect } from 'react'

export default function Heatmap() {
  useEffect(() => {
    // TODO, 뽀모도로 완료 시 히트맵 갱신
    const logs = window.electron.ipcRenderer.sendSync('get_pomodoro_logs')
    if (logs.length === 0) return

    // startdate, 1개월 전 1일을 기준으로 설정(range3 설정 시 기준 이전 이후 1개월간 데이터 표시)
    const now = new Date()
    now.setMonth(now.getMonth() - 1)
    now.setDate(1)
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')

    new CalHeatmap().paint(
      {
        data: { source: logs, x: 'date', y: 'value' },
        date: { start: `${year}-${month}-${day}` },
        range: 3,
        domain: {
          type: 'month',
          gutter: 4,
          label: { text: 'MMM', textAlign: 'start', position: 'top' },
        },
        subDomain: {
          type: 'ghDay',
          radius: 2,
          width: 11,
          height: 11,
          gutter: 4,
        },
        itemSelector: '#pomodoro-heatmap',
        theme: 'dark',
        scale: {
          color: {
            type: 'threshold',
            range: ['#FF9353', '#E95100', '#F34200', '#C92100'],
            domain: [2, 4, 6],
          },
        },
      },
      [
        [
          Tooltip,
          {
            // eslint-disable-next-line object-shorthand, func-names
            text: function (_date: number, value: string, dayjsDate: any) {
              if (!value) return `${dayjsDate.format('dddd, MMMM D, YYYY')}`

              return `${value} 🍅 ${dayjsDate.format('dddd, MMMM D, YYYY')}`
            },
          },
        ],
      ],
    )
  }, [])

  return <div id="pomodoro-heatmap" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }} />
}
