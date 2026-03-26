import {
  BarChart3,
  Bot,
  DatabaseZap,
  LayoutDashboard,
  Mail,
  Users,
} from 'lucide-react';

import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';

const data = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className='h-full w-full' />,
    section: 'dashboard',
  },
  {
    title: 'Leads DB',
    icon: <DatabaseZap className='h-full w-full' />,
    section: 'features',
  },
  {
    title: 'Campaigns',
    icon: <Users className='h-full w-full' />,
    section: 'how-it-works',
  },
  {
    title: 'AI Agents',
    icon: <Bot className='h-full w-full' />,
    section: 'features',
  },
  {
    title: 'Outreach',
    icon: <Mail className='h-full w-full' />,
    section: 'integrations',
  },
  {
    title: 'Analytics',
    icon: <BarChart3 className='h-full w-full' />,
    section: 'pricing',
  },
];

export function NavigationDock() {
  return (
    <div className='fixed bottom-6 left-1/2 max-w-full -translate-x-1/2 z-50 pointer-events-none'>
        <div className="pointer-events-auto">
            <Dock className='items-end pb-3'>
                {data.map((item, idx) => (
                <DockItem
                    key={idx}
                    className='aspect-square rounded-full bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors text-gray-400 backdrop-blur-md shadow-lg shadow-black/20'
                    onClick={() => document.getElementById(item.section)?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <DockLabel>{item.title}</DockLabel>
                    <DockIcon>{item.icon}</DockIcon>
                </DockItem>
                ))}
            </Dock>
        </div>
    </div>
  );
}
