
"use client"

import { useState, useEffect } from "react"
import { BrainCircuit, RefreshCw, SlidersHorizontal, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LanguageSwitcher } from "./language-switcher"
import { useTranslation } from "react-i18next"
import { useDashboard } from "@/contexts/dashboard-context"


type DashboardHeaderProps = {
  onOpenProfile: () => void;
};

export function DashboardHeader({
  onOpenProfile,
}: DashboardHeaderProps) {
  const { 
    isDemo, 
    setIsDemo,
    isFetching,
    lastUpdated,
    autoRefresh,
    setAutoRefresh,
    fetchData
  } = useDashboard();
  const { t } = useTranslation();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleLogout = () => {
    router.push('/login');
  };
  
  if (!hasMounted) {
    return null; 
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur sm:h-16 sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger variant="outline" className="p-1" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          className="h-6 w-6 text-primary hidden md:block"
        >
          <rect width="256" height="256" fill="none" />
          <path
            d="M88,112a40,40,0,1,1,40,40"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
          <path
            d="M168,144a40,40,0,1,1-40-40"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
          <path
            d="M112,88a40,40,0,1,1-40-40"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
          <path
            d="M144,168a40,40,0,1,1,40-40"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
          <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="16"/>
        </svg>
        <h1 className="font-semibold md:text-xl whitespace-nowrap">{t('appTitle')}</h1>
      </div>
      <div className="flex w-full items-center justify-end gap-2 md:gap-4">
         {hasMounted && lastUpdated && (
          <span className="text-xs text-muted-foreground hidden lg:block">
            {t('lastUpdated', { time: formatDistanceToNow(lastUpdated, { addSuffix: true }) })}
          </span>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => fetchData(true)} disabled={isFetching}>
                    <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    <span className="sr-only">{t('refreshData')}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{t('refreshData')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="outline" size="sm" onClick={() => { /* onAnalyze prop would be needed */ }}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            {t('analyzeAnomalies')}
        </Button>

        <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="sr-only">{t('openSettings')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('settings')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                         <Label htmlFor="demo-mode" className="font-normal">
                            {t('demoMode')}
                        </Label>
                        <Switch id="demo-mode" checked={isDemo} onCheckedChange={setIsDemo} />
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                        <Label htmlFor="auto-refresh" className="font-normal">
                            {t('autoRefresh')}
                        </Label>
                        <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>

        <LanguageSwitcher />

        <ThemeToggle />

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                   <Avatar>
                        <AvatarImage src="https://picsum.photos/seed/user/32/32" data-ai-hint="profile avatar" />
                        <AvatarFallback>
                            <User />
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenProfile}>{t('profile')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>{t('settings')}</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>{t('logout')}</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
