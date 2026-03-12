import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
  FileCode, 
  Search, 
  Loader2,
  Terminal,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { analyzeCode, AnalysisResult } from './services/gemini';
import { FlowVisualizer } from './components/FlowVisualizer';

export default function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeFlowIndex, setActiveFlowIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCodeVisible, setIsCodeVisible] = useState(true);
  const [projectRoot, setProjectRoot] = useState<string>('');
  const [rootInput, setRootInput] = useState<string>('');

  useEffect(() => {
    fetchCwd();
  }, []);

  const fetchCwd = async () => {
    try {
      const res = await fetch('/api/cwd');
      const data = await res.json();
      setProjectRoot(data.cwd);
      setRootInput(data.cwd);
      fetchFiles(data.cwd);
    } catch (e) {
      console.error('Failed to fetch CWD');
    }
  };

  const fetchFiles = async (root: string) => {
    try {
      const res = await fetch(`/api/files?root=${encodeURIComponent(root)}`);
      if (!res.ok) throw new Error('Directory not found');
      const data = await res.json();
      setFiles(data.files);
      setProjectRoot(data.root);
    } catch (e) {
      alert('目录不存在或无法访问');
    }
  };

  const handleRootChange = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(rootInput);
  };

  const handleFileSelect = async (path: string) => {
    setSelectedFile(path);
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(path)}&root=${encodeURIComponent(projectRoot)}`);
      const data = await res.json();
      setFileContent(data.content);
      setAnalysis(null);
    } catch (e) {
      console.error('Failed to read file');
    }
  };

  const handleAnalyze = async () => {
    if (!fileContent || !selectedFile) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeCode(fileContent, selectedFile);
      setAnalysis(result);
      setActiveFlowIndex(0);
      // Automatically hide code panel to maximize visualization on success
      setIsCodeVisible(false);
    } catch (e) {
      alert('分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center px-8 justify-between bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Cpu className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">CodeLogic <span className="text-emerald-500">Visualizer</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCodeVisible(!isCodeVisible)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              isCodeVisible ? 'bg-white/10 text-white border-white/20' : 'bg-zinc-900 text-zinc-500 border-white/5'
            }`}
          >
            {isCodeVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isCodeVisible ? '隐藏代码' : '显示代码'}
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                开始逻辑分析
              </>
            )}
          </button>
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)] relative">
        {/* Sidebar: File Explorer */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
          className="border-r border-white/5 flex flex-col bg-zinc-950/50 overflow-hidden relative"
        >
          <div className="p-4 border-b border-white/5 flex flex-col gap-4 min-w-[280px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              Project Files
            </span>

            {/* Directory Selection */}
            <form onSubmit={handleRootChange} className="space-y-2">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">分析目录</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={rootInput}
                  onChange={(e) => setRootInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-white/5 rounded-md px-2 py-1.5 text-[10px] text-zinc-400 focus:outline-none focus:border-emerald-500/30 transition-colors"
                  placeholder="输入绝对路径..."
                />
                <button type="submit" className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-md transition-colors text-zinc-500">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 min-w-[280px]">
            {files.map((file) => (
              <button
                key={file}
                onClick={() => handleFileSelect(file)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex items-center gap-3 group ${
                  selectedFile === file 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' 
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300 border border-transparent'
                }`}
              >
                <FileCode className={`w-4 h-4 ${selectedFile === file ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                <span className="truncate font-medium">{file}</span>
              </button>
            ))}
          </div>
        </motion.aside>

        {/* Sidebar Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-[calc(isSidebarOpen?280px:0px)] top-1/2 -translate-y-1/2 z-40 w-5 h-12 bg-zinc-900 border border-white/10 rounded-r-lg flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:bg-emerald-500/20"
          style={{ left: isSidebarOpen ? 280 : 0 }}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Preview (Collapsible) */}
          <AnimatePresence initial={false}>
            {isCodeVisible && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '35%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-r border-white/5 flex flex-col bg-zinc-950/20 overflow-hidden"
              >
                <div className="p-4 border-b border-white/5 bg-zinc-950/40 flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Source Code</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                  </div>
                </div>
                <pre className="flex-1 p-6 overflow-auto text-[12px] font-mono leading-relaxed text-zinc-500 scrollbar-hide selection:bg-emerald-500/20">
                  <code className="block">{fileContent || '// Select a file to begin analysis'}</code>
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visualization Area (Primary) */}
          <div className="flex-1 flex flex-col bg-[#050505] p-6 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!analysis ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full" />
                    <div className="w-32 h-32 rounded-[40px] bg-zinc-900 flex items-center justify-center border border-white/10 relative z-10 shadow-2xl">
                      <Code2 className="w-16 h-16 text-emerald-500" />
                    </div>
                  </div>
                  <div className="max-w-md">
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Code Intelligence</h2>
                    <p className="text-zinc-500 text-lg leading-relaxed">
                      Select a source file from the explorer and trigger the AI analysis to visualize its underlying logic architecture.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="analysis"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col gap-6 overflow-hidden"
                >
                  {/* Summary & Flows Header */}
                  <div className="flex flex-col gap-4">
                    <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Analysis Summary</h3>
                      </div>
                      <p className="text-base text-zinc-400 leading-relaxed font-medium">{analysis.summary}</p>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {analysis.flows.map((flow, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveFlowIndex(idx)}
                          className={`px-6 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                            activeFlowIndex === idx
                              ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                              : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-white/20'
                          }`}
                        >
                          {flow.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visualizer (Full Space) */}
                  <div className="flex-1 min-h-0">
                    <FlowVisualizer flow={analysis.flows[activeFlowIndex]} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
