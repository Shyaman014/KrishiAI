import { useState } from 'react'
import {
  Bot,
  Send,
  User,
  Sparkles,
  RotateCcw,
  Lightbulb,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
}

const initialMessages: Message[] = [
  {
    id: 'm1',
    sender: 'assistant',
    text: 'Namaste Ramesh ji! I am your KrishiAI Agronomic Assistant. How can I assist your field operations today? You can ask about crop diseases, spray dosages, or fertilizer schedules.',
    time: '10:30 AM',
  },
  {
    id: 'm2',
    sender: 'user',
    text: 'My wheat field (Plot #4) is showing small yellow stripes on the leaves. What spray do you recommend?',
    time: '10:32 AM',
  },
  {
    id: 'm3',
    sender: 'assistant',
    text: 'Based on your plot location in Punjab and the recent cloudy weather, this strongly indicates Early Yellow Stripe Rust (Puccinia striiformis).\n\nRecommended Action Plan:\n1. Apply Propiconazole 25% EC (Tilt) @ 1 ml per liter of water (200 ml in 200 liters of water per acre).\n2. Optimum application window: Today between 3:30 PM and 6:00 PM when wind speed is < 8 km/h.\n3. Ensure high pressure hollow-cone nozzle is used for thorough underside leaf coverage.',
    time: '10:32 AM',
  },
]

const suggestedQueries = [
  'What is the recommended Urea dose for wheat tillering?',
  'How to prevent aphid attacks in flowering mustard organically?',
  'What is the current Khanna Mandi rate for wheat?',
  'Calculate water requirement for 4 acres of potatoes.',
]

export default function AiAssistantPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage
    if (!text.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInputMessage('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Here is the agronomic guidance for: "${text}".\n\nFor best yield in your regional soil conditions, maintain consistent irrigation intervals and apply balanced NPK nutrients based on your latest soil health card. Consult our Weather tab before executing chemical sprays.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, aiReply])
      setIsTyping(false)
    }, 1000)
  }

  const handleReset = () => {
    setMessages(initialMessages)
    toast.info('Chat session refreshed.')
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" size="sm" dot>
              Krishi-LLM v3 (Agricultural Specialized)
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Bot className="h-6 w-6 text-primary" />
            AI Agronomic Assistant
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          onClick={handleReset}
        >
          Reset Chat
        </Button>
      </div>

      {/* Suggested Quick Queries */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-warning" />
          Suggested Field Questions:
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((query, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(query)}
              className="text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/40 hover:bg-muted text-foreground/80 hover:text-foreground transition-all text-left cursor-pointer"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Card */}
      <Card className="min-h-[480px] flex flex-col justify-between shadow-premium border-primary/20">
        <CardContent className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 max-h-[500px]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/20 text-primary border border-primary/30'
                }`}
              >
                {m.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-subtle ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted/50 text-foreground border border-border/80 rounded-tl-none'
                }`}
              >
                {m.text}
                <span
                  className={`block text-[10px] mt-1.5 ${
                    m.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}
                >
                  {m.time}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground italic pl-11">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-spin" />
              <span>KrishiAI is compiling agronomic recommendation...</span>
            </div>
          )}
        </CardContent>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-card rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about crop diseases, dosage, sowing dates, soil health..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 h-11 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            <Button
              type="submit"
              size="lg"
              leftIcon={<Send className="h-4 w-4" />}
              disabled={!inputMessage.trim()}
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

