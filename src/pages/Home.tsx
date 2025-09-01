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

          {/* Primary Navigation Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
            <Card 
              className="p-10 bg-card/90 backdrop-blur-lg border hover:shadow-glow transition-all duration-500 cursor-pointer group hover:scale-110 hover:-translate-y-2"
              onClick={() => navigate('/app?view=tasks')}
            >
              <div className="text-center space-y-5">
                <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <CheckSquare className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Check Tasklist</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Organize and prioritize your tasks with intelligent productivity features
                </p>
                <Button size="lg" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                  View Tasks
                </Button>
              </div>
            </Card>

            <Card 
              className="p-10 bg-card/90 backdrop-blur-lg border hover:shadow-glow transition-all duration-500 cursor-pointer group hover:scale-110 hover:-translate-y-2"
              onClick={() => navigate('/app?view=habits')}
            >
              <div className="text-center space-y-5">
                <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Track Habits</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Build lasting habits and monitor your consistency with visual insights
                </p>
                <Button size="lg" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                  Track Progress
                </Button>
              </div>
            </Card>

            <Card 
              className="p-10 bg-card/90 backdrop-blur-lg border hover:shadow-glow transition-all duration-500 cursor-pointer group hover:scale-110 hover:-translate-y-2"
              onClick={() => navigate('/app?view=reports')}
            >
              <div className="text-center space-y-5">
                <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Check Report</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Analyze performance metrics and optimize your productivity patterns
                </p>
                <Button size="lg" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                  View Analytics
                </Button>
              </div>
            </Card>
          </div>

          {/* Secondary Quick Access */}
          <div className="mt-16 pt-8 border-t border-border/30">
            <h3 className="text-lg font-semibold text-center text-foreground mb-8">Quick Access</h3>
            <div className="flex justify-center gap-6 max-w-2xl mx-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-3 bg-card/60 backdrop-blur-lg hover:scale-110 hover:shadow-elegant transition-all duration-300 border-primary/20 hover:border-primary/40"
                onClick={() => navigate('/pomodoro')}
              >
                <Clock className="h-5 w-5" />
                Pomodoro
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-3 bg-card/60 backdrop-blur-lg hover:scale-110 hover:shadow-elegant transition-all duration-300 border-primary/20 hover:border-primary/40"
                onClick={() => navigate('/app?view=calendar')}
              >
                <Calendar className="h-5 w-5" />
                Calendar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;