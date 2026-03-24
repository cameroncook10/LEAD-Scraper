import {
  BarChart3,
  Bot,
  DatabaseZap,
  LayoutDashboard,
  Mail,
  Settings,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';

const data = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className='h-full w-full' />,
    tab: 'Overview',
  },
  {
    title: 'Leads DB',
    icon: <DatabaseZap className='h-full w-full' />,
    tab: 'Leads',
  },
  {
    title: 'Campaigns',
    icon: <Users className='h-full w-full' />,
    tab: 'Campaigns',
  },
  {
    title: 'AI Agents',
    icon: <Bot className='h-full w-full' />,
    tab: 'Targeting',
  },
  {
    title: 'Outreach',
    icon: <Mail className='h-full w-full' />,
    tab: 'Inbox',
  },
  {
    title: 'Analytics',
    icon: <BarChart3 className='h-full w-full' />,
    tab: 'Analytics',
  },
  {
    title: 'Settings',
    icon: <Settings className='h-full w-full' />,
    tab: 'Settings',
  },
];

export function NavigationDock() {
  const navigate = useNavigate();

  return (
    <div className='fixed bottom-6 left-1/2 max-w-full -translate-x-1/2 z-50 pointer-events-none'>
        <div className="pointer-events-auto">
            <Dock className='items-end pb-3'>
                {data.map((item, idx) => (
                <DockItem
                    key={idx}
                    className='aspect-square rounded-full bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors text-gray-400 backdrop-blur-md shadow-lg shadow-black/20'
                    onClick={() => navigate(`/dashboard?tab=${item.tab}`)}
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
