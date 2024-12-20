'use client'

import { useState, useRef, useEffect } from 'react'
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Type, Palette, Smile, Github, Undo, Redo, ImageIcon } from 'lucide-react'
import { Switch } from "@/components/ui/switch"

const fonts = ['Arial', 'Impact', 'Comic Sans MS', 'Courier New']
const emojiList = ['😂', '🤔', '😎', '🥳', '😱', '🤯', '🙄', '🤪']
const filters = ['none', 'grayscale', 'sepia', 'invert', 'blur', 'brightness', 'contrast']

const MAX_CANVAS_SIZE = 1200

export default function MemeGenerator() {
  const [image, setImage] = useState<string>('/placeholder.svg?height=400&width=400')
  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')
  const [fontSize, setFontSize] = useState(30)
  const [textColor, setTextColor] = useState('#ffffff')
  const [font, setFont] = useState(fonts[0])
  const [topTextY, setTopTextY] = useState(50)
  const [bottomTextY, setBottomTextY] = useState(350)
  const [memeEmojis, setMemeEmojis] = useState<Array<{emoji: string, x: number, y: number}>>([])
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [filter, setFilter] = useState('none')
  const [filterIntensity, setFilterIntensity] = useState(100)
  const [darkMode, setDarkMode] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedEmojiIndex, setDraggedEmojiIndex] = useState(-1)
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      let width = img.width
      let height = img.height
      
      // Scale down if image is too large
      if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
        const ratio = Math.min(MAX_CANVAS_SIZE / width, MAX_CANVAS_SIZE / height)
        width *= ratio
        height *= ratio
      }
      
      setCanvasSize({ width, height })
    }
    img.src = image
  }, [image])

  useEffect(() => {
    drawMeme()
    const currentState = { image, topText, bottomText, fontSize, textColor, font, topTextY, bottomTextY, memeEmojis, filter, filterIntensity }
    setHistory(prev => [...prev.slice(0, historyIndex + 1), currentState])
    setHistoryIndex(prev => prev + 1)
  }, [image, topText, bottomText, fontSize, textColor, font, topTextY, bottomTextY, memeEmojis, filter, filterIntensity, canvasSize])

  const drawMeme = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: false, willReadFrequently: true })
    if (!canvas || !ctx) return

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      if (filter !== 'none') {
        ctx.filter = `${filter}(${filterIntensity}%)`
        ctx.drawImage(canvas, 0, 0)
        ctx.filter = 'none'
      }

      drawText(ctx)
      drawEmojis(ctx)
    }
    img.src = image
  }

  const drawText = (ctx: CanvasRenderingContext2D) => {
    const scaleFactor = Math.min(canvasSize.width / 400, canvasSize.height / 400)
    const adjustedFontSize = fontSize * scaleFactor

    ctx.font = `${adjustedFontSize}px ${font}`
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = adjustedFontSize / 15

    const adjustedTopY = (topTextY / 400) * canvasSize.height
    const adjustedBottomY = (bottomTextY / 400) * canvasSize.height

    ctx.strokeText(topText, canvasSize.width / 2, adjustedTopY)
    ctx.fillText(topText, canvasSize.width / 2, adjustedTopY)

    ctx.strokeText(bottomText, canvasSize.width / 2, adjustedBottomY)
    ctx.fillText(bottomText, canvasSize.width / 2, adjustedBottomY)
  }

  const drawEmojis = (ctx: CanvasRenderingContext2D) => {
    const scaleFactor = Math.min(canvasSize.width / 400, canvasSize.height / 400)
    const adjustedFontSize = fontSize * scaleFactor

    memeEmojis.forEach(({emoji, x, y}) => {
      ctx.font = `${adjustedFontSize}px Arial`
      const adjustedX = (x / 400) * canvasSize.width
      const adjustedY = (y / 400) * canvasSize.height
      ctx.fillText(emoji, adjustedX, adjustedY)
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setImage(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png', 1.0)
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'meme.png'
    link.click()
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      const prevState = history[historyIndex - 1]
      Object.keys(prevState).forEach(key => {
        const setState = eval(`set${key.charAt(0).toUpperCase() + key.slice(1)}`)
        setState(prevState[key])
      })
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      const nextState = history[historyIndex + 1]
      Object.keys(nextState).forEach(key => {
        const setState = eval(`set${key.charAt(0).toUpperCase() + key.slice(1)}`)
        setState(nextState[key])
      })
    }
  }

  const handleAddEmoji = (emoji: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const newX = Math.random() * canvasSize.width
    const newY = Math.random() * canvasSize.height
    setMemeEmojis(prev => [...prev, { 
      emoji, 
      x: (newX / canvasSize.width) * 400,
      y: (newY / canvasSize.height) * 400
    }])
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 400
    const y = ((e.clientY - rect.top) / rect.height) * 400

    const clickedEmojiIndex = memeEmojis.findIndex(emoji => 
      Math.abs(emoji.x - x) < 20 && Math.abs(emoji.y - y) < 20
    )

    if (clickedEmojiIndex !== -1) {
      setIsDragging(true)
      setDraggedEmojiIndex(clickedEmojiIndex)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 400
    const y = ((e.clientY - rect.top) / rect.height) * 400

    setMemeEmojis(prev => prev.map((emoji, index) => 
      index === draggedEmojiIndex ? { ...emoji, x, y } : emoji
    ))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDraggedEmojiIndex(-1)
  }

  return (
    <div className={`transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              className="data-[state=checked]:bg-purple-600"
            />
            <Label>Modo Oscuro</Label>
          </div>
          <a href="https://github.com/sergio001g" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
            <Github className="h-6 w-6" />
          </a>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <Card className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <CardContent className="pt-6">
              <div ref={containerRef} className="w-full bg-gray-200 rounded-lg overflow-hidden shadow-inner flex items-center justify-center">
                <canvas 
                  ref={canvasRef}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleUndo} disabled={historyIndex <= 0} className="flex-1 bg-purple-700 hover:bg-purple-800">
                  <Undo className="mr-2 h-4 w-4" /> Deshacer
                </Button>
                <Button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="flex-1 bg-purple-700 hover:bg-purple-800">
                  <Redo className="mr-2 h-4 w-4" /> Rehacer
                </Button>
              </div>
              <Button onClick={handleDownload} className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 transform hover:scale-105">
                <Download className="mr-2 h-4 w-4" /> Descargar Meme
              </Button>
            </CardContent>
          </Card>
          <Card className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <CardContent>
              <Tabs defaultValue="image" className="w-full">
                <TabsList className={`grid w-full grid-cols-5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <TabsTrigger value="image" className={`data-[state=active]:${darkMode ? 'bg-purple-700' : 'bg-purple-200'} text-current`}><ImageIcon className="mr-2 h-4 w-4" /> Imagen</TabsTrigger>
                  <TabsTrigger value="text" className={`data-[state=active]:${darkMode ? 'bg-purple-700' : 'bg-purple-200'} text-current`}><Type className="mr-2 h-4 w-4" /> Texto</TabsTrigger>
                  <TabsTrigger value="style" className={`data-[state=active]:${darkMode ? 'bg-purple-700' : 'bg-purple-200'} text-current`}><Palette className="mr-2 h-4 w-4" /> Estilo</TabsTrigger>
                  <TabsTrigger value="emoji" className={`data-[state=active]:${darkMode ? 'bg-purple-700' : 'bg-purple-200'} text-current`}><Smile className="mr-2 h-4 w-4" /> Emoji</TabsTrigger>
                  <TabsTrigger value="filter" className={`data-[state=active]:${darkMode ? 'bg-purple-700' : 'bg-purple-200'} text-current`}><Palette className="mr-2 h-4 w-4" /> Filtro</TabsTrigger>
                </TabsList>
                <TabsContent value="image">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image-upload">Subir Imagen</Label>
                      <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className={darkMode ? 'bg-gray-700' : 'bg-gray-100'} />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="text">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="top-text">Texto Superior</Label>
                      <Input id="top-text" value={topText} onChange={(e) => setTopText(e.target.value)} className={darkMode ? 'bg-gray-700' : 'bg-gray-100'} />
                    </div>
                    <div>
                      <Label htmlFor="bottom-text">Texto Inferior</Label>
                      <Input id="bottom-text" value={bottomText} onChange={(e) => setBottomText(e.target.value)} className={darkMode ? 'bg-gray-700' : 'bg-gray-100'} />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="style">
                  <div className="space-y-4">
                    <div>
                      <Label>Tamaño de Fuente</Label>
                      <Slider
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                        min={10}
                        max={100}
                        step={1}
                        className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="text-color">Color de Texto</Label>
                      <Input id="text-color" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className={`h-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
                    </div>
                    <div>
                      <Label htmlFor="font-select">Fuente</Label>
                      <Select value={font} onValueChange={setFont}>
                        <SelectTrigger id="font-select" className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                          <SelectValue placeholder="Selecciona una fuente" />
                        </SelectTrigger>
                        <SelectContent>
                          {fonts.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Posición Texto Superior</Label>
                      <Slider
                        value={[topTextY]}
                        onValueChange={(value) => setTopTextY(value[0])}
                        min={0}
                        max={400}
                        step={1}
                        className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}
                      />
                    </div>
                    <div>
                      <Label>Posición Texto Inferior</Label>
                      <Slider
                        value={[bottomTextY]}
                        onValueChange={(value) => setBottomTextY(value[0])}
                        min={0}
                        max={400}
                        step={1}
                        className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="emoji">
                  <div className="space-y-4">
                    <div>
                      <Label>Añadir Emoji</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {emojiList.map((emoji) => (
                          <Button
                            key={emoji}
                            onClick={() => handleAddEmoji(emoji)}
                            className={`text-2xl ${darkMode ? 'bg-purple-700 hover:bg-purple-800' : 'bg-purple-200 hover:bg-purple-300'} text-current transition-all duration-300 transform hover:scale-110`}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                      <Button
                        onClick={() => setMemeEmojis(prev => prev.slice(0, -1))}
                        className={`mt-2 ${darkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-200 hover:bg-red-300'} text-current transition-all duration-300 transform hover:scale-110`}
                      >
                        Eliminar último emoji
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="filter">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="filter-select">Filtro</Label>
                      <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger id="filter-select" className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                          <SelectValue placeholder="Selecciona un filtro" />
                        </SelectTrigger>
                        <SelectContent>
                          {filters.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {filter !== 'none' && (
                      <div>
                        <Label>Intensidad del Filtro</Label>
                        <Slider
                          value={[filterIntensity]}
                          onValueChange={(value) => setFilterIntensity(value[0])}
                          min={0}
                          max={200}
                          step={1}
                          className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

