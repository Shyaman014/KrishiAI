import axios from 'axios'
import mongoose from 'mongoose'
import { ICurrentWeather, IForecastResponse } from './OpenWeatherService'
import { WeatherAlertHistory, WeatherAlertType, WeatherAlertSeverity } from '../../models/WeatherAlertHistory'
import { NotificationService } from '../notificationService'
import { env } from '../../config/env'
import logger from '../../utils/logger'

export interface IWeatherAlertItem {
  id?: string
  alertType: WeatherAlertType
  severity: WeatherAlertSeverity
  title: string
  message: string
  actionableGuidance: string
  validUntil: string
}

export interface ISprayWindowGuidance {
  status: 'optimal' | 'acceptable' | 'unfavorable' | 'hazardous'
  statusLabel: string
  isFavorableToday: boolean
  recommendedHours: string
  windSpeedKmH: number
  rainProbabilityNext12h: number
  riskFactors: string[]
  guidanceText: string
}

export interface IIrrigationAdvisory {
  action: 'delay' | 'normal' | 'increase' | 'halt'
  statusLabel: string
  expectedRainfall24hMm: number
  expectedRainfall48hMm: number
  soilMoistureStatus: string
  recommendation: string
}

export interface IFieldActivities {
  spraying: { suitable: boolean; note: string }
  irrigation: { suitable: boolean; note: string }
  harvesting: { suitable: boolean; note: string }
  sowing: { suitable: boolean; note: string }
}

export interface IWeatherAdvisoryResponse {
  location: {
    name: string
    country: string
    lat: number
    lon: number
  }
  generatedAt: string
  alerts: IWeatherAlertItem[]
  sprayWindow: ISprayWindowGuidance
  irrigation: IIrrigationAdvisory
  fieldActivities: IFieldActivities
  explanationSummary: string
  language: 'en' | 'hi' | 'as'
}

