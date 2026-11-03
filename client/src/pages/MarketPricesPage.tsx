import { useState } from 'react'
import {
  TrendingUp,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'

interface MandiPrice {
  id: string
  commodity: string
  mandi: string
  state: string
  modalPrice: number
  minPrice: number
  maxPrice: number
  msp: number
  changePercent: number
  trend: 'up' | 'down' | 'flat'
  arrival: string
}

const samplePrices: MandiPrice[] = [
  {
    id: 'M1',
    commodity: 'Wheat (Mill Quality)',
    mandi: 'Khanna Mandi',
    state: 'Punjab',
    modalPrice: 2475,
    minPrice: 2410,
    maxPrice: 2520,
    msp: 2275,
    changePercent: 1.8,
    trend: 'up',
    arrival: '450 Tonnes',
  },
  {
    id: 'M2',
    commodity: 'Mustard (High Oil)',
    mandi: 'Alwar APMC',
    state: 'Rajasthan',
    modalPrice: 5650,
    minPrice: 5500,
    maxPrice: 5800,
    msp: 5650,
    changePercent: 2.4,
    trend: 'up',
    arrival: '680 Tonnes',
  },
  {
    id: 'M3',
    commodity: 'Potato (Table Variety)',
    mandi: 'Agra Mandi',
    state: 'Uttar Pradesh',
    modalPrice: 1420,
    minPrice: 1350,
    maxPrice: 1510,
    msp: 1200,
    changePercent: -1.2,
    trend: 'down',
    arrival: '1,200 Tonnes',
  },
  {
    id: 'M4',
    commodity: 'Cotton (Medium Staple)',
    mandi: 'Rajkot APMC',
    state: 'Gujarat',
    modalPrice: 7120,
    minPrice: 6950,
    maxPrice: 7300,
    msp: 6620,
    changePercent: 0.6,
    trend: 'up',
    arrival: '850 Tonnes',
  },
  {
    id: 'M5',
    commodity: 'Soybean (Yellow)',
    mandi: 'Indore Mandi',
    state: 'Madhya Pradesh',
    modalPrice: 4780,
    minPrice: 4620,
    maxPrice: 4890,
    msp: 4600,
    changePercent: 0.2,
    trend: 'flat',
    arrival: '920 Tonnes',
  },
]

export default function MarketPricesPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')

  const filtered = samplePrices.filter(
    (p) =>
      p.commodity.toLowerCase().includes(search.toLowerCase()) ||
      p.mandi.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" size="sm">
              Agmarknet Daily Feed
            </Badge>
            <span className="text-xs text-muted-foreground">Updated Today, 09:30 AM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <TrendingUp className="h-7 w-7 text-primary" />
            Mandi Market Prices & Trends
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Live APMC benchmarks, Minimum Support Price (MSP) comparisons, and daily arrival volumes
            across key regional trading hubs.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => toast.success('Market tickers refreshed from Agmarknet API.')}
        >
          Refresh Prices
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Filter by crop (e.g. Wheat) or Mandi (Khanna)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Price Table / Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regional APMC Mandi Rates (₹ / Quintal)</CardTitle>
          <CardDescription>
            Modal benchmark represents weighted average price realized by farmers in today&apos;s trade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 font-semibold">Commodity</th>
                  <th className="py-3 px-3 font-semibold">Mandi / State</th>
                  <th className="py-3 px-3 font-semibold text-right">Modal Rate</th>
                  <th className="py-3 px-3 font-semibold text-right">MSP Rate</th>
                  <th className="py-3 px-3 font-semibold text-right">24h Change</th>
                  <th className="py-3 px-3 font-semibold text-right">Daily Arrivals</th>
                  <th className="py-3 px-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-foreground">
                      {item.commodity}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground">
                      <span className="text-foreground font-medium block">{item.mandi}</span>
                      <span className="text-[11px]">{item.state}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-foreground text-sm">
                      ₹{item.modalPrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right text-muted-foreground">
                      ₹{item.msp.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          item.trend === 'up'
                            ? 'text-success'
                            : item.trend === 'down'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {item.trend === 'up' ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : item.trend === 'down' ? (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        ) : null}
                        {item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-muted-foreground">
                      {item.arrival}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.info(`Price alerts set for ${item.commodity}.`)}
                      >
                        Set Alert
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Advisory Banner */}
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Selling Advisory for Punjab Rabi Wheat:
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Khanna Mandi modal rate is currently trading <strong>₹200/quintal above MSP</strong>. 
            Commercial flour mill demand is strong. Good liquidity window for surplus stocks.
          </p>
        </div>
      </div>
    </div>
  )
}
