'use client';

import { useState, useEffect, useCallback } from 'react';
import { Truck, AgentEvent, ArbitrageOpportunity } from '../types';

const initialTrucks: Truck[] = [
  {
    id: 'TRK-402',
    cargoValue: 120000,
    velocity: 68,
    status: 'on-time',
    position: [73.7567, 18.4704],
    destination: [73.9067, 18.5704],
    route: [[73.7567, 18.4704], [73.7867, 18.4904], [73.8267, 18.5204], [73.8667, 18.5504], [73.9067, 18.5704]],
    driver: 'Priya Sharma'
  }
];

const events: Array<{ time: number; action: (trucks: Truck[]) => Partial<{ trucks: Truck[]; events: AgentEvent[]; arbitrage: ArbitrageOpportunity | null }> }> = [
  {
    time: 2000,
    action: () => ({ events: [{ id: `evt-${Date.now()}`, timestamp: new Date(), type: 'sensor', message: 'GPS sensors operational', severity: 'info' }] })
  },
  {
    time: 5000,
    action: (trucks) => ({
      trucks: trucks.map(t => t.id === 'TRK-402' ? { ...t, velocity: 0, status: 'delayed' as const } : t),
      events: [{ id: `evt-${Date.now()}`, timestamp: new Date(), type: 'alert', message: 'TRK-402 velocity dropped to 0 km/h', severity: 'warning' }]
    })
  },
  {
    time: 8000,
    action: (trucks) => ({
      trucks: trucks.map(t => t.id === 'TRK-402' ? { ...t, velocity: 0, status: 'critical' as const } : t),
      events: [{ id: `evt-${Date.now()}`, timestamp: new Date(), type: 'alert', message: 'TRK-402 CRITICAL - SLA threshold exceeded', severity: 'critical' }]
    })
  },
  {
    time: 12000,
    action: () => ({
      arbitrage: { truckId: 'TRK-402', projectedPenalty: 2500, solutionType: 'Relief Truck via Spot Market', solutionCost: 800, netSavings: 1700, details: 'Deploy backup truck - ETA 45 min' },
      events: [{ id: `evt-${Date.now()}`, timestamp: new Date(), type: 'arbitrage', message: '💎 ARBITRAGE OPPORTUNITY - Net Savings: $1,700', severity: 'critical' }]
    })
  }
];

export function useSupplyChainStream() {
  const [trucks, setTrucks] = useState<Truck[]>(initialTrucks);
  const [eventsLog, setEventsLog] = useState<AgentEvent[]>([{ id: 'init', timestamp: new Date(), type: 'system', message: '🚀 Agent initialized', severity: 'info' }]);
  const [arbitrage, setArbitrage] = useState<ArbitrageOpportunity | null>(null);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    events.forEach(({ time, action }) => {
      const timer = setTimeout(() => {
        setTrucks(current => {
          const result = action(current);
          if (result.events) setEventsLog(prev => [...result.events!, ...prev]);
          if (result.arbitrage !== undefined) setArbitrage(result.arbitrage);
          return result.trucks || current;
        });
      }, time);
      timers.push(timer);
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const executeArbitrage = useCallback(() => {
    setEventsLog(prev => [{ id: `evt-${Date.now()}`, timestamp: new Date(), type: 'system', message: '✅ Solution executed', severity: 'info' }, ...prev]);
    setTimeout(() => {
      setTrucks(prev => prev.map(t => t.id === arbitrage?.truckId ? { ...t, velocity: 65, status: 'on-time' as const } : t));
      setArbitrage(null);
    }, 2000);
  }, [arbitrage]);

  const dismissArbitrage = useCallback(() => {
    setArbitrage(null);
    setEventsLog(prev => [{ id: `evt-${Date.now()}`, timestamp: new Date(), type: 'system', message: 'Arbitrage opportunity dismissed', severity: 'info' }, ...prev]);
  }, []);

  return { trucks, events: eventsLog, arbitrageOpportunity: arbitrage, executeArbitrage, dismissArbitrage };
}
