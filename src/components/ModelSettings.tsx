import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Cpu, Shield, Key, Check, ChevronRight } from 'lucide-react';
import { ModelConfig, LLMProvider } from '../services/gemini';

interface Props {
  config: ModelConfig;
  onSave: (config: ModelConfig) => void;
}

export const ModelSettings: React.FC<Props> = ({ config, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<ModelConfig>(config);

  // Sync tempConfig when modal opens to ensure it reflects current global config
  useEffect(() => {
    if (isOpen) {
      setTempConfig(config);
    }
  }, [isOpen, config]);

  const handleSave = () => {
    onSave(tempConfig);
    setIsOpen(false);
  };

  const providers: { id: LLMProvider; name: string; description: string; icon: any; color: string; bgColor: string; borderColor: string }[] = [
    { 
      id: 'gemini', 
      name: 'Google Gemini', 
      description: 'Google AI Studio / Vertex AI',
      icon: Cpu,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    { 
      id: 'qwen', 
      name: 'Alibaba Qwen', 
      description: 'DashScope / 通义千问',
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
  ];

  const models: Record<LLMProvider, string[]> = {
    gemini: ['gemini-3.1-pro-preview', 'gemini-3.1-flash-preview', 'gemini-3-flash-preview'],
    qwen: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl transition-all text-zinc-400 hover:text-white group shadow-lg"
      >
        <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
        <span className="text-[11px] font-black uppercase tracking-widest">模型设置 / Settings</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Settings className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">模型配置</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">LLM Engine Configuration</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                {/* Provider Selection - 2 Column Grid */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-1">选择供应商 / Provider</label>
                  <div className="grid grid-cols-2 gap-4">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setTempConfig({ ...tempConfig, provider: p.id, modelName: models[p.id][0] })}
                        className={`group relative flex flex-col items-center justify-center p-6 rounded-3xl border transition-all text-center gap-3 ${
                          tempConfig.provider === p.id
                            ? `${p.bgColor} ${p.borderColor} ring-2 ring-white/5`
                            : 'bg-zinc-900/20 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                          tempConfig.provider === p.id ? 'bg-white text-black scale-110 shadow-xl' : `bg-zinc-900 ${p.color} group-hover:scale-105`
                        }`}>
                          <p.icon className="w-6 h-6" />
                        </div>
                        
                        <div className="space-y-1">
                          <span className={`text-sm font-black tracking-tight block ${tempConfig.provider === p.id ? 'text-white' : 'text-zinc-400'}`}>
                            {p.name}
                          </span>
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${tempConfig.provider === p.id ? 'text-white/40' : 'text-zinc-600'}`}>
                            {p.id === 'gemini' ? 'Google' : 'Alibaba'}
                          </p>
                        </div>

                        {tempConfig.provider === p.id && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">模型选择 / Model</label>
                    <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">
                      {tempConfig.modelName}
                    </span>
                  </div>
                  <div className="relative group">
                    <select
                      value={tempConfig.modelName}
                      onChange={(e) => setTempConfig({ ...tempConfig, modelName: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer hover:bg-zinc-800/50 font-medium"
                    >
                      {models[tempConfig.provider].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-hover:text-emerald-500 transition-colors">
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* API Key */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Key className="w-3 h-3" />
                      API 密钥 / API Key
                    </label>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-900 border border-white/5 ${
                      tempConfig.provider === 'qwen' ? 'text-purple-400' : 'text-blue-400'
                    }`}>
                      {tempConfig.provider === 'qwen' ? 'DashScope' : 'Google AI'}
                    </span>
                  </div>
                  <div className="relative group">
                    <input
                      type="password"
                      value={tempConfig.apiKey || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, apiKey: e.target.value })}
                      placeholder={tempConfig.provider === 'qwen' ? "输入 DashScope API Key..." : "输入 Gemini API Key..."}
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 font-mono"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-emerald-500/50 transition-colors">
                      <Shield className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                      提示：留空将默认使用系统环境变量。Qwen 模型需要通义千问 (DashScope) 的 API 密钥。
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-zinc-900/30 border-t border-white/5 flex gap-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
                >
                  取消 / Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-8 py-4 bg-emerald-500 text-black text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  保存配置 / Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
