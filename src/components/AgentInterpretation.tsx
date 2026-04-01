import React from 'react';
import { motion } from 'motion/react';
import { Shield, Box, Link, Cpu, ListChecks } from 'lucide-react';
import { AgentInterpretation as IAgentInterpretation } from '../services/gemini';

interface Props {
  interpretation: IAgentInterpretation;
}

export const AgentInterpretation: React.FC<Props> = ({ interpretation }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Constraints */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">约束控制 (Constraints)</h3>
        </div>
        <ul className="space-y-3">
          {interpretation.constraints.map((c, i) => (
            <li key={i} className="flex gap-3 text-sm text-zinc-400 leading-relaxed">
              <span className="text-emerald-500 font-bold">#</span>
              {c}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Architecture Type */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Cpu className="w-5 h-5 text-cyan-500" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">架构模式 (Architecture)</h3>
        </div>
        <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 font-bold text-lg mb-4">
          {interpretation.architectureType}
        </div>
        <p className="text-sm text-zinc-500 italic">
          识别出的核心工程范式，决定了 Agent 的决策与执行逻辑。
        </p>
      </motion.div>

      {/* Prompt Encapsulation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-magenta-500/20 rounded-lg">
            <Box className="w-5 h-5 text-magenta-500" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Prompt 封装 (Encapsulation)</h3>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
          {interpretation.promptEncapsulation}
        </p>
      </motion.div>

      {/* Invocation Chain */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Link className="w-5 h-5 text-yellow-500" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">调用链路 (Invocation Chain)</h3>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
          {interpretation.invocationChain}
        </p>
      </motion.div>
    </div>
  );
};
