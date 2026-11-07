import { useState, useEffect, useRef } from 'react'
import {
  Bot,
  Send,
  User as UserIcon,
  Sparkles,
  RotateCcw,
  Lightbulb,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Trash2,
  Plus,
  MessageSquare,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { LoadingState } from '@/components/ui/LoadingState'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  useConversations,
  useConversation,
  useSendMessage,
  useDeleteConversation,
  IMessage,
} from '@/hooks/useAssistant'
import { useSpeech } from '@/hooks/useSpeech'

export default function AiAssistantPage() {
  const { toast } = useToast()
  const { user } = useAuth()

  // Default language from profile
  const defaultLang: 'en' | 'hi' | 'as' =
    user?.preferredLanguage === 'hi' || user?.preferredLanguage === 'as'
      ? user.preferredLanguage
      : 'en'

  const [language, setLanguage] = useState<'en' | 'hi' | 'as'>(defaultLang)
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()
  const [inputMessage, setInputMessage] = useState('')
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Speech Hook
  const {
    isListening,
    startListening,
    stopListening,
    recognitionError,
    isSttSupported,
    isSpeaking,
    speak,
    stopSpeaking,
    isTtsSupported,
  } = useSpeech({
    language,
    onTranscript: (spokenText) => {
      setInputMessage((prev) => (prev ? `${prev} ${spokenText}` : spokenText))
    },
  })

  // Queries & Mutations
  const conversationsQuery = useConversations()
  const currentConversationQuery = useConversation(selectedConversationId)
  const sendMessageMutation = useSendMessage()
  const deleteConversationMutation = useDeleteConversation()

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentConversationQuery.data?.messages, sendMessageMutation.isPending])

  // Handle microphone error toast
  useEffect(() => {
    if (recognitionError) {
      toast.error(recognitionError)
    }
  }, [recognitionError, toast])

  // Handle Send Message
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text) return

    setInputMessage('')
    setLastFailedMessage(null)

    sendMessageMutation.mutate(
      {
        message: text,
        conversationId: selectedConversationId,
        language,
      },
      {
        onSuccess: (data) => {
          if (!selectedConversationId) {
            setSelectedConversationId(data.conversationId)
          }
        },
        onError: (err: unknown) => {
          setLastFailedMessage(text)
          const axiosErr = err as { response?: { data?: { message?: string } } }
          const msg =
            axiosErr.response?.data?.message || 'Failed to receive assistant reply. Please try again.'
          toast.error(msg)
        },
      },
    )
  }

  // Handle Copy Message Content
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Response copied to clipboard.')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle Delete Conversation
  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteConversationMutation.mutate(convId, {
      onSuccess: () => {
        if (selectedConversationId === convId) {
          setSelectedConversationId(undefined)
        }
        toast.info('Conversation removed.')
      },
      onError: () => {
        toast.error('Failed to delete conversation.')
      },
    })
  }

  // Suggested Prompts based on Language
  const suggestedQueries =
    language === 'hi'
      ? [
          'गेहूं में पीला रतुआ (Yellow Rust) के लक्षण और सही छिड़काव क्या है?',
          'सरसों में माहू (चेपा/एफिड) का जैविक व रासायनिक नियंत्रण कैसे करें?',
          'खन्ना और इंदौर मंडी में गेहूं व सरसों का आज का क्या भाव है?',
          'गेहूं की फसल में कल्ले फूटते समय यूरिया की कितनी मात्रा दें?',
        ]
      : language === 'as'
      ? [
          'সৰিয়হত মোৱা পোক (Aphid) নিয়ন্ত্ৰণৰ বাবে কি দৰব ব্যৱহাৰ কৰিম?',
          'ঘেঁহুৰ হালধীয়া ৰাষ্ট ৰোগৰ প্ৰাথমিক লক্ষণ কি কি?',
          'বৰ্তমান চৰকাৰী সমৰ্থন মূল্য (MSP) কিমান?',
          'মাটিৰ স্বাস্থ্য কাৰ্ডৰ মতে সাৰ প্ৰয়োগৰ সঠিক নিয়ম কি?',
        ]
      : [
          'My wheat crop has yellow stripes on the leaves. What spray is recommended?',
          'How do I organically prevent aphid attacks in flowering mustard?',
          'What are current Khanna & Indore Mandi rates and official MSPs?',
          'What is the recommended fertilizer schedule for wheat at 45 days?',
        ]

  const activeMessages: IMessage[] = currentConversationQuery.data?.messages || []

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4 animate-fade-in pb-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" size="sm">
              Multilingual Agronomic AI
            </Badge>
            <Badge variant="outline" size="sm" className="font-mono text-[11px]">
              Gemini 2.5 • Grounded Agricultural KB
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            KrishiAI Agricultural Assistant
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={language}
            onValueChange={(val: 'en' | 'hi' | 'as') => {
              setLanguage(val)
              toast.info(`Assistant language set to ${val === 'hi' ? 'हिन्दी' : val === 'as' ? 'অসমীয়া' : 'English'}.`)
            }}
          >
            <SelectTrigger className="w-[125px] h-8 text-xs bg-card">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
              <SelectItem value="as">অসমীয়া (Assamese)</SelectItem>
            </SelectContent>
          </Select>

          {isSpeaking && (
            <Button
              variant="outline"
              size="sm"
              onClick={stopSpeaking}
              className="h-8 text-xs text-destructive border-destructive/30"
              leftIcon={<VolumeX className="h-3.5 w-3.5" />}
            >
              Stop Voice
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedConversationId(undefined)
              setSidebarOpen(false)
              toast.info('Started a new consultation.')
            }}
            className="h-8 text-xs shadow-sm bg-card"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            New Chat
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 text-xs shadow-sm bg-card md:hidden"
            leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
          >
            Chats ({conversationsQuery.data?.items.length || 0})
          </Button>
        </div>
      </div>

      {/* Chat Workspace (Sidebar + Main Chat) */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Sidebar: Past Conversations */}
        <Card
          className={`w-72 shrink-0 border-border flex flex-col md:flex ${
            sidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 w-72 bg-card p-4 shadow-xl'
              : 'hidden md:flex'
          }`}
        >
          <CardHeader className="p-3 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" /> Past Consultations
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedConversationId(undefined)
                setSidebarOpen(false)
              }}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Start New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-2 flex-1 overflow-y-auto space-y-1 text-xs">
            {conversationsQuery.isLoading && (
              <div className="p-4 text-center">
                <LoadingState message="Loading..." />
              </div>
            )}

            {conversationsQuery.data && conversationsQuery.data.items.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-xs space-y-1">
                <HelpCircle className="h-6 w-6 text-muted-foreground mx-auto mb-1 opacity-50" />
                <p>No prior chats.</p>
                <p className="text-[11px]">Ask a question to start your first session.</p>
              </div>
            )}

            {conversationsQuery.data?.items.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setSelectedConversationId(conv.id)
                  setSidebarOpen(false)
                }}
                className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between group transition-colors ${
                  selectedConversationId === conv.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className="block truncate text-xs">{conv.title}</span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    {conv.messageCount} messages • {conv.language.toUpperCase()}
                  </span>
                </div>

                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded transition-opacity"
                  title="Delete Conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Conversation Window */}
        <Card className="flex-1 flex flex-col border-border overflow-hidden bg-card">
          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* Initial Welcome & Suggested Chips when empty */}
            {activeMessages.length === 0 && (
              <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-fade-in">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
                  <Bot className="h-9 w-9" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {language === 'hi'
                      ? 'नमस्ते! मैं आपका कृषि सलाहकार हूँ।'
                      : language === 'as'
                      ? 'নমস্কাৰ! মই আপোনাৰ KrishiAI কৃষি সহায়ক।'
                      : 'Namaste! I am your KrishiAI Agricultural Advisor.'}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Ask me about leaf symptoms, crop disease management, soil nutrients, weather advisories,
                    or live Mandi prices. You can type or tap the microphone to speak.
                  </p>
                </div>

                {/* Suggested Prompt Chips */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Suggested Questions
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {suggestedQueries.map((query, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(query)}
                        className="p-3 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/50 hover:border-primary/50 text-xs text-foreground transition-all flex items-start gap-2 shadow-sm text-left"
                      >
                        <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">{query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Render Conversation Messages */}
            {activeMessages.map((msg: IMessage, index: number) => {
              const isAssistant = msg.sender === 'assistant'
              const msgId = msg._id || String(index)

              return (
                <div
                  key={msgId}
                  className={`flex gap-3 max-w-2xl animate-fade-in ${
                    isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                      isAssistant
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {isAssistant ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed ${
                      isAssistant
                        ? 'bg-muted/40 border border-border/70 text-foreground'
                        : 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Metadata & Actions for Assistant */}
                    {isAssistant && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isTtsSupported && (
                            <button
                              onClick={() => speak(msg.text, language)}
                              className="p-1 hover:text-primary rounded transition-colors"
                              title="Listen to audio"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleCopy(msgId, msg.text)}
                            className="p-1 hover:text-primary rounded transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msgId ? (
                              <Check className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Pending Typing Indicator */}
            {sendMessageMutation.isPending && (
              <div className="flex gap-3 max-w-xl animate-fade-in">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 text-xs flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-spin" />
                  <span>KrishiAI is formulating verified agronomic guidance...</span>
                </div>
              </div>
            )}

            {/* Retry Button on Error */}
            {lastFailedMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Failed to deliver message. Tap to retry.</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage(lastFailedMessage)}
                  className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                  leftIcon={<RotateCcw className="h-3 w-3" />}
                >
                  Retry
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-border bg-background/50">
            {isListening && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-between animate-pulse">
                <span className="flex items-center gap-2">
                  <Mic className="h-3.5 w-3.5 animate-bounce" /> Listening... Speak in {language === 'hi' ? 'Hindi' : language === 'as' ? 'Assamese' : 'English'}
                </span>
                <button onClick={stopListening} className="underline text-[11px] font-semibold">
                  Stop Recording
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    language === 'hi'
                      ? 'फसल की बीमारी, खाद, मौसम या मंडी भाव के बारे में पूछें...'
                      : language === 'as'
                      ? 'শস্যৰ ৰোগ, সাৰ বা মণ্ডীৰ দামৰ বিষয়ে সোধক...'
                      : 'Ask about crop symptoms, sprays, soil nutrients, or mandi prices...'
                  }
                  disabled={sendMessageMutation.isPending}
                  className="pr-10 h-10 text-xs bg-background"
                />
              </div>

              {/* Voice Microphone Toggle */}
              {isSttSupported && (
                <Button
                  type="button"
                  variant={isListening ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  className={`h-10 w-10 p-0 rounded-xl shrink-0 transition-all ${
                    isListening ? 'ring-2 ring-destructive animate-pulse' : ''
                  }`}
                  title={isListening ? 'Stop listening' : 'Speak your question'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}

              {/* Send Button */}
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || !inputMessage.trim()}
                className="h-10 px-4 rounded-xl shadow-premium shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
