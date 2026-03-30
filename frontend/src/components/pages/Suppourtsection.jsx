import { HelpCircle, Users, BookOpen, ArrowRight } from 'lucide-react';

export default function SupportSection() {
  const supportItems = [
    {
      icon: HelpCircle,
      title: 'FAQ Center',
      description: 'Find quick answers to common questions about our platform and services.',
     
    },
    {
      icon: Users,
      title: 'Community Forum',
      description: 'Connect with other users, share ideas, and learn best practices.',
      
    },
    {
      icon: BookOpen,
      title: 'Documentation',
      description: 'Detailed guides and API references for developers and businesses.',
     
    },
  ];

  return (
    <div className="support-grid">
      <div className="support-grid-inner">
        {supportItems.map((item, index) => (
          <div key={index} className="support-item">
            <div className="support-icon-wrap">
              <div className="support-icon">
                <item.icon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            
          </div>
        ))}
      </div>
    </div>
  );
}
