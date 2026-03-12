import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { LogicFlow, LogicNode } from '../services/gemini';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw, Info, Cpu } from 'lucide-react';

interface FlowVisualizerProps {
  flow: LogicFlow;
}

export const FlowVisualizer: React.FC<FlowVisualizerProps> = ({ flow }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Layout calculation (Anime style: more dynamic/brutalist)
  const getLayoutNodes = () => {
    const nodeWidth = 260;
    const nodeHeight = 160;
    const cols = 3;
    
    return flow.nodes.map((n, i) => ({
      ...n,
      x: 180 + (i % cols) * nodeWidth + (i % 2 === 0 ? 20 : -20), // Add jitter for dynamic feel
      y: 120 + Math.floor(i / cols) * nodeHeight,
    }));
  };

  const nodes = getLayoutNodes();
  const edges = flow.edges.map(e => {
    const source = nodes.find(n => n.id === e.from);
    const target = nodes.find(n => n.id === e.to);
    return { ...e, source, target };
  });

  useEffect(() => {
    if (flow.nodes.length > 0) {
      setActiveNodeId(flow.nodes[0].id);
      setStep(0);
    }
  }, [flow]);

  const nextStep = () => {
    const nextIdx = (step + 1) % flow.nodes.length;
    setStep(nextIdx);
    setActiveNodeId(flow.nodes[nextIdx].id);
  };

  const resetZoom = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .ease(d3.easeBackOut)
      .call(zoomBehavior.transform, d3.zoomIdentity);
  };

  const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 4])
    .on('zoom', (event) => {
      d3.select(svgRef.current).select('g.zoom-container').attr('transform', event.transform);
      setZoomLevel(event.transform.k);
    });

  useEffect(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).call(zoomBehavior);
    }
  }, []);

  const activeNode = flow.nodes.find(n => n.id === activeNodeId);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#000] rounded-none overflow-hidden border-[4px] border-white shadow-[10px_10px_0px_0px_rgba(255,0,255,0.5)] relative group">
      {/* Anime Speed Lines Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,255,255,0.1)_20px,rgba(255,255,255,0.1)_21px)]" />
      </div>

      {/* Toolbar */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
        <div className="flex bg-white border-[3px] border-black p-1 shadow-[4px_4px_0px_0px_#000]">
          <button onClick={() => d3.select(svgRef.current!).transition().call(zoomBehavior.scaleBy, 1.5)} className="p-2 hover:bg-cyan-400 transition-colors text-black" title="ZOOM IN">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={() => d3.select(svgRef.current!).transition().call(zoomBehavior.scaleBy, 0.7)} className="p-2 hover:bg-magenta-400 border-l-[3px] border-black transition-colors text-black" title="ZOOM OUT">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={resetZoom} className="p-2 hover:bg-yellow-400 border-l-[3px] border-black transition-colors text-black" title="RESET">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-yellow-400 border-[3px] border-black px-4 py-1 flex items-center gap-2 shadow-[4px_4px_0px_0px_#000]">
          <span className="text-[12px] font-black text-black uppercase tracking-tighter">MAGNIFICATION</span>
          <span className="text-[14px] font-black text-black">{Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={nextStep}
          className="flex items-center gap-3 px-8 py-4 bg-cyan-400 text-black text-sm font-black uppercase italic tracking-tighter border-[4px] border-black hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
        >
          <span>NEXT PHASE</span>
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 cursor-crosshair">
        <svg ref={svgRef} className="w-full h-full">
          <defs>
            <filter id="anime-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#00ffff" floodOpacity="0.5" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="anime-arrow"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
            >
              <path d="M0,0 L12,6 L0,12 L3,6 Z" fill="#fff" />
            </marker>
            <marker
              id="anime-arrow-active"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
            >
              <path d="M0,0 L12,6 L0,12 L3,6 Z" fill="#00ffff" />
            </marker>
          </defs>

          <g className="zoom-container">
            {/* Edges */}
            {edges.map((edge, i) => {
              if (!edge.source || !edge.target) return null;
              const isActive = edge.from === activeNodeId || edge.to === activeNodeId;
              return (
                <g key={i}>
                  <motion.path
                    d={`M ${edge.source.x} ${edge.source.y} L ${edge.target.x} ${edge.target.y}`}
                    fill="none"
                    stroke={isActive ? "#00ffff" : "#ffffff"}
                    strokeWidth={isActive ? 6 : 3}
                    markerEnd={isActive ? "url(#anime-arrow-active)" : "url(#anime-arrow)"}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                  />
                  {edge.label && (
                    <g transform={`translate(${(edge.source.x + edge.target.x) / 2}, ${(edge.source.y + edge.target.y) / 2 - 20})`}>
                      <rect x="-60" y="-12" width="120" height="24" fill="#fff" stroke="#000" strokeWidth="3" />
                      <text
                        fill="#000"
                        fontSize="10"
                        fontWeight="900"
                        textAnchor="middle"
                        dy="4"
                        className="uppercase italic"
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isActive = node.id === activeNodeId;
              
              return (
                <motion.g
                  key={node.id}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ 
                    scale: isActive ? 1.2 : 1, 
                    opacity: 1,
                    x: node.x,
                    y: node.y,
                    rotate: isActive ? 0 : -2
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  onClick={() => setActiveNodeId(node.id)}
                  className="cursor-pointer"
                >
                  {/* Anime Node Shape (Brutalist) */}
                  <rect
                    x="-90"
                    y="-45"
                    width="180"
                    height="90"
                    fill={isActive ? "#00ffff" : "#fff"}
                    stroke="#000"
                    strokeWidth="6"
                    className="transition-colors duration-200"
                  />
                  
                  {/* Accent bar */}
                  <rect
                    x="-90"
                    y="-45"
                    width="10"
                    height="90"
                    fill="#000"
                  />

                  <text
                    fill="#000"
                    textAnchor="middle"
                    x="5"
                    dy=".3em"
                    fontSize="16"
                    fontWeight="900"
                    className="uppercase italic tracking-tighter pointer-events-none"
                  >
                    {node.label}
                  </text>

                  {isActive && (
                    <motion.rect
                      initial={{ scale: 1.2, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      x="-90"
                      y="-45"
                      width="180"
                      height="90"
                      fill="none"
                      stroke="#00ffff"
                      strokeWidth="4"
                    />
                  )}
                </motion.g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Anime Info Panel (Brutalist Style) */}
      <AnimatePresence mode="wait">
        {activeNode && (
          <motion.div
            key={activeNode.id}
            initial={{ x: 100, opacity: 0, skewX: -10 }}
            animate={{ x: 0, opacity: 1, skewX: 0 }}
            exit={{ x: -100, opacity: 0, skewX: 10 }}
            className="absolute bottom-12 right-12 w-[450px] bg-white border-[6px] border-black p-8 shadow-[15px_15px_0px_0px_#ff00ff] z-20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-black text-white px-4 py-1 text-[12px] font-black uppercase italic tracking-widest">
                PHASE {step + 1} // {activeNode.type}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-black rounded-none" />)}
              </div>
            </div>

            <h4 className="text-4xl font-black text-black mb-4 tracking-tighter uppercase italic leading-none border-b-[6px] border-black pb-2">
              {activeNode.label}
            </h4>
            
            <p className="text-black text-lg font-bold leading-tight mb-8">
              {activeNode.description}
            </p>

            <div className="grid grid-cols-1 gap-6 mb-8">
              {activeNode.inputs && activeNode.inputs.length > 0 && (
                <div className="space-y-2">
                  <span className="bg-cyan-400 text-black px-2 py-0.5 text-[10px] font-black uppercase border-[2px] border-black">INPUT_DATA</span>
                  <div className="flex flex-wrap gap-2">
                    {activeNode.inputs.map((v, i) => (
                      <span key={i} className="px-3 py-1 bg-black text-white text-[12px] font-black italic">{v}</span>
                    ))}
                  </div>
                </div>
              )}
              {activeNode.outputs && activeNode.outputs.length > 0 && (
                <div className="space-y-2">
                  <span className="bg-magenta-400 text-black px-2 py-0.5 text-[10px] font-black uppercase border-[2px] border-black">OUTPUT_RESULT</span>
                  <div className="flex flex-wrap gap-2">
                    {activeNode.outputs.map((v, i) => (
                      <span key={i} className="px-3 py-1 bg-black text-white text-[12px] font-black italic">{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {activeNode.functionCalls && activeNode.functionCalls.length > 0 && (
              <div className="mb-8 space-y-2">
                <span className="bg-yellow-400 text-black px-2 py-0.5 text-[10px] font-black uppercase border-[2px] border-black">MODULE_EXECUTION</span>
                <div className="flex flex-wrap gap-2">
                  {activeNode.functionCalls.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000]">
                      <Cpu className="w-4 h-4 text-black" />
                      <span className="text-sm font-black italic">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeNode.details && (
              <div className="bg-black p-6 border-[4px] border-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-6 bg-cyan-400" />
                  <span className="text-[12px] font-black text-white uppercase tracking-widest">TECHNICAL_SPEC</span>
                </div>
                <p className="text-white text-sm font-bold font-mono leading-relaxed italic">
                  {activeNode.details}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
