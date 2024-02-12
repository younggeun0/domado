import CalHeatmap from 'cal-heatmap'
import Tooltip from 'cal-heatmap/plugins/Tooltip';
import 'cal-heatmap/cal-heatmap.css'
import { useEffect } from 'react'

export default function Heatmap() {
  useEffect(() => {
    const logs = window.electron.ipcRenderer.sendSync('get_pomodoro_logs')
    if (logs.length === 0) return

    new CalHeatmap().paint(
      {
        data: { source: logs, x: 'date', y: 'value' },
        // TODO, 날짜 기간 설정(현재로부터 3개월)
        date: { start: new Date('2023-12-01') },
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
              if (!value) return ''

              return `${value} 🍅 ${dayjsDate.format('dddd, MMMM D, YYYY')}`
            },
          },
        ],
      ],
    )
  }, [])

  return (
    <div
      id="pomodoro-heatmap"
      style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}
    />
  )
}
