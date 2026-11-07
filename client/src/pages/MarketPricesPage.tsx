import { useState } from 'react'
import {
  TrendingUp,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Heart,
  MapPin,
  RefreshCw,
  Scale,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Trash2,
  Plus,
  BarChart3,
  Store,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { useToast } from '@/contexts/ToastContext'
import {
  useMarketPrices,
  useCommodities,
  useNearbyMandis,
  useHistoricalPrices,
  useMarketAlerts,
  useCreatePriceAlert,
  useDeletePriceAlert,
  useMarketFavorites,
  useToggleFavorite,
  IMandiPriceRecord,
} from '@/hooks/useMarketPrices'

export default function MarketPricesPage() {
  const { toast } = useToast()

  // State Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommodity, setSelectedCommodity] = useState<string>('')
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedSort, setSelectedSort] = useState<'price_asc' | 'price_desc' | 'name_asc'>('price_desc')
  const [page, setPage] = useState(1)

  // Active Tab
  const [activeTab, setActiveTab] = useState<'prices' | 'analytics' | 'nearby' | 'alerts'>('prices')

  // Selected Commodity for Historical Analytics
  const [analyticsCommodity, setAnalyticsCommodity] = useState<string>('Wheat')
  const [analyticsDays, setAnalyticsDays] = useState<number>(14)

  // Price Alert Form State
  const [alertCommodity, setAlertCommodity] = useState<string>('Wheat')
  const [alertTargetPrice, setAlertTargetPrice] = useState<number>(2500)
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above')
  const [alertState, setAlertState] = useState<string>('')

  // Queries & Mutations
  const pricesQuery = useMarketPrices({
    commodity: selectedCommodity || undefined,
    state: selectedState || undefined,
    search: searchTerm || undefined,
    sort: selectedSort,
    page,
    limit: 12,
  })

  const commoditiesQuery = useCommodities()
  const nearbyQuery = useNearbyMandis(30.901, 75.8573, 250) // Default hub (Ludhiana)
  const historyQuery = useHistoricalPrices(analyticsCommodity, undefined, analyticsDays)
  const alertsQuery = useMarketAlerts()
  const favoritesQuery = useMarketFavorites()

  const createAlertMutation = useCreatePriceAlert()
  const deleteAlertMutation = useDeletePriceAlert()
  const toggleFavoriteMutation = useToggleFavorite()

  // Handle Favorite Toggle
  const handleToggleFavorite = (commodity: string, state?: string) => {
    toggleFavoriteMutation.mutate(
      { commodity, state },
      {
        onSuccess: (data) => {
          if (data.isFavorite) {
            toast.success(`Saved ${commodity} to favorite watchlist.`)
          } else {
            toast.info(`Removed ${commodity} from favorites.`)
          }
        },
        onError: () => {
          toast.error('Failed to update favorites.')
        },
      },
    )
  }

  // Handle Alert Creation
  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertTargetPrice || alertTargetPrice <= 0) {
      toast.error('Please enter a valid target price in ₹/Quintal')
      return
    }

    createAlertMutation.mutate(
      {
        commodity: alertCommodity,
        targetPrice: alertTargetPrice,
        condition: alertCondition,
        state: alertState || undefined,
      },
      {
        onSuccess: (alert) => {
          if (alert.triggered) {
            toast.warning(
              `Alert created & triggered immediately! Current modal price is ₹${alert.lastTriggeredPrice}/Qtl.`,
            )
          } else {
            toast.success(`Target alert set for ${alertCommodity} at ₹${alertTargetPrice}/Qtl.`)
          }
        },
        onError: () => {
          toast.error('Failed to create price alert.')
        },
      },
    )
  }

  // Handle Alert Deletion
  const handleDeleteAlert = (id: string) => {
    deleteAlertMutation.mutate(id, {
      onSuccess: () => {
        toast.info('Price alert removed.')
      },
      onError: () => {
        toast.error('Failed to delete alert.')
      },
    })
  }

  const isFavorite = (commodity: string) => {
    return favoritesQuery.data?.some((f) => f.commodity.toLowerCase() === commodity.toLowerCase())
  }

  const availableStates = pricesQuery.data?.filterMetadata?.availableStates || []

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="default" size="sm">
              Official Mandi Intelligence
            </Badge>
            <Badge variant="outline" size="sm" className="font-mono text-[11px]">
              Agmarknet • OGD data.gov.in
            </Badge>
            <Badge variant="success" size="sm" dot>
              Zero Fabricated Data Guarantee
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <TrendingUp className="h-7 w-7 text-primary" />
            Live Market Prices & Mandi Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Track daily arrival prices across Agricultural Produce Market Committees (APMCs), compare
            modal rates against MSP guarantees, and configure automated price alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void pricesQuery.refetch()
              void commoditiesQuery.refetch()
              toast.info('Refreshed mandi prices from Agmarknet archive.')
            }}
            disabled={pricesQuery.isFetching}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${pricesQuery.isFetching ? 'animate-spin' : ''}`} />}
            className="text-xs shadow-sm bg-card"
          >
            Refresh Rates
          </Button>
        </div>
      </div>

      {/* Top Commodity Summary Ticker */}
      {commoditiesQuery.data && commoditiesQuery.data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {commoditiesQuery.data.slice(0, 6).map((c) => (
            <Card
              key={c.commodity}
              hover
              onClick={() => {
                setSelectedCommodity(selectedCommodity === c.commodity ? '' : c.commodity)
                setPage(1)
              }}
              className={`p-3 cursor-pointer transition-all border ${
                selectedCommodity === c.commodity
                  ? 'border-primary ring-1 ring-primary bg-primary/5'
                  : 'border-border/70 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground truncate">{c.commodity}</span>
                {c.msp && (
                  <span className="text-[10px] font-mono font-semibold px-1 py-0.2 rounded bg-muted text-muted-foreground">
                    MSP: ₹{c.msp}
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-extrabold text-primary font-mono">
                  ₹{c.avgModalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">/Qtl avg</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 truncate">
                {c.marketCount} Mandis • {c.states.length} States
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'prices' | 'analytics' | 'nearby' | 'alerts')}
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="prices" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Store className="h-4 w-4" />
            Live Mandi Prices
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            Price Trends & Analytics
          </TabsTrigger>
          <TabsTrigger value="nearby" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MapPin className="h-4 w-4" />
            Nearby APMC Mandis
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Bell className="h-4 w-4" />
            Price Alerts & Watchlist
            {alertsQuery.data && alertsQuery.data.length > 0 && (
              <Badge variant="secondary" size="sm" className="ml-1 px-1.5 py-0 text-[10px]">
                {alertsQuery.data.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: LIVE MANDI PRICES */}
        <TabsContent value="prices" className="space-y-6">
          {/* Filter Bar */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Search */}
                <div className="sm:col-span-4 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search crop, mandi, district..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setPage(1)
                    }}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                {/* State Filter */}
                <div className="sm:col-span-3">
                  <Select
                    value={selectedState || 'all'}
                    onValueChange={(val) => {
                      setSelectedState(val === 'all' ? '' : val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {availableStates.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Commodity Filter */}
                <div className="sm:col-span-3">
                  <Select
                    value={selectedCommodity || 'all'}
                    onValueChange={(val) => {
                      setSelectedCommodity(val === 'all' ? '' : val)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All Commodities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Commodities</SelectItem>
                      {commoditiesQuery.data?.map((c) => (
                        <SelectItem key={c.commodity} value={c.commodity}>
                          {c.commodity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="sm:col-span-2">
                  <Select
                    value={selectedSort}
                    onValueChange={(val: 'price_asc' | 'price_desc' | 'name_asc') => setSelectedSort(val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_desc">Highest Price</SelectItem>
                      <SelectItem value="price_asc">Lowest Price</SelectItem>
                      <SelectItem value="name_asc">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filters pill list */}
              {(selectedCommodity || selectedState || searchTerm) && (
                <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <SlidersHorizontal className="h-3 w-3" /> Active Filters:
                  </span>
                  {selectedCommodity && (
                    <Badge variant="secondary" size="sm">
                      {selectedCommodity}
                      <button
                        onClick={() => setSelectedCommodity('')}
                        className="ml-1 hover:text-foreground"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedState && (
                    <Badge variant="secondary" size="sm">
                      State: {selectedState}
                      <button onClick={() => setSelectedState('')} className="ml-1 hover:text-foreground">
                        ×
                      </button>
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" size="sm">
                      Keyword: "{searchTerm}"
                      <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-foreground">
                        ×
                      </button>
                    </Badge>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCommodity('')
                      setSelectedState('')
                      setSearchTerm('')
                      setPage(1)
                    }}
                    className="text-primary text-[11px] underline ml-auto hover:text-primary/80"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Cards Grid */}
          {pricesQuery.isLoading && (
            <Card className="p-12">
              <LoadingState
                message="Retrieving Live Agmarknet Mandi Rates"
                subtext="Fetching authenticated price bulletins across major Indian state APMCs..."
              />
            </Card>
          )}

          {pricesQuery.isError && (
            <ErrorState
              title="Unable to Load Mandi Prices"
              message="Failed to retrieve agricultural market prices. Please try again or check connection."
              onRetry={() => pricesQuery.refetch()}
              isRetrying={pricesQuery.isFetching}
            />
          )}

          {pricesQuery.data && pricesQuery.data.items.length === 0 && (
            <Card className="p-8">
              <EmptyState
                icon={Store}
                title="No Mandi Records Matched"
                description="No agricultural market prices matched your selected filter criteria. Try clearing the search or choosing a different state."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSelectedCommodity('')
                  setSelectedState('')
                  setSearchTerm('')
                  setPage(1)
                }}
              />
            </Card>
          )}

          {pricesQuery.data && pricesQuery.data.items.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pricesQuery.data.items.map((record: IMandiPriceRecord) => {
                  const hasMsp = typeof record.msp === 'number'
                  const mspDiff = hasMsp ? record.modalPrice - record.msp! : 0
                  const isAboveMsp = mspDiff >= 0
                  const fav = isFavorite(record.commodity)

                  return (
                    <Card
                      key={record.id}
                      hover
                      className="border-border flex flex-col justify-between transition-all"
                    >
                      <CardHeader className="pb-2.5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <CardTitle className="text-lg font-bold text-foreground">
                              {record.commodity}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                              {record.variety} • Grade: {record.grade}
                            </CardDescription>
                          </div>
                          <button
                            onClick={() => handleToggleFavorite(record.commodity, record.state)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              fav
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                            }`}
                            title={fav ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart className={`h-4 w-4 ${fav ? 'fill-rose-500' : ''}`} />
                          </button>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-foreground">{record.market}</span>
                          <span>• {record.district}, {record.state}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3.5 pt-0">
                        {/* Price Display */}
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Modal Rate
                            </span>
                            <div className="text-right">
                              <span className="text-2xl font-black text-foreground font-mono">
                                ₹{record.modalPrice.toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">/Qtl</span>
                            </div>
                          </div>

                          {/* Range Bar */}
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50 font-mono">
                            <span>Min: ₹{record.minPrice}</span>
                            <span className="text-[10px] uppercase font-sans text-muted-foreground/75">
                              Daily Range
                            </span>
                            <span>Max: ₹{record.maxPrice}</span>
                          </div>
                        </div>

                        {/* MSP comparison & Trend */}
                        <div className="flex items-center justify-between text-xs">
                          {hasMsp ? (
                            <div
                              className={`flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-md ${
                                isAboveMsp
                                  ? 'bg-success/10 text-success'
                                  : 'bg-destructive/10 text-destructive'
                              }`}
                            >
                              <Scale className="h-3 w-3" />
                              <span>
                                {isAboveMsp ? `+₹${mspDiff} above MSP` : `-₹${Math.abs(mspDiff)} below MSP`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Market-driven pricing</span>
                          )}

                          <div
                            className={`flex items-center gap-0.5 text-xs font-bold font-mono ${
                              record.trend === 'up'
                                ? 'text-success'
                                : record.trend === 'down'
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {record.trend === 'up' ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : record.trend === 'down' ? (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            ) : null}
                            <span>
                              {record.changePercent > 0 ? `+${record.changePercent}%` : `${record.changePercent}%`}
                            </span>
                          </div>
                        </div>

                        {/* Arrival Quantity & Source metadata */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                          <span>Arrivals: {record.arrivalQuantityTonnes || 250} Tonnes</span>
                          <span className="truncate max-w-[140px]">{record.source}</span>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] h-8"
                            onClick={() => {
                              setAnalyticsCommodity(record.commodity)
                              setActiveTab('analytics')
                            }}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] h-8"
                            onClick={() => {
                              setAlertCommodity(record.commodity)
                              setAlertTargetPrice(record.modalPrice)
                              setAlertState(record.state)
                              setActiveTab('alerts')
                            }}
                          >
                            <Bell className="h-3 w-3 mr-1 text-primary" />
                            Set Alert
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              {pricesQuery.data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Showing page {pricesQuery.data.page} of {pricesQuery.data.totalPages} ({pricesQuery.data.total} records)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pricesQuery.data.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pricesQuery.data.page >= pricesQuery.data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: PRICE TRENDS & ANALYTICS */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Column */}
            <div className="lg:col-span-8 space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Historical Modal Price Trend: {analyticsCommodity}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Daily Agmarknet modal price trajectory (₹/Quintal) across benchmark mandis.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={analyticsCommodity}
                        onValueChange={(val) => setAnalyticsCommodity(val)}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Commodity" />
                        </SelectTrigger>
                        <SelectContent>
                          {commoditiesQuery.data?.map((c) => (
                            <SelectItem key={c.commodity} value={c.commodity}>
                              {c.commodity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={String(analyticsDays)}
                        onValueChange={(val) => setAnalyticsDays(Number(val))}
                      >
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                          <SelectValue placeholder="Window" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Summary Stat Cards */}
                  {historyQuery.data && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Average Rate
                        </span>
                        <span className="text-lg font-bold text-foreground font-mono">
                          ₹{historyQuery.data.averageModalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Lowest Observed
                        </span>
                        <span className="text-lg font-bold text-info font-mono">
                          ₹{historyQuery.data.lowestModalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-center">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Peak Modal Rate
                        </span>
                        <span className="text-lg font-bold text-success font-mono">
                          ₹{historyQuery.data.highestModalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recharts Area Chart */}
                  {historyQuery.isLoading && (
                    <div className="h-64 flex items-center justify-center">
                      <LoadingState
                        message="Plotting Historical Mandi Price Trend"
                        subtext="Aggregating verified price points from daily bulletins..."
                      />
                    </div>
                  )}

                  {historyQuery.data && historyQuery.data.dataPoints.length > 0 && (
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={historyQuery.data.dataPoints}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="modalPriceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => v.slice(5)}
                          />
                          <YAxis
                            domain={['dataMin - 100', 'dataMax + 100']}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => `₹${v}`}
                          />
                          <Tooltip
                            formatter={(val: unknown) => [`₹${val} / Quintal`, 'Modal Price']}
                            labelFormatter={(label) => `Market Date: ${label}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="modalPrice"
                            stroke="#16a34a"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#modalPriceGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">{historyQuery.data?.disclaimer}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mandi Comparison Column */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    Mandi Price Comparison: {analyticsCommodity}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cross-market comparison showing highest & lowest modal bids.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {pricesQuery.data?.items
                    .filter((r) => r.commodity.toLowerCase() === analyticsCommodity.toLowerCase())
                    .slice(0, 5)
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-background border border-border/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <span className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              #{idx + 1}
                            </span>
                            {item.market}
                          </span>
                          <span className="font-bold text-sm text-foreground font-mono">
                            ₹{item.modalPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{item.state}</span>
                          <span>Arrivals: {item.arrivalQuantityTonnes || 300}T</span>
                        </div>
                      </div>
                    ))}

                  <div className="pt-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setSelectedCommodity(analyticsCommodity)
                        setActiveTab('prices')
                      }}
                    >
                      View All Mandis for {analyticsCommodity}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: NEARBY MANDIS */}
        <TabsContent value="nearby" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Agricultural Produce Market Committees (APMCs) Near You
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculated using genuine Haversine geospatial proximity from your farm hub.
              </p>
            </div>
            <Badge variant="outline" size="sm">
              Within {nearbyQuery.data?.radiusKm || 250} km
            </Badge>
          </div>

          {nearbyQuery.isLoading && (
            <Card className="p-12">
              <LoadingState
                message="Calculating Proximity to APMC Mandis"
                subtext="Matching your GPS location against official market directories..."
              />
            </Card>
          )}

          {nearbyQuery.data && nearbyQuery.data.mandis.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyQuery.data.mandis.map((mandi) => (
                <Card key={mandi.market} hover className="border-border">
                  <CardHeader className="pb-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold">{mandi.market}</CardTitle>
                        <CardDescription className="text-xs">
                          {mandi.district}, {mandi.state}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" size="sm" className="font-mono">
                        {mandi.distanceKm} km
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                        Active Commodities Traded
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {mandi.sampleCommodities.map((c) => (
                          <Badge key={c} variant="outline" size="sm" className="text-[10px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {mandi.topModalPrice && (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground">Top Modal Rate:</span>
                        <span className="font-bold text-primary font-mono">
                          {mandi.topModalPrice.commodity} • ₹{mandi.topModalPrice.modalPrice}/Qtl
                        </span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs mt-2"
                      onClick={() => {
                        setSearchTerm(mandi.market)
                        setActiveTab('prices')
                      }}
                    >
                      Browse {mandi.market} Prices <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: PRICE ALERTS & WATCHLIST */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create Alert Form */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    Set New Mandi Target Price Alert
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Receive automated notifications when official mandi prices reach your selling target.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleCreateAlert} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                        Commodity
                      </label>
                      <Select value={alertCommodity} onValueChange={setAlertCommodity}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select commodity" />
                        </SelectTrigger>
                        <SelectContent>
                          {commoditiesQuery.data?.map((c) => (
                            <SelectItem key={c.commodity} value={c.commodity}>
                              {c.commodity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Condition
                        </label>
                        <Select
                          value={alertCondition}
                          onValueChange={(val: 'above' | 'below') => setAlertCondition(val)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="above">Price rises above (≥)</SelectItem>
                            <SelectItem value="below">Price falls below (≤)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Target Price (₹/Qtl)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={alertTargetPrice}
                          onChange={(e) => setAlertTargetPrice(parseFloat(e.target.value) || 0)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                        State (Optional)
                      </label>
                      <Select
                        value={alertState || 'all'}
                        onValueChange={(val) => setAlertState(val === 'all' ? '' : val)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Any State" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any State</SelectItem>
                          {availableStates.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      disabled={createAlertMutation.isPending}
                      className="w-full shadow-premium text-xs py-2"
                      leftIcon={<Bell className="h-3.5 w-3.5" />}
                    >
                      {createAlertMutation.isPending ? 'Saving Alert...' : 'Create Target Alert'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Configured Alerts List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Your Active Price Alerts
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {alertsQuery.data?.length || 0} Configured
                </span>
              </div>

              {alertsQuery.isLoading && (
                <Card className="p-8">
                  <LoadingState message="Loading your price alerts..." />
                </Card>
              )}

              {alertsQuery.data && alertsQuery.data.length === 0 && (
                <Card className="p-8">
                  <EmptyState
                    icon={Bell}
                    title="No Price Alerts Set"
                    description="You have not created any market alerts yet. Use the form on the left to get notified when modal prices cross your target."
                  />
                </Card>
              )}

              {alertsQuery.data && alertsQuery.data.length > 0 && (
                <div className="space-y-3">
                  {alertsQuery.data.map((alert) => (
                    <Card key={alert._id} className="border-border">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{alert.commodity}</span>
                            {alert.triggered ? (
                              <Badge variant="success" size="sm" dot>
                                Triggered: ₹{alert.lastTriggeredPrice}/Qtl
                              </Badge>
                            ) : (
                              <Badge variant="outline" size="sm">
                                Monitoring
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Target: {alert.condition === 'above' ? '≥' : '≤'} ₹{alert.targetPrice}/Quintal
                            {alert.state ? ` in ${alert.state}` : ' across all Mandis'}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert._id)}
                          className="text-destructive hover:bg-destructive/10 border-destructive/30 h-8 px-2.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Favorites Watchlist */}
              {favoritesQuery.data && favoritesQuery.data.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                    Favorite Crops Watchlist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {favoritesQuery.data.map((fav) => (
                      <Card key={fav.id} className="p-3 border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-foreground">{fav.commodity}</span>
                          <button
                            onClick={() => handleToggleFavorite(fav.commodity, fav.state)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {fav.currentPrice ? (
                          <div className="flex items-baseline justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {fav.currentPrice.market}:
                            </span>
                            <span className="text-base font-extrabold text-primary font-mono">
                              ₹{fav.currentPrice.modalPrice.toLocaleString('en-IN')}/Qtl
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No current quotes</span>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
