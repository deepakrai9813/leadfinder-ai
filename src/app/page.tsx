'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Globe, Mail, Send, Plus, Trash2, Star, Eye, EyeOff,
  RefreshCw, ChevronDown, ChevronRight, ExternalLink, Copy,
  Check, MessageSquare, Target, Zap, Building2, TrendingUp,
  Settings, Sparkles, LayoutDashboard, Users, FileText,
  Loader2, AlertCircle, MapPin, Phone, Briefcase, Tag,
  Filter, SortAsc, SortDesc, BarChart3, ArrowUpRight,
  MessageCircle, CheckCircle2, X, LogOut, UserCircle
} from 'lucide-react'

import { useSession, signIn, signOut } from 'next-auth/react'
import { SessionProvider } from 'next-auth/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

// Types
interface BusinessLead {
  id: string
  businessName: string
  businessType: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  hasWebsite: boolean
  websiteStatus: string
  searchQuery: string | null
  source: string | null
  notes: string | null
  rating: number
  status: string
  createdAt: string
  outreachMessages: OutreachMessage[]
}

interface OutreachMessage {
  id: string
  leadId: string
  messageType: string
  subject: string | null
  content: string
  status: string
  sentAt: string | null
  serviceType: string
  aiGenerated: boolean
  createdAt: string
}

interface UserProfile {
  id: string
  serviceName: string | null
  yourName: string | null
  yourEmail: string | null
  yourPhone: string | null
  yourWebsite: string | null
  companyDesc: string | null
  services: string | null
}

interface SearchResult {
  name: string
  snippet: string
  url: string
  hostName: string
  rank: number
}