export class WeatherAdvisoryEngine {
  /**
   * Generates a comprehensive agricultural weather advisory combining rule-based agronomic logic
   * and conversational multilingual synthesis.
   */
  public static async generateAdvisory(
    current: ICurrentWeather,
    forecast: IForecastResponse,
    userId?: string,
    language: 'en' | 'hi' | 'as' = 'en',
  ): Promise<IWeatherAdvisoryResponse> {
    const alerts: IWeatherAlertItem[] = []
    const temp = current.current.temp
    const humidity = current.current.humidity
    const windSpeed = current.current.windSpeed
    const today = forecast.daily[0]
    const tomorrow = forecast.daily[1]

    // Cumulative rain in next 24-48 hours
    const next24hItems = forecast.hourly.slice(0, 8)
    const expectedRain24h = Number(
      next24hItems.reduce((acc, cur) => acc + (cur.rain3h || 0), 0).toFixed(1),
    )
    const maxPop24h = Math.max(...next24hItems.map((i) => i.pop), 0)

    const next48hItems = forecast.hourly.slice(0, 16)
    const expectedRain48h = Number(
      next48hItems.reduce((acc, cur) => acc + (cur.rain3h || 0), 0).toFixed(1),
    )

    const oneDayFromNow = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    const twoDaysFromNow = new Date(Date.now() + 48 * 3600 * 1000).toISOString()

    // ── 1. RULE: Heavy Rainfall Hazard ─────────────────────────────────────────
    if (expectedRain24h >= 15 || maxPop24h >= 75 || today?.totalRain >= 15) {
      const isCritical = expectedRain24h >= 30 || today?.totalRain >= 30
      alerts.push({
        alertType: 'heavy_rain',
        severity: isCritical ? 'critical' : 'warning',
        title: isCritical ? 'Severe Rainfall & Waterlogging Alert' : 'Heavy Rainfall Forecasted',
        message: `Expected precipitation of ${expectedRain24h > 0 ? expectedRain24h : today?.totalRain} mm within the next 24 hours.`,
        actionableGuidance:
          'Clear field drainage channels immediately to prevent root inundation. Suspend all foliar fertilizer and pesticide applications.',
        validUntil: oneDayFromNow,
      })
    }

    // ── 2. RULE: High Temperature / Heat Stress ───────────────────────────────
    if (temp >= 35 || today?.tempMax >= 36) {
      const isExtreme = temp >= 40 || today?.tempMax >= 40
      alerts.push({
        alertType: 'high_temp',
        severity: isExtreme ? 'critical' : 'warning',
        title: isExtreme ? 'Extreme Heatwave Warning' : 'Elevated Heat Stress Alert',
        message: `Ambient temperatures reaching ${today?.tempMax || temp}°C. High evapotranspiration rate.`,
        actionableGuidance:
          'Provide light irrigation during late evening or early morning to cool root zones. Avoid midday urea top-dressing to prevent leaf scorch.',
        validUntil: oneDayFromNow,
      })
    }

    // ── 3. RULE: High Humidity / Pathogen Proliferation Risk ──────────────────
    if (humidity >= 80 && temp >= 16 && temp <= 30) {
      alerts.push({
        alertType: 'high_humidity',
        severity: 'warning',
        title: 'High Humidity – Foliar Disease Risk Alert',
        message: `Relative humidity at ${humidity}% with moderate temperatures (${temp}°C) creates an ideal microclimate for foliar fungal pathogens.`,
        actionableGuidance:
          'Scout lower leaves for early blight, late blight, or rust lesions. Ensure adequate row spacing and avoid overhead irrigation.',
        validUntil: twoDaysFromNow,
      })
    }

    // ── 4. RULE: Potential Frost Warning ──────────────────────────────────────
    const lowestTemp = Math.min(temp, today?.tempMin ?? temp, tomorrow?.tempMin ?? temp)
    if (lowestTemp <= 4) {
      alerts.push({
        alertType: 'frost',
        severity: 'critical',
        title: 'Ground Frost Warning',
        message: `Night temperatures expected to drop to ${lowestTemp}°C. Risk of cellular freezing in tender foliage.`,
        actionableGuidance:
          'Apply light evening sprinkler irrigation or deploy smoke covers (smudging) across windward plot borders to conserve radiant warmth.',
        validUntil: oneDayFromNow,
      })
    }

    // ── 5. RULE: Strong Wind Alert ────────────────────────────────────────────
    if (windSpeed >= 18) {
      alerts.push({
        alertType: 'strong_wind',
        severity: windSpeed >= 25 ? 'critical' : 'warning',
        title: 'High Wind Velocity Alert',
        message: `Wind gusts reaching ${windSpeed} km/h. High potential for mechanical lodging and chemical spray drift.`,
        actionableGuidance:
          'Prohibit all herbicide/pesticide sprays due to spray drift. Stake vulnerable tall crops like maize, sugarcane, and staked tomatoes.',
        validUntil: oneDayFromNow,
      })
    }

    // ── 6. Spray Window Logic ────────────────────────────────────────────────
    const riskFactors: string[] = []
    let sprayStatus: 'optimal' | 'acceptable' | 'unfavorable' | 'hazardous' = 'optimal'
    let sprayLabel = 'Favorable Spray Conditions'
    let sprayGuidance = 'Ideal window for foliar nutrient and pest control applications.'

    if (windSpeed >= 18 || maxPop24h >= 70) {
      sprayStatus = 'hazardous'
      sprayLabel = 'Do Not Spray'
      if (windSpeed >= 18) riskFactors.push(`High wind speed (${windSpeed} km/h) creates severe spray drift`)
      if (maxPop24h >= 70) riskFactors.push(`Impending rainfall (${maxPop24h}% chance) will wash away chemicals`)
      sprayGuidance = 'Spray operations should be suspended until wind calms and rain hazard passes.'
    } else if (windSpeed >= 12 || maxPop24h >= 40 || temp >= 33) {
      sprayStatus = 'unfavorable'
      sprayLabel = 'Unfavorable Window'
      if (windSpeed >= 12) riskFactors.push(`Moderate breeze (${windSpeed} km/h) may cause uneven drift`)
      if (maxPop24h >= 40) riskFactors.push(`Moderate rain probability (${maxPop24h}%)`)
      if (temp >= 33) riskFactors.push(`High temperature (${temp}°C) accelerates chemical evaporation`)
      sprayGuidance = 'If spraying is critical, operate strictly during calm early morning hours using low-drift nozzles.'
    } else if (windSpeed < 4 && humidity > 85) {
      sprayStatus = 'acceptable'
      sprayLabel = 'Acceptable (Monitor Dew)'
      riskFactors.push('High moisture may slow droplet drying')
      sprayGuidance = 'Wait until heavy morning dew has evaporated before applying systemic treatments.'
    }

    const sprayWindow: ISprayWindowGuidance = {
      status: sprayStatus,
      statusLabel: sprayLabel,
      isFavorableToday: sprayStatus === 'optimal' || sprayStatus === 'acceptable',
      recommendedHours: sprayStatus === 'optimal' ? '6:30 AM – 9:30 AM or 3:30 PM – 6:00 PM' : 'Early morning (6:00 AM – 8:00 AM) only',
      windSpeedKmH: windSpeed,
      rainProbabilityNext12h: maxPop24h,
      riskFactors,
      guidanceText: sprayGuidance,
    }

    // ── 7. Irrigation Advisory Logic ─────────────────────────────────────────
    let irrigationAction: 'delay' | 'normal' | 'increase' | 'halt' = 'normal'
    let irrigationLabel = 'Maintain Routine Irrigation'
    let irrigationRec = 'Continue standard soil moisture maintenance.'

    if (expectedRain24h >= 15 || today?.totalRain >= 15) {
      irrigationAction = 'halt'
      irrigationLabel = 'Halt Irrigation'
      irrigationRec = `Significant rainfall (${expectedRain24h} mm) expected. Suspend irrigation completely to avoid root rot and nutrient leaching.`
    } else if (expectedRain48h >= 8 || maxPop24h >= 50) {
      irrigationAction = 'delay'
      irrigationLabel = 'Delay Irrigation (Conserve Water)'
      irrigationRec = `Impending precipitation within 48 hours (${expectedRain48h} mm expected). Delay scheduled watering rounds by 1 to 2 days.`
    } else if (temp >= 34 && humidity < 50) {
      irrigationAction = 'increase'
      irrigationLabel = 'Increase Irrigation Frequency'
      irrigationRec = 'High evaporative demand and low humidity. Provide shallow frequent irrigation cycles during evening hours.'
    }

    const irrigation: IIrrigationAdvisory = {
      action: irrigationAction,
      statusLabel: irrigationLabel,
      expectedRainfall24hMm: expectedRain24h,
      expectedRainfall48hMm: expectedRain48h,
      soilMoistureStatus: humidity > 70 ? 'Adequate / Moist' : humidity < 40 ? 'Deficit / Dry' : 'Optimal',
      recommendation: irrigationRec,
    }

    // ── 8. Field Activity Suitability ────────────────────────────────────────
    const fieldActivities: IFieldActivities = {
      spraying: {
        suitable: sprayWindow.isFavorableToday,
        note: sprayWindow.guidanceText,
      },
      irrigation: {
        suitable: irrigationAction !== 'halt',
        note: irrigation.recommendation,
      },
      harvesting: {
        suitable: maxPop24h < 35 && expectedRain24h < 2,
        note:
          maxPop24h < 35
            ? 'Dry conditions favorable for crop harvest and post-harvest sun-drying.'
            : 'Postpone harvesting to prevent moisture spoilage in grain/pods.',
      },
      sowing: {
        suitable: expectedRain24h < 20 && lowestTemp > 10,
        note:
          expectedRain24h >= 20
            ? 'Waterlogging risk for newly sown seeds. Delay planting.'
            : 'Favorable seedbed temperature and moisture balance.',
      },
    }

    // ── 9. Multilingual Conversational Synthesis ─────────────────────────────
    const explanationSummary = await this.generateMultilingualSummary(
      current.location.name,
      temp,
      humidity,
      current.current.condition,
      alerts,
      sprayWindow,
      irrigation,
      language,
    )

    // ── 10. Persist Alert History to Database ────────────────────────────────
    if (userId && mongoose.Types.ObjectId.isValid(userId) && alerts.length > 0) {
      try {
        for (const alert of alerts) {
          // Check if an unexpired alert of the same type already exists for today
          const existing = await WeatherAlertHistory.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            alertType: alert.alertType,
            createdAt: { $gte: new Date(Date.now() - 12 * 3600 * 1000) },
          })

          if (!existing) {
            const savedAlert = await WeatherAlertHistory.create({
              userId: new mongoose.Types.ObjectId(userId),
              alertType: alert.alertType,
              severity: alert.severity,
              title: alert.title,
              message: alert.message,
              location: {
                cityName: current.location.name,
                latitude: current.location.lat,
                longitude: current.location.lon,
              },
              weatherSnapshot: {
                temperature: temp,
                humidity,
                windSpeed,
                rainfallProbability: maxPop24h,
                condition: current.current.condition,
              },
              dismissed: false,
              validUntil: new Date(alert.validUntil),
            })

            void NotificationService.createNotification({
              userId,
              type: 'weather_alert',
              title: `Weather Alert: ${alert.title}`,
              message: alert.message,
              relatedResourceId: savedAlert._id.toString(),
              resourceType: 'weather',
              metadata: {
                alertType: alert.alertType,
                severity: alert.severity,
                cityName: current.location.name,
              },
            })
          }
        }
      } catch (dbErr) {
        logger.debug('Failed to record weather alert history', dbErr)
      }
    }

    return {
      location: current.location,
      generatedAt: new Date().toISOString(),
      alerts,
      sprayWindow,
      irrigation,
      fieldActivities,
      explanationSummary,
      language,
    }
  }

  /**
   * Generates natural language summary using Gemini or localized fallback
   */
  private static async generateMultilingualSummary(
    cityName: string,
    temp: number,
    humidity: number,
    condition: string,
    alerts: IWeatherAlertItem[],
    sprayWindow: ISprayWindowGuidance,
    irrigation: IIrrigationAdvisory,
    language: 'en' | 'hi' | 'as',
  ): Promise<string> {
    // Try AI service explanation if online
    try {
      if (env.AI_SERVICE_URL && env.NODE_ENV !== 'test') {
        const promptText = `Location: ${cityName}. Current Weather: ${temp}°C, Humidity ${humidity}%, Condition ${condition}. Alerts: ${alerts.map((a) => a.title).join(', ') || 'None'}. Spray Window: ${sprayWindow.statusLabel}. Irrigation: ${irrigation.statusLabel}. Summarize this in 2 practical farming sentences in ${language === 'hi' ? 'Hindi' : language === 'as' ? 'Assamese' : 'English'}.`

        const res = await axios.post(
          `${env.AI_SERVICE_URL}/api/v1/explain`,
          {
            crop: 'Farm Weather',
            disease: condition,
            confidence: 90,
            is_healthy: alerts.length === 0,
            status: 'completed',
            language,
            additional_context: promptText,
          },
          { timeout: 5000 },
        )

        if (res.data?.explanation?.overview) {
          return res.data.explanation.overview
        }
      }
    } catch {
      // Fall through to deterministic localized synthesis
    }

    if (language === 'hi') {
      const alertSnippet = alerts.length > 0 ? `चेतावनी: ${alerts[0].title}।` : 'मौसम की स्थिति सामान्य है।'
      return `${cityName} में तापमान ${temp}°C और आर्द्रता ${humidity}% है। ${alertSnippet} छिड़काव: ${sprayWindow.statusLabel}; सिंचाई: ${irrigation.statusLabel}।`
    }

    if (language === 'as') {
      const alertSnippet = alerts.length > 0 ? `সতৰ্কবাণী: ${alerts[0].title}।` : 'বতৰৰ অৱস্থা স্বাভাৱিক।'
      return `${cityName}ত উষ্ণতা ${temp}°C আৰু আৰ্দ্ৰতা ${humidity}%। ${alertSnippet} স্প্ৰে'ৰ পৰামৰ্শ: ${sprayWindow.statusLabel}; জলসিঞ্চন: ${irrigation.statusLabel}।`
    }

    const alertSnippet = alerts.length > 0 ? `Alert: ${alerts[0].title}.` : 'Weather conditions are stable.'
    return `${cityName} reports ${temp}°C with ${humidity}% humidity (${condition}). ${alertSnippet} Spray Guidance: ${sprayWindow.statusLabel}; Irrigation: ${irrigation.statusLabel}.`
  }
}

