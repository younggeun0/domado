import CalHeatmap from 'cal-heatmap'
import { useEffect } from 'react'

export default function Heatmap() {
  useEffect(() => {
    const cal = new CalHeatmap()

    // TOOD, heatmap 데이터 가공
    // https://cal-heatmap.com/docs/showcase#github-profile-contribution-like
    cal.paint({
      // data: {
      //   source: '../fixtures/seattle-weather.csv',
      //   type: 'csv',
      //   x: 'date',
      //   y: d => +d['temp_max'],
      //   groupY: 'max',
      // },
      date: { start: new Date('2024-01-01') },
      range: 3,
      domain: {
        type: 'month',
        gutter: 4,
        label: { text: 'MMM', textAlign: 'start', position: 'top' },
      },
      subDomain: { type: 'ghDay', radius: 2, width: 11, height: 11, gutter: 4 },
      itemSelector: '#pomodoro-heatmap',
      scale: {
        color: {
          type: 'threshold',
          range: ['#14432a', '#166b34', '#37a446', '#4dd05a'],
          domain: [10, 20, 30],
        },
      },
    })
  })

  return <div id="pomodoro-heatmap" />
}
