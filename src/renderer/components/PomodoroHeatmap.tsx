import CalHeatmap from 'cal-heatmap'
// @ts-ignore
import Tooltip from 'cal-heatmap/plugins/Tooltip'
import 'cal-heatmap/cal-heatmap.css'
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { useNotionSync } from '../jotaiStore'

export default function Heatmap() {
  const [useSync] = useAtom(useNotionSync)

  useEffect(() => {
    const logs = window.electron.ipcRenderer.sendSync('get_pomodoro_logs')

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
        scale: {
          color: {
            type: 'threshold',
            range: ['rgb(187 247 208)', 'rgb(134 239 172)', 'rgb(74 222 128)', 'rgb(34 197 94)'],
            domain: [2, 4, 6],
          },
        },
      },
      [
        [
          Tooltip,
          {
            // @ts-ignore
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

  return useSync && <div id="pomodoro-heatmap" className="flex justify-center mt-1" />
}
