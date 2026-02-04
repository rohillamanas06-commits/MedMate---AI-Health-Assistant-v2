import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, User, Menu, Settings, Moon, Sun, Info, HeartPulse, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { BuyCreditsModal } from './BuyCreditsModal';

export const Navbar = () => {
  const { user, logout, checkAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsSheetOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSheetOpen(false);
  };

  const handleBuyCredits = () => {
    setShowBuyCredits(true);
    setIsSheetOpen(false);
  };

  const handleCreditsSuccess = async () => {
    await checkAuth();
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Moon className="h-4 w-4 mr-2" />;
    if (theme === 'dark') return <HeartPulse className="h-4 w-4 mr-2" />;
    return <Sun className="h-4 w-4 mr-2" />;
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Dark Mode';
    if (theme === 'dark') return 'Med Mode';
    return 'Light Mode';
  };

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => {
    const linkClass = "text-foreground hover:text-primary transition-colors";
    
    if (isMobile) {
      return (
        <>
          <button onClick={() => handleNavigation('/')} className={`${linkClass} text-left w-full`}>
            Home
          </button>
          {user ? (
            <>
              <button onClick={() => handleNavigation('/dashboard')} className={`${linkClass} text-left w-full`}>
                Dashboard
              </button>
              <button onClick={() => handleNavigation('/diagnose')} className={`${linkClass} text-left w-full`}>
                Diagnosis
              </button>
              <button onClick={() => handleNavigation('/chat')} className={`${linkClass} text-left w-full`}>
                AI Chat
              </button>
              <button onClick={() => handleNavigation('/hospitals')} className={`${linkClass} text-left w-full`}>
                Find Hospitals
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleNavigation('/about')} className={`${linkClass} text-left w-full`}>
                About
              </button>
            </>
          )}
        </>
      );
    }
    
    return (
      <>
        <Link to="/" className={linkClass}>
          Home
        </Link>
        {user ? (
          <>
            <Link to="/dashboard" className={linkClass}>
              Dashboard
            </Link>
            <Link to="/diagnose" className={linkClass}>
              Diagnosis
            </Link>
            <Link to="/chat" className={linkClass}>
              AI Chat
            </Link>
            <Link to="/hospitals" className={linkClass}>
              Find Hospitals
            </Link>
          </>
        ) : (
          <>
            <Link to="/about" className={linkClass}>
              About
            </Link>
          </>
        )}
      </>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl gradient-text">MedMate</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <NavLinks />
        </div>

        {/* User Menu */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <>
              <button 
                onClick={handleBuyCredits}
                className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 backdrop-blur-sm transition-all duration-300 cursor-pointer group"
                title="Buy more credits"
              >
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {user.credits || 0}
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBuyCredits}>
                    <Coins className="h-4 w-4 mr-2" />
                    Buy Credits
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {getThemeIcon()}
                    {getThemeLabel()}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/about')}>
                    <Info className="h-4 w-4 mr-2" />
                    About
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Login
              </Button>
              <Button onClick={() => navigate('/auth')}>Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background">
            <div className="flex flex-col space-y-4 mt-8">
              <NavLinks isMobile={true} />
              {user ? (
                <>
                  <Button variant="outline" onClick={handleBuyCredits} className="justify-start">
                    <Coins className="h-4 w-4 mr-2" />
                    Buy Credits
                  </Button>
                  <Button variant="outline" onClick={() => handleNavigation('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <Button variant="outline" onClick={() => handleNavigation('/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="outline" onClick={toggleTheme}>
                    {getThemeIcon()}
                    {getThemeLabel()}
                  </Button>
                  <Button variant="outline" onClick={() => handleNavigation('/about')}>
                    <Info className="h-4 w-4 mr-2" />
                    About
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { navigate('/auth'); setIsSheetOpen(false); }}>
                    Login
                  </Button>
                  <Button onClick={() => { navigate('/auth'); setIsSheetOpen(false); }}>Get Started</Button>
                  <Button variant="outline" onClick={() => handleNavigation('/about')}>
                    <Info className="h-4 w-4 mr-2" />
                    About
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Buy Credits Modal */}
      {user && (
        <BuyCreditsModal
          isOpen={showBuyCredits}
          onClose={() => setShowBuyCredits(false)}
          onSuccess={handleCreditsSuccess}
          currentCredits={user.credits || 0}
        />
      )}
    </nav>
  );
};
