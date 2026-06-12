'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitInterviewAnswers } from '@/app/actions/evaluation'

interface Question {
  id: number
  phase: 'TECHNICAL' | 'BEHAVIORAL'
  question: string
}

export default function InterviewRoom({
  initialQuestions,
  applicationId,
}: {
  initialQuestions: Question[]
  applicationId: string
}) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [questions] = useState<Question[]>(initialQuestions)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [currentTextAnswer, setCurrentTextAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(1200) // 20 minutes
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  // Camera init
  useEffect(() => {
    let stream: MediaStream | null = null
    async function enableCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true })
        setMediaStream(stream)
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        alert('Camera and Microphone permissions are required to conduct this AI interview.')
      }
    }
    enableCamera()
    return () => { stream?.getTracks().forEach((t) => t.stop()) }
  }, [])

  // Speech synthesis
  const speakQuestion = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices()
      const voice =
        voices.find((v) => v.lang.startsWith('en') && v.name.includes('Google')) ||
        voices.find((v) => v.lang.startsWith('en'))
      if (voice) utterance.voice = voice
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    const activeQuestion = questions[currentQuestionIndex]
    if (activeQuestion) speakQuestion(activeQuestion.question)
  }, [currentQuestionIndex, questions])

  // Countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmission()
      return
    }
    const interval = setInterval(() => setTimeLeft((p) => p - 1), 1000)
    return () => clearInterval(interval)
  }, [timeLeft])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const handleNextQuestion = () => {
    const q = questions[currentQuestionIndex]
    if (q) setAnswers((prev) => ({ ...prev, [q.id]: currentTextAnswer }))
    setCurrentTextAnswer('')
    if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex((p) => p + 1)
  }

  const handleFinalSubmission = async () => {
    mediaStream?.getTracks().forEach((t) => t.stop())
    window.speechSynthesis?.cancel()

    const formattedPayload = questions.map((q) => ({
      questionId: q.id,
      phase: q.phase,
      question: q.question,
      candidateAnswer: answers[q.id] || currentTextAnswer || 'No response recorded.',
    }))

    try {
      const result = await submitInterviewAnswers(applicationId, formattedPayload)
      if (result.success) {
        alert('Interview successfully scored! Redirecting...')
        router.push('/candidate/dashboard')
      }
    } catch (err) {
      console.error('Submission failed:', err)
      alert('Failed to transmit your evaluation files safely.')
    }
  }

  const activeQuestion = questions[currentQuestionIndex]
  const currentPhase = timeLeft > 600 ? 'TECHNICAL COMPETENCY PHASE' : 'PERSONALITY & LEADERSHIP PHASE'

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left/Center */}
      <div className="lg:col-span-2 space-y-6">
        {/* Phase & Timer Header */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">Current Phase</span>
            <h2 className="text-sm font-semibold text-slate-200">{currentPhase}</h2>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-bold tracking-widest text-rose-400 block">Time Remaining</span>
            <span className="text-2xl font-mono font-bold text-rose-500 animate-pulse">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Camera Feed */}
        <div className="relative aspect-video bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-3 py-1 rounded-full text-xs flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-300 font-medium">LIVE STREAM ON</span>
          </div>
        </div>

        {/* Question Card */}
        {activeQuestion && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {activeQuestion.phase}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed">
              &quot;{activeQuestion.question}&quot;
            </h3>
          </div>
        )}
      </div>

      {/* Right: Response Panel */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Your Response Workspace</h4>
        <p className="text-xs text-slate-400">
          Speak or type your answer. In a voice environment, speech-to-text populates this field in realtime.
        </p>
        <textarea
          value={currentTextAnswer}
          onChange={(e) => setCurrentTextAnswer(e.target.value)}
          rows={10}
          placeholder="Speak or type your answer clearly..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
        />
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNextQuestion}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-xl transition-all"
          >
            Lock Response & Next Question
          </button>
        ) : (
          <button
            onClick={handleFinalSubmission}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
          >
            Conclude & Complete Interview
          </button>
        )}
      </div>
    </div>
  )
}
