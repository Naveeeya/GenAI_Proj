'use client';

import React from 'react';
import { AgentEvent } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  X 
} from 'lucide-react';

interface AgentOverlayProps {
  events: AgentEvent[];
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentOverlay({ events, isOpen, onClose }: AgentOverlayProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle2;
      case 'alert': return AlertTriangle;
      case 'opportunity': return TrendingUp;
      default: return Activity;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'alert': return 'text-amber-400';
      case 'opportunity': return 'text-teal-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-[9999] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Agent Stream</h3>
              <p className="text-xs text-slate-400">Real-time system intelligence</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Events list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {events.slice().reverse().map((event, index) => {
                const Icon = getIcon(event.type);
                const colorClass = getColor(event.type);

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-lg p-3 hover:border-white/20 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {event.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {events.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Waiting for events...</p>
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="p-4 border-t border-white/10 bg-slate-950/50">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-teal-400">{events.length}</div>
                <div className="text-xs text-slate-400">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {events.filter(e => e.type === 'system').length}
                </div>
                <div className="text-xs text-slate-400">Actions Taken</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
