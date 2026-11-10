import {
  Axe, Ban, Brain, Bug, Castle, Check, ChevronRight, ClipboardList, Coffee, Crosshair, Crown, Dumbbell, Eye, FastForward,
  Flame, Footprints, Gauge, Hand, Hexagon, List, Lock, Pause, Play, RotateCcw, ScanEye, ScrollText, Settings2, Shell, Shield,
  SkipForward, Sparkles, Star, Swords, Target, Trees, Trophy, Users, Video, WandSparkles, X, Zap, type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  Axe, Ban, Brain, Bug, Castle, Check, ChevronRight, ClipboardList, Coffee, Crosshair, Crown, Dumbbell, Eye, FastForward,
  Flame, Footprints, Gauge, Hand, Hexagon, List, Lock, Pause, Play, RotateCcw, ScanEye, ScrollText, Settings2, Shell, Shield,
  SkipForward, Sparkles, Star, Swords, Target, Trees, Trophy, Users, Video, Wand2: WandSparkles, X, Zap,
};
export function Ic({ n, className }: { n: string; className?: string }) {
  const C = MAP[n]; if (!C) return null;
  return <C className={'ic' + (className ? ' ' + className : '')} aria-hidden="true" />;
}
