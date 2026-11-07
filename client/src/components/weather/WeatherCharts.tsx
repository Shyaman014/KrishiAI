import { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { Thermometer, CloudRain, Droplets } from 'lucide-react'
import { IHourlyForecastItem, IDailyForecastItem } from '@/hooks/useWeather'

interface WeatherChartsProps {
  hourly: IHourlyForecastItem[]
  daily: IDailyForecastItem[]
}

export function WeatherCharts({ hourly, daily }: WeatherChartsProps) {
  const [activeTab, setActiveTab] = useState<'temperature' | 'rainfall' | 'humidity'>('temperature')

  // Prepare hourly data
  const hourlyData = hourly.slice(0, 10).map((item) => ({
    time: item.time,
    temp: item.temp,
    feelsLike: item.feelsLike,
    pop: item.pop,
    rain3h: item.rain3h,
    humidity: item.humidity,
    windSpeed: item.windSpeed,
  }))

  // Prepare daily data
  const dailyData = daily.map((item) => ({
    day: item.dayName,
    date: item.date,
    tempMax: item.tempMax,
    tempMin: item.tempMin,
    pop: item.maxPop,
    rain: item.totalRain,
    humidity: item.avgHumidity,
  }))

  return (
    <Card className="shadow-subtle">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            {activeTab === 'temperature' && <Thermometer className="h-4 w-4 text-amber-500" />}
            {activeTab === 'rainfall' && <CloudRain className="h-4 w-4 text-blue-500" />}
            {activeTab === 'humidity' && <Droplets className="h-4 w-4 text-emerald-500" />}
            Agricultural Micro-Climate Visualizations
          </CardTitle>
          <CardDescription>
            Continuous weather telemetry trends plotted using Recharts
          </CardDescription>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border">
          <Button
            variant={activeTab === 'temperature' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setActiveTab('temperature')}
          >
            Temperature
          </Button>
          <Button
            variant={activeTab === 'rainfall' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setActiveTab('rainfall')}
          >
            Rain Probability
          </Button>
          <Button
            variant={activeTab === 'humidity' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setActiveTab('humidity')}
          >
            Humidity & Wind
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* 1. Temperature Trend Area Chart */}
        {activeTab === 'temperature' && (
          <div className="space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis unit="°C" domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2.5 rounded-xl bg-card border border-border shadow-md text-xs space-y-1">
                            <p className="font-semibold text-foreground">{label}</p>
                            <p className="text-amber-600 dark:text-amber-400 font-bold">
                              Temp: {payload[0].value}°C
                            </p>
                            {payload[1] && (
                              <p className="text-muted-foreground">Feels like: {payload[1].value}°C</p>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#tempGradient)"
                    name="Temperature"
                  />
                  <Area
                    type="monotone"
                    dataKey="feelsLike"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                    name="Feels Like"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Hourly ambient temperature curve over next 30 hours. Dotted line represents canopy feel.
            </p>
          </div>
        )}

        {/* 2. Rainfall Probability Bar Chart */}
        {activeTab === 'rainfall' && (
          <div className="space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const item = dailyData.find((d) => d.day === label)
                        return (
                          <div className="p-2.5 rounded-xl bg-card border border-border shadow-md text-xs space-y-1">
                            <p className="font-semibold text-foreground">{label} ({item?.date})</p>
                            <p className="text-blue-600 dark:text-blue-400 font-bold">
                              Rain Probability: {item?.pop}%
                            </p>
                            <p className="text-muted-foreground">
                              Estimated Accumulation: {item?.rain} mm
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="pop"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    name="Rainfall Probability (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Daily maximum precipitation likelihood across the 7-day outlook.
            </p>
          </div>
        )}

        {/* 3. Humidity & Wind Multi-Axis Chart */}
        {activeTab === 'humidity' && (
          <div className="space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2.5 rounded-xl bg-card border border-border shadow-md text-xs space-y-1">
                            <p className="font-semibold text-foreground">{label}</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Humidity: {payload[0]?.value}%
                            </p>
                            {payload[1] && (
                              <p className="text-teal-600 dark:text-teal-400 font-bold">
                                Wind: {payload[1]?.value} km/h
                              </p>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#humidityGradient)"
                    name="Relative Humidity (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="windSpeed"
                    stroke="#0d9488"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    fill="none"
                    name="Wind Speed (km/h)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Microclimate humidity levels & wind speeds determining pathogen risk and foliar spray suitability.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