function getStatusColor(status: string) {
  switch (status) {
    case 'has_website': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'no_website': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'poor_website': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'unknown': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getLeadStatusColor(status: string) {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'interested': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'not_interested': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'converted': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function HomeContent() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login')
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false)
  const [showResetNewPassword, setShowResetNewPassword] = useState(false)
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false)

  // State
  const [leads, setLeads] = useState<BusinessLead[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [searchBusinessType, setSearchBusinessType] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedLead, setSelectedLead] = useState<BusinessLead | null>(null)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [bulkAnalyzeProgress, setBulkAnalyzeProgress] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Message state
  const [msgServiceType, setMsgServiceType] = useState('all')
  const [msgTone, setMsgTone] = useState('professional')
  const [msgChannel, setMsgChannel] = useState<'email' | 'whatsapp'>('email')
  const [msgContent, setMsgContent] = useState('')
  const [msgSubject, setMsgSubject] = useState('')
  const [msgNotes, setMsgNotes] = useState('')
  const [msgToEmail, setMsgToEmail] = useState('')
  const [msgToPhone, setMsgToPhone] = useState('')
  const [copied, setCopied] = useState(false)
  const [addLeadLoading, setAddLeadLoading] = useState<string | null>(null)

  // Stats
  const stats = {
    total: leads.length,
    noWebsite: leads.filter(l => l.websiteStatus === 'no_website' || l.websiteStatus === 'poor_website').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
  }

  // ===== Auth Handlers =====

  const handleLogin = async () => {
    setAuthLoading(true)
    try {
      const result = await signIn('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      })
      if (result?.error) {
        toast({ title: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Welcome back!' })
        window.location.href = '/'
      }
    } catch (err) {
      toast({ title: 'Login failed', variant: 'destructive' })
    }
    setAuthLoading(false)
  }

  const handleGoogleLogin = async () => {
    setAuthLoading(true)
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch (err) {
      toast({ title: 'Google login not configured', description: 'Set up Google OAuth credentials in .env', variant: 'destructive' })
    }
    setAuthLoading(false)
  }

  const handleRegister = async () => {
    if (registerData.password !== registerData.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    setAuthLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerData.name, email: registerData.email, password: registerData.password }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Account created! Please sign in.' })
        setAuthMode('login')
        setLoginData({ email: registerData.email, password: '' })
      } else {
        toast({ title: data.error || 'Registration failed', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Registration failed', variant: 'destructive' })
    }
    setAuthLoading(false)
  }

  const handleSendOtp = async () => {
    setAuthLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setOtpSent(true)
        toast({ title: 'OTP generated!', description: data.hint || 'Check your email' })
      } else {
        toast({ title: data.error || 'Failed to send OTP', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Failed to send OTP', variant: 'destructive' })
    }
    setAuthLoading(false)
  }

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    setResetPasswordLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Password reset! Please sign in.' })
        setAuthMode('login')
        setLoginData({ email: forgotEmail, password: '' })
        setOtpSent(false)
        setForgotOtp('')
        setNewPassword('')
        setConfirmPassword('')
        setForgotEmail('')
      } else {
        toast({ title: data.error || 'Reset failed', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Reset failed', variant: 'destructive' })
    }
    setResetPasswordLoading(false)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Load leads and profile on mount
  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    const initialize = async () => {
      try {
        const [leadsRes, profileRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/profile'),
        ])
        if (cancelled) return
        const leadsData = await leadsRes.json()
        const profileData = await profileRes.json()
        if (!cancelled) {
          if (leadsData.leads) setLeads(leadsData.leads)
          if (profileData.profile) setUserProfile(profileData.profile)
        }
      } catch (err) {
        console.error('Failed to initialize:', err)
      }
    }
    initialize()
    return () => { cancelled = true }
  }, [status])

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads')
      const data = await res.json()
      if (data.leads) setLeads(data.leads)
    } catch (err) {
      console.error('Failed to load leads:', err)
    }
  }, [])

  // Search businesses
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: 'Please enter a search query', variant: 'destructive' })
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          location: searchLocation,
          businessType: searchBusinessType,
        }),
      })
      const data = await res.json()
      if (data.results) {
        setSearchResults(data.results)
        toast({
          title: `Found ${data.count} potential leads`,
          description: 'Review and add businesses to your leads list',
        })
      }
    } catch (err) {
      toast({ title: 'Search failed', description: 'Please try again', variant: 'destructive' })
    }
    setIsSearching(false)
  }

  // Analyze a single business
  const handleAnalyze = async (businessName: string, url?: string) => {
    setIsAnalyzing(businessName)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, businessUrl: url }),
      })
      const data = await res.json()

      if (data.needsServices) {
        await handleAddLead({
          businessName: data.businessName,
          website: data.websiteUrl,
          hasWebsite: data.hasWebsite,
          websiteStatus: data.websiteStatus,
        })
      }

      return data
    } catch (err) {
      toast({ title: 'Analysis failed', variant: 'destructive' })
    }
    setIsAnalyzing(null)
    return null
  }

  // Add lead (FIXED)
  const handleAddLead = async (leadData: any) => {
    const name = leadData.businessName || 'Unknown'
    setAddLeadLoading(name)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          searchQuery,
          source: leadData.source || 'web_search',
        }),
      })
      const data = await res.json()
      if (res.ok && data.lead) {
        toast({
          title: data.isNew ? 'Lead added!' : 'Lead updated',
          description: data.isNew ? `${name} added to your leads` : `${name} info updated`,
        })
        loadLeads()
      } else {
        toast({
          title: 'Failed to add lead',
          description: data.error || 'Something went wrong',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({ title: 'Failed to add lead', variant: 'destructive' })
    }
    setAddLeadLoading(null)
  }

  // Generate AI message (supports email + whatsapp)
  const handleGenerateMessage = async () => {
    if (!selectedLead) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: selectedLead.businessName,
          businessType: selectedLead.businessType,
          serviceType: msgServiceType,
          tone: msgTone,
          messageType: msgChannel,
          customNotes: msgNotes,
          userProfile,
        }),
      })
      const data = await res.json()
      if (data.content) {
        setMsgContent(data.content)
        setMsgSubject(data.subject || '')
        toast({
          title: msgChannel === 'whatsapp' ? 'WhatsApp message generated!' : 'Email generated!',
          description: 'Review and send it',
        })
      }
    } catch (err) {
      toast({ title: 'Failed to generate message', variant: 'destructive' })
    }
    setIsGenerating(false)
  }

  // Send message (email or whatsapp)
  const handleSendMessage = async (sendNow: boolean) => {
    if (!selectedLead || !msgContent) {
      toast({ title: 'Please generate or write a message first', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          messageType: msgChannel,
          subject: msgChannel === 'email' ? msgSubject : null,
          content: msgContent,
          serviceType: msgServiceType,
          aiGenerated: true,
          sendNow,
          toEmail: msgToEmail || selectedLead.email,
          toPhone: msgToPhone || selectedLead.phone,
        }),
      })
      const data = await res.json()
      if (data.message) {
        if (sendNow && data.emailLink) {
          window.open(data.emailLink, '_blank')
          toast({
            title: 'Email client opened!',
            description: `Composed email to ${data.toEmail || selectedLead.businessName}`,
          })
        } else if (sendNow && data.whatsappLink) {
          window.open(data.whatsappLink, '_blank')
          toast({
            title: 'WhatsApp opened!',
            description: `Message to ${data.toPhone || selectedLead.phone}`,
          })
        } else if (sendNow) {
          if (msgChannel === 'email') {
            toast({
              title: 'Message saved & marked as sent',
              description: `No email/phone found. Copy and send manually.`,
            })
          } else {
            toast({
              title: 'Message saved & marked as sent',
              description: `No phone found. Copy and send via WhatsApp manually.`,
            })
          }
        } else {
          toast({
            title: 'Message saved as draft',
            description: `To ${selectedLead.businessName}`,
          })
        }

        setMessageDialogOpen(false)
        setMsgContent('')
        setMsgSubject('')
        setMsgToEmail('')
        setMsgToPhone('')
        loadLeads()
      }
    } catch (err) {
      toast({ title: 'Failed to send message', variant: 'destructive' })
    }
  }

  // Delete lead
  const handleDeleteLead = async (id: string) => {
    try {
      await fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
      setLeads(leads.filter(l => l.id !== id))
      toast({ title: 'Lead deleted' })
    } catch (err) {
      toast({ title: 'Failed to delete lead', variant: 'destructive' })
    }
  }

  // Update lead status
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      loadLeads()
      toast({ title: 'Status updated' })
    } catch (err) {
      toast({ title: 'Failed to update status', variant: 'destructive' })
    }
  }

  // Update lead rating
  const handleUpdateRating = async (id: string, rating: number) => {
    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rating }),
      })
      loadLeads()
    } catch (err) {
      toast({ title: 'Failed to update rating', variant: 'destructive' })
    }
  }

  // Bulk analyze search results
  const handleBulkAnalyze = async () => {
    setBulkAnalyzeProgress(0)
    const total = searchResults.length
    let processed = 0

    for (const result of searchResults) {
      await handleAnalyze(result.name, result.url)
      processed++
      setBulkAnalyzeProgress(Math.round((processed / total) * 100))
    }

    toast({ title: `Analyzed ${total} businesses!` })
    setBulkAnalyzeProgress(100)
  }

  // Save profile
  const handleSaveProfile = async (data: any) => {
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setUserProfile(data)
      toast({ title: 'Profile saved!' })
      setProfileDialogOpen(false)
    } catch (err) {
      toast({ title: 'Failed to save profile', variant: 'destructive' })
    }
  }

  // Open message dialog for a lead
  const openMessageDialog = (lead: BusinessLead, channel: 'email' | 'whatsapp') => {
    setSelectedLead(lead)
    setMsgChannel(channel)
    setMsgServiceType('all')
    setMsgContent('')
    setMsgSubject('')
    setMsgToEmail(lead.email || '')
    setMsgToPhone(lead.phone || '')
    setMessageDialogOpen(true)
  }

  // Copy message to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(msgContent)
    setCopied(true)
    toast({ title: 'Copied to clipboard!' })
    setTimeout(() => setCopied(false), 2000)
  }

  // Filter and sort leads
  const filteredLeads = leads
    .filter(l => filterStatus === 'all' || l.websiteStatus === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'name') return a.businessName.localeCompare(b.businessName)
      return 0
    })

  const userName = session?.user?.name || ''
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U'

  // ===== Landing Screen (not logged in) =====
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Landing Header */}
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  LeadFinder AI
                </h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">Find businesses. Close deals.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setAuthMode('login'); setAuthDialogOpen(true) }}>Sign In</Button>
              <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" onClick={() => { setAuthMode('signup'); setAuthDialogOpen(true) }}>Sign Up</Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex-1 grid lg:grid-cols-2">
          {/* Left: Branding */}
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Lead Generation
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                Find Businesses<br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">That Need You</span>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
                LeadFinder AI helps you discover businesses without websites, generate personalized outreach messages, and close more deals — all powered by AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 h-12 text-base px-8" onClick={() => { setAuthMode('signup'); setAuthDialogOpen(true) }}>
                  Get Started Free
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 text-base px-8" onClick={() => { setAuthMode('login'); setAuthDialogOpen(true) }}>
                  Sign In
                </Button>
              </div>
            </motion.div>

            {/* Feature highlights */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 lg:max-w-none">
              {[
                { icon: Search, title: 'Smart Search', desc: 'Find businesses by category & location' },
                { icon: Sparkles, title: 'AI Analysis', desc: 'Detect if a business needs your services' },
                { icon: Send, title: 'AI Outreach', desc: 'Generate personalized email & WhatsApp' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/50 border shadow-sm">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <f.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Auth Form (visible on large screens) */}
          <div className="hidden lg:flex items-center justify-center p-8 sm:p-12">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="w-full max-w-md border-0 shadow-2xl">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>Sign in to your LeadFinder AI account</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="landing-email">Email</Label>
                    <Input id="landing-email" type="email" placeholder="you@example.com" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landing-password">Password</Label>
                    <div className="relative">
                      <Input id="landing-password" type={showLoginPassword ? 'text' : 'password'} placeholder="Enter your password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="pr-10" />
                      <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleLogin} disabled={authLoading || !loginData.email || !loginData.password} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                    {authLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                  <div className="relative my-2">
                    <Separator />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">or</span>
                  </div>
                  <Button variant="outline" className="w-full h-11 gap-2" onClick={handleGoogleLogin}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign in with Google
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs" onClick={() => { setAuthMode('forgot'); setAuthDialogOpen(true) }}>Forgot password?</button>
                    <button type="button" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs" onClick={() => { setAuthMode('signup'); setAuthDialogOpen(true) }}>Don't have an account? Sign Up</button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>LeadFinder AI — AI-Powered Lead Generation Tool</p>
            <p>Send via Email & WhatsApp | Built with Next.js & Z.ai SDK</p>
          </div>
        </footer>

        {/* ===== Auth Modal (for mobile and links) ===== */}
        <Dialog open={authDialogOpen} onOpenChange={(open) => { setAuthDialogOpen(open); if (!open) { setShowLoginPassword(false); setShowSignupPassword(false); setShowSignupConfirmPassword(false); setShowResetNewPassword(false); setShowResetConfirmPassword(false) } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {authMode === 'login' && 'Sign In'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'forgot' && 'Forgot Password'}
              </DialogTitle>
              <DialogDescription>
                {authMode === 'login' && 'Sign in to your LeadFinder AI account'}
                {authMode === 'signup' && 'Create a new account to get started'}
                {authMode === 'forgot' && 'Enter your email to receive a password reset OTP'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* ===== LOGIN VIEW ===== */}
              {authMode === 'login' && (
                <>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="you@example.com" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input type={showLoginPassword ? 'text' : 'password'} placeholder="Enter your password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="pr-10" />
                      <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleLogin} disabled={authLoading || !loginData.email || !loginData.password} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                    {authLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                  <div className="relative my-2">
                    <Separator />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">or</span>
                  </div>
                  <Button variant="outline" className="w-full h-11 gap-2" onClick={handleGoogleLogin}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign in with Google
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs" onClick={() => { setAuthMode('forgot') }}>Forgot password?</button>
                    <button type="button" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs" onClick={() => { setAuthMode('signup') }}>Don't have an account? Sign Up</button>
                  </div>
                </>
              )}

              {/* ===== SIGNUP VIEW ===== */}
              {authMode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input placeholder="John Smith" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="you@example.com" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input type={showSignupPassword ? 'text' : 'password'} placeholder="Create a password" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="pr-10" />
                      <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <Input type={showSignupConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" value={registerData.confirmPassword} onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleRegister()} className="pr-10" />
                      <button type="button" onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showSignupConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleRegister} disabled={authLoading || !registerData.name || !registerData.email || !registerData.password || !registerData.confirmPassword} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                    {authLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign Up
                  </Button>
                  <div className="relative my-2">
                    <Separator />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">or</span>
                  </div>
                  <Button variant="outline" className="w-full h-11 gap-2" onClick={handleGoogleLogin}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign up with Google
                  </Button>
                  <div className="text-center">
                    <button type="button" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs" onClick={() => { setAuthMode('login') }}>Already have an account? Sign In</button>
                  </div>
                </>
              )}

              {/* ===== FORGOT PASSWORD VIEW ===== */}
              {authMode === 'forgot' && (
                <>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} disabled={otpSent} />
                  </div>
                  {!otpSent ? (
                    <Button onClick={handleSendOtp} disabled={authLoading || !forgotEmail} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                      {authLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Send OTP
                    </Button>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>OTP Code</Label>
                        <Input placeholder="Enter 6-digit OTP" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} maxLength={6} className="tracking-widest text-center text-lg font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <div className="relative">
                          <Input type={showResetNewPassword ? 'text' : 'password'} placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" />
                          <button type="button" onClick={() => setShowResetNewPassword(!showResetNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showResetNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <div className="relative">
                          <Input type={showResetConfirmPassword ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()} className="pr-10" />
                          <button type="button" onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showResetConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button onClick={handleResetPassword} disabled={resetPasswordLoading || !forgotOtp || !newPassword || !confirmPassword} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                        {resetPasswordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Reset Password
                      </Button>
                    </>
                  )}
                  <div className="text-center">
                    <button type="button" className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs" onClick={() => { setAuthMode('login'); setOtpSent(false); setForgotOtp(''); setNewPassword(''); setConfirmPassword(''); setForgotEmail('') }}>Back to Sign In</button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ===== Loading State =====
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // ===== Main App (logged in) =====
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                LeadFinder AI
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Find businesses. Close deals.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setProfileDialogOpen(true)} className="hidden sm:flex gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Profile
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                    {userInitial}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium max-w-24 truncate">{userName || 'User'}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                    {userInitial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{userName || 'User'}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-32">{session?.user?.email || ''}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileDialogOpen(true)} className="gap-2 cursor-pointer">
                  <UserCircle className="h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-white dark:bg-slate-800 shadow-sm rounded-xl p-1">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm rounded-lg">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1.5 text-xs sm:text-sm rounded-lg">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-1.5 text-xs sm:text-sm rounded-lg">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Leads</span>
              {leads.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-[10px] rounded-full px-1.5">
                  {leads.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-1.5 text-xs sm:text-sm rounded-lg">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Outreach</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== Dashboard Tab ===== */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Leads</p>
                        <p className="text-3xl font-bold mt-1">{stats.total}</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="h-3 w-3" />
                      <span>Ready to prospect</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Need Website</p>
                        <p className="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">{stats.noWebsite}</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-red-600 dark:text-red-400">
                      <Target className="h-3 w-3" />
                      <span>Prime targets</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Contacted</p>
                        <p className="text-3xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{stats.contacted}</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <Send className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                      <Mail className="h-3 w-3" />
                      <span>Outreach sent</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Converted</p>
                        <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats.converted}</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      <span>Deals closed</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md lg:col-span-1">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={() => setActiveTab('search')} className="w-full justify-start gap-3 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20">
                    <Search className="h-4 w-4" />
                    Find New Businesses
                  </Button>
                  <Button onClick={() => setActiveTab('leads')} variant="outline" className="w-full justify-start gap-3 h-12">
                    <Users className="h-4 w-4" />
                    View All Leads
                  </Button>
                  <Button onClick={() => setProfileDialogOpen(true)} variant="outline" className="w-full justify-start gap-3 h-12">
                    <Settings className="h-4 w-4" />
                    Setup Your Profile
                  </Button>
                  <Separator className="my-2" />
                  <div className="text-xs text-muted-foreground space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <p className="font-medium text-foreground">How it works:</p>
                    <p>1. Search for businesses by category & location</p>
                    <p>2. AI analyzes if they have a website</p>
                    <p>3. Add promising leads to your list</p>
                    <p>4. Send AI-personalized Email or WhatsApp</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md lg:col-span-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-500" />
                      Recent Leads
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('leads')}>
                      View all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {leads.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No leads yet</p>
                      <p className="text-sm mt-1">Start by searching for businesses</p>
                      <Button className="mt-4" onClick={() => setActiveTab('search')}>
                        <Search className="h-4 w-4 mr-2" />
                        Start Searching
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-80">
                      <div className="space-y-2">
                        {leads.slice(0, 8).map((lead) => (
                          <motion.div
                            key={lead.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-5 w-5 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{lead.businessName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(lead.websiteStatus)}`}>
                                    {lead.websiteStatus.replace('_', ' ')}
                                  </Badge>
                                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getLeadStatusColor(lead.status)}`}>
                                    {lead.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openMessageDialog(lead, 'email')} title="Send Email">
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600" onClick={() => openMessageDialog(lead, 'whatsapp')} title="Send WhatsApp">
                                <MessageCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== Search Tab ===== */}
          <TabsContent value="search" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-emerald-500" />
                  Find Businesses Without Websites
                </CardTitle>
                <CardDescription>
                  Search for businesses in any industry and location. Our AI will analyze each business to check if they have a website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <Briefcase className="h-3.5 w-3.5" />
                      Business Category
                    </Label>
                    <Input placeholder="e.g., restaurants, dentists, plumbers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <MapPin className="h-3.5 w-3.5" />
                      Location (optional)
                    </Label>
                    <Input placeholder="e.g., New York, London, Mumbai..." value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <Tag className="h-3.5 w-3.5" />
                      Business Type (optional)
                    </Label>
                    <Input placeholder="e.g., small business, startup..." value={searchBusinessType} onChange={(e) => setSearchBusinessType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                  </div>
                </div>
                <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} className="gap-2 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {isSearching ? 'Searching...' : 'Search Businesses'}
                </Button>
              </CardContent>
            </Card>

            {searchResults.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-emerald-500" />
                        Search Results
                      </CardTitle>
                      <CardDescription className="mt-1">{searchResults.length} businesses found</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleBulkAnalyze} disabled={bulkAnalyzeProgress > 0 && bulkAnalyzeProgress < 100} className="gap-1.5">
                      {bulkAnalyzeProgress > 0 && bulkAnalyzeProgress < 100 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Analyze All with AI
                    </Button>
                  </div>
                  {bulkAnalyzeProgress > 0 && bulkAnalyzeProgress < 100 && (
                    <Progress value={bulkAnalyzeProgress} className="mt-3 h-2" />
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-3">
                      {searchResults.map((result, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border bg-white dark:bg-slate-800/50 hover:shadow-md transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground w-6">#{idx + 1}</span>
                              <p className="font-semibold text-sm">{result.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.snippet}</p>
                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline mt-2">
                              <ExternalLink className="h-3 w-3" />
                              {result.hostName}
                            </a>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" variant="outline" className="gap-1.5" disabled={isAnalyzing === result.name} onClick={async () => {
                              const analysis = await handleAnalyze(result.name, result.url)
                              if (analysis) {
                                toast({
                                  title: analysis.needsServices ? `${result.name} needs your services!` : `${result.name} already has a website`,
                                  description: `Status: ${analysis.websiteStatus.replace('_', ' ')}`,
                                  variant: analysis.needsServices ? 'default' : 'destructive',
                                })
                              }
                            }}>
                              {isAnalyzing === result.name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                              Analyze
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1.5 bg-emerald-500 hover:bg-emerald-600"
                              disabled={addLeadLoading === result.name}
                              onClick={() => handleAddLead({
                                businessName: result.name,
                                website: result.url,
                                source: result.hostName,
                              })}
                            >
                              {addLeadLoading === result.name ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...</>
                              ) : (
                                <><Plus className="h-3.5 w-3.5" /> Add Lead</>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {searchResults.length === 0 && !isSearching && (
              <Card className="border-0 shadow-md">
                <CardContent className="py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Search for Businesses</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                    Enter a business category and optionally a location to find businesses that might need your services.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['Restaurants', 'Dentists', 'Plumbers', 'Salons', 'Gyms', 'Auto Repair'].map((s) => (
                      <Button key={s} variant="outline" size="sm" className="text-xs" onClick={() => setSearchQuery(s)}>{s}</Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== Leads Tab ===== */}
          <TabsContent value="leads" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px] h-9">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leads</SelectItem>
                    <SelectItem value="no_website">No Website</SelectItem>
                    <SelectItem value="poor_website">Poor Website</SelectItem>
                    <SelectItem value="has_website">Has Website</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SortAsc className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" variant="outline" onClick={loadLeads} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>

            {filteredLeads.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-16 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No leads found</p>
                  <p className="text-sm text-muted-foreground mt-1">{leads.length === 0 ? 'Start by searching for businesses' : 'Try changing your filters'}</p>
                  {leads.length === 0 && (
                    <Button className="mt-4" onClick={() => setActiveTab('search')}>
                      <Search className="h-4 w-4 mr-2" /> Start Searching
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead, idx) => (
                  <motion.div key={lead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                    <Card className="border shadow-sm hover:shadow-md transition-all overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row">
                          <div className="flex-1 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="h-5 w-5 text-slate-500" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-sm">{lead.businessName}</h3>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getStatusColor(lead.websiteStatus)}`}>
                                      <Globe className="h-2.5 w-2.5 mr-0.5" />{lead.websiteStatus.replace('_', ' ')}
                                    </Badge>
                                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getLeadStatusColor(lead.status)}`}>{lead.status}</Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button key={star} onClick={() => handleUpdateRating(lead.id, star === lead.rating ? 0 : star)} className="p-0.5 hover:scale-110 transition-transform">
                                    <Star className={`h-4 w-4 ${star <= lead.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                              {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                              {lead.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.address}</span>}
                              {lead.website && (
                                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                                  <ExternalLink className="h-3 w-3" />{lead.website.replace(/^https?:\/\//, '').substring(0, 40)}
                                </a>
                              )}
                            </div>

                            {lead.notes && (
                              <p className="mt-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 line-clamp-2">{lead.notes}</p>
                            )}
                          </div>

                          {/* Actions - Email + WhatsApp + Status + Delete */}
                          <div className="flex lg:flex-col gap-1.5 p-3 lg:p-4 lg:border-l bg-slate-50 dark:bg-slate-800/30 lg:bg-transparent lg:border-slate-100 lg:dark:border-slate-800">
                            <Button size="sm" className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 shadow-sm" onClick={() => openMessageDialog(lead, 'email')}>
                              <Mail className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">Email</span>
                            </Button>
                            <Button size="sm" className="gap-1.5 bg-green-500 hover:bg-green-600 shadow-sm" onClick={() => openMessageDialog(lead, 'whatsapp')}>
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">WhatsApp</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-1.5">
                                  <ChevronDown className="h-3.5 w-3.5" /> Status
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'new')}>New</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'contacted')}>Contacted</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'interested')}>Interested</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'not_interested')}>Not Interested</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'converted')}>Converted</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button size="sm" variant="outline" className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 lg:mt-auto" onClick={() => handleDeleteLead(lead.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== Outreach Tab ===== */}
          <TabsContent value="outreach" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-500" />
                  Outreach Center
                </CardTitle>
                <CardDescription>
                  Generate AI-personalized messages and send them via Email or WhatsApp directly to businesses.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedLead ? (
                  <div className="text-center py-8">
                    <Send className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                    <p className="font-medium">Select a lead to compose a message</p>
                    <p className="text-sm text-muted-foreground mt-1">Go to Leads tab and click &quot;Email&quot; or &quot;WhatsApp&quot; on any lead</p>
                    <Button className="mt-4" onClick={() => setActiveTab('leads')}>
                      <Users className="h-4 w-4 mr-2" /> Go to Leads
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lead Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{selectedLead.businessName}</p>
                        <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                          {selectedLead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selectedLead.phone}</span>}
                          {selectedLead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selectedLead.email}</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedLead(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Channel Toggle: Email / WhatsApp */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium">Send via:</Label>
                      <div className="flex rounded-lg border overflow-hidden">
                        <button
                          className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${msgChannel === 'email' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                          onClick={() => { setMsgChannel('email'); setMsgContent(''); }}
                        >
                          <Mail className="h-3.5 w-3.5" /> Email
                        </button>
                        <button
                          className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${msgChannel === 'whatsapp' ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                          onClick={() => { setMsgChannel('whatsapp'); setMsgContent(''); }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </button>
                      </div>
                    </div>

                    {/* Recipient fields */}
                    {msgChannel === 'email' ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Recipient Email</Label>
                        <Input placeholder="business@email.com" value={msgToEmail} onChange={(e) => setMsgToEmail(e.target.value)} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">WhatsApp Number</Label>
                        <Input placeholder="+91 98765 43210" value={msgToPhone} onChange={(e) => setMsgToPhone(e.target.value)} />
                        <p className="text-xs text-muted-foreground">Enter with country code (e.g., +91 for India). Message will open in WhatsApp.</p>
                      </div>
                    )}

                    {/* Service + Tone */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Service Type</Label>
                        <Select value={msgServiceType} onValueChange={setMsgServiceType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Services</SelectItem>
                            <SelectItem value="website_building">Website Building</SelectItem>
                            <SelectItem value="website_management">Website Management</SelectItem>
                            <SelectItem value="ai_agent_creation">AI Agent Creation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tone</Label>
                        <Select value={msgTone} onValueChange={setMsgTone}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Extra Notes (optional)</Label>
                      <Input placeholder="Any specific points to include..." value={msgNotes} onChange={(e) => setMsgNotes(e.target.value)} />
                    </div>

                    {/* Generate Button */}
                    <Button onClick={handleGenerateMessage} disabled={isGenerating} className={`gap-2 shadow-lg ${msgChannel === 'whatsapp' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/20' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20'}`}>
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isGenerating ? 'Generating...' : `Generate AI ${msgChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} Message`}
                    </Button>

                    {/* Message Preview */}
                    {msgContent && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <Separator />
                        {msgChannel === 'email' && msgSubject && (
                          <div>
                            <Label className="text-sm font-medium">Subject Line</Label>
                            <Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} className="mt-1" />
                          </div>
                        )}
                        <div>
                          <Label className="text-sm font-medium">{msgChannel === 'whatsapp' ? 'WhatsApp Message' : 'Email Body'}</Label>
                          <Textarea value={msgContent} onChange={(e) => setMsgContent(e.target.value)} rows={msgChannel === 'whatsapp' ? 6 : 10} className="mt-1" />
                        </div>

                        {/* Send Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => handleSendMessage(true)}
                            className={`gap-1.5 ${msgChannel === 'whatsapp' ? 'bg-green-500 hover:bg-green-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                            disabled={msgChannel === 'email' ? !msgToEmail.trim() : !msgToPhone.trim()}
                          >
                            {msgChannel === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                            {msgChannel === 'whatsapp' ? 'Open in WhatsApp' : 'Open in Email App'}
                          </Button>
                          <Button variant="outline" onClick={() => handleSendMessage(true)} className="gap-1.5">
                            <CheckCircle2 className="h-4 w-4" /> Mark as Sent
                          </Button>
                          <Button variant="outline" onClick={() => handleSendMessage(false)} className="gap-1.5">
                            <FileText className="h-4 w-4" /> Save Draft
                          </Button>
                          <Button variant="outline" onClick={handleCopy} className="gap-1.5">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            {copied ? 'Copied!' : 'Copy Message'}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== Profile Dialog ===== */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-emerald-500" /> Your Business Profile</DialogTitle>
            <DialogDescription>Set up your profile so AI generates personalized messages with your details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Your Name</Label><Input placeholder="John Smith" defaultValue={userProfile?.yourName || ''} id="profile-name" /></div>
            <div className="space-y-2"><Label>Your Email</Label><Input placeholder="john@yourcompany.com" defaultValue={userProfile?.yourEmail || ''} id="profile-email" /></div>
            <div className="space-y-2"><Label>Phone (with country code)</Label><Input placeholder="+91 98765 43210" defaultValue={userProfile?.yourPhone || ''} id="profile-phone" /></div>
            <div className="space-y-2"><Label>Service Name / Company</Label><Input placeholder="DigitalPro Solutions" defaultValue={userProfile?.serviceName || ''} id="profile-service" /></div>
            <div className="space-y-2"><Label>Your Website</Label><Input placeholder="https://yourcompany.com" defaultValue={userProfile?.yourWebsite || ''} id="profile-website" /></div>
            <div className="space-y-2"><Label>Company Description</Label><Textarea placeholder="We are a full-service digital agency..." rows={3} defaultValue={userProfile?.companyDesc || ''} id="profile-desc" /></div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => handleSaveProfile({
                yourName: (document.getElementById('profile-name') as HTMLInputElement)?.value,
                yourEmail: (document.getElementById('profile-email') as HTMLInputElement)?.value,
                yourPhone: (document.getElementById('profile-phone') as HTMLInputElement)?.value,
                serviceName: (document.getElementById('profile-service') as HTMLInputElement)?.value,
                yourWebsite: (document.getElementById('profile-website') as HTMLInputElement)?.value,
                companyDesc: (document.getElementById('profile-desc') as HTMLTextAreaElement)?.value,
              })}>Save Profile</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Message Compose Dialog (from Leads tab) ===== */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {msgChannel === 'whatsapp' ? <MessageCircle className="h-5 w-5 text-green-500" /> : <Mail className="h-5 w-5 text-emerald-500" />}
              {msgChannel === 'whatsapp' ? 'WhatsApp Message' : 'Compose Email'}
            </DialogTitle>
            <DialogDescription>{selectedLead && `To: ${selectedLead.businessName}`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Channel Switch */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${msgChannel === 'email' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50'}`}
                onClick={() => { setMsgChannel('email'); setMsgContent('') }}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
              <button
                className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${msgChannel === 'whatsapp' ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50'}`}
                onClick={() => { setMsgChannel('whatsapp'); setMsgContent('') }}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
            </div>

            {/* Recipient */}
            {msgChannel === 'email' ? (
              <div className="space-y-2">
                <Label className="text-sm">To (Email)</Label>
                <Input placeholder="business@email.com" value={msgToEmail} onChange={(e) => setMsgToEmail(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm">To (WhatsApp Number)</Label>
                <Input placeholder="+91 98765 43210" value={msgToPhone} onChange={(e) => setMsgToPhone(e.target.value)} />
                <p className="text-xs text-muted-foreground">Enter with country code. WhatsApp will open with pre-filled message.</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Service</Label>
                <Select value={msgServiceType} onValueChange={setMsgServiceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="website_building">Website Building</SelectItem>
                    <SelectItem value="website_management">Website Management</SelectItem>
                    <SelectItem value="ai_agent_creation">AI Agent Creation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Tone</Label>
                <Select value={msgTone} onValueChange={setMsgTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate */}
            <Button onClick={handleGenerateMessage} disabled={isGenerating} className={`w-full gap-2 ${msgChannel === 'whatsapp' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'}`}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Generating...' : `Generate AI ${msgChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} Message`}
            </Button>

            {msgContent && (
              <div className="space-y-3">
                {msgChannel === 'email' && msgSubject && (
                  <div className="space-y-1">
                    <Label className="text-sm">Subject</Label>
                    <Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-sm">Message</Label>
                  <Textarea value={msgContent} onChange={(e) => setMsgContent(e.target.value)} rows={msgChannel === 'whatsapp' ? 6 : 8} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleSendMessage(true)}
                    className={`gap-1.5 ${msgChannel === 'whatsapp' ? 'bg-green-500 hover:bg-green-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                    disabled={msgChannel === 'email' ? !msgToEmail.trim() : !msgToPhone.trim()}
                  >
                    {msgChannel === 'whatsapp' ? <><MessageCircle className="h-4 w-4" /> Open WhatsApp</> : <><Mail className="h-4 w-4" /> Open Email</>}
                  </Button>
                  <Button variant="outline" onClick={() => handleSendMessage(true)} className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Mark Sent
                  </Button>
                  <Button variant="outline" onClick={() => handleSendMessage(false)} className="gap-1.5">
                    <FileText className="h-4 w-4" /> Draft
                  </Button>
                  <Button variant="outline" onClick={handleCopy} className="gap-1.5">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>LeadFinder AI — AI-Powered Lead Generation Tool</p>
          <p>Send via Email & WhatsApp | Built with Next.js & Z.ai SDK</p>
        </div>
      </footer>
    </div>
  )
}

// SessionProvider wrapper
function AuthWrapper() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  )
}
export default AuthWrapper
