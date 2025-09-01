import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Target, BarChart3, Clock, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BrandLogo } from '@/components/BrandLogo';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90" 
          style={{ backgroundImage: `url(/lovable-uploads/4ad9d4d2-d2a9-4e30-a6b4-fb178ecf6031.png)` }}
        />
        <div className="absolute inset-0 bg-gradient-primary opacity-20" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto animate-fade-in">
          {/* Logo and Brand */}
          <div className="mb-8">
            <BrandLogo size="xl" className="mb-6 justify-center" />
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              GRIT
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Build unshakeable discipline. Track habits, manage tasks, and achieve your goals with focused productivity.
            </p>
          </div>

          {/* Main Navigation Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
            <Card 
              className="p-8 bg-card/80 backdrop-blur-md border hover:shadow-elegant transition-all duration-300 cursor-pointer hover:scale-105"
              onClick={() => navigate('/app?view=tasks')}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-subtle rounded-2xl flex items-center justify-center mx-auto">
                  <CheckSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Tasks</h3>
                <p className="text-muted-foreground">
                  Organize and track your daily tasks with powerful productivity tools
                </p>
                <Button size="lg" className="w-full">
                  Get Started
                </Button>
              </div>
            </Card>

            <Card 
              className="p-8 bg-card/80 backdrop-blur-md border hover:shadow-elegant transition-all duration-300 cursor-pointer hover:scale-105"
              onClick={() => navigate('/app?view=habits')}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-subtle rounded-2xl flex items-center justify-center mx-auto">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Habits</h3>
                <p className="text-muted-foreground">
                  Build lasting habits and track your progress with smart insights
                </p>
                <Button size="lg" className="w-full">
                  Build Habits
                </Button>
              </div>
            </Card>

            <Card 
              className="p-8 bg-card/80 backdrop-blur-md border hover:shadow-elegant transition-all duration-300 cursor-pointer hover:scale-105"
              onClick={() => navigate('/app?view=reports')}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-subtle rounded-2xl flex items-center justify-center mx-auto">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Reports</h3>
                <p className="text-muted-foreground">
                  Analyze your productivity patterns and optimize your performance
                </p>
                <Button size="lg" className="w-full">
                  View Reports
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick Access */}
          <div className="mt-12 pt-8 border-t border-border/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-3 bg-card/50 backdrop-blur-md hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/today')}
              >
                <Clock className="h-5 w-5" />
                Today's Focus
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-3 bg-card/50 backdrop-blur-md hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/pomodoro')}
              >
                <Target className="h-5 w-5" />
                Pomodoro Timer
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-3 bg-card/50 backdrop-blur-md hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/app?view=calendar')}
              >
                <Calendar className="h-5 w-5" />
                Calendar
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-3 bg-card/50 backdrop-blur-md hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/profile')}
              >
                <User className="h-5 w-5" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;